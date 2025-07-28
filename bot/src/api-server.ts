import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { Client } from 'discord.js'
import { Database } from './database'

interface DiscordTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  global_name: string | null
  avatar: string | null
  bot?: boolean
  system?: boolean
  mfa_enabled?: boolean
  banner?: string | null
  accent_color?: number | null
  locale?: string
  verified?: boolean
  email?: string | null
  flags?: number
  premium_type?: number
  public_flags?: number
}

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
  features: string[]
}

export class ApiServer {
  private app: express.Application
  private client: Client
  private database: Database
  private discordClientId: string
  private discordClientSecret: string

  constructor(client: Client, database: Database) {
    this.app = express()
    this.client = client
    this.database = database
    this.discordClientId = process.env.DISCORD_CLIENT_ID || ''
    this.discordClientSecret = process.env.DISCORD_CLIENT_SECRET || ''
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware() {
    this.app.use(cors())
    this.app.use(express.json())
  }

  private setupRoutes() {
    // Get bot status and configuration
    this.app.get('/api/bot/status', (req, res) => {
      res.json({
        online: this.client.isReady(),
        username: this.client.user?.username,
        discriminator: this.client.user?.discriminator,
        guilds: this.client.guilds.cache.size,
        uptime: this.client.uptime
      })
    })

    // Get available Discord channels for a guild
    this.app.get('/api/bot/channels/:guildId', (req, res) => {
      const { guildId } = req.params
      const guild = this.client.guilds.cache.get(guildId)
      
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' })
      }

      const channels = guild.channels.cache
        .filter(channel => channel.isTextBased() && !channel.isDMBased())
        .map(channel => ({
          id: channel.id,
          name: channel.name,
          type: channel.type
        }))

      res.json({ channels })
    })

    // Get bot configuration
    this.app.get('/api/bot/config', async (req, res) => {
      try {
        const config = await this.database.getGlobalConfig()
        const monitoring = await this.database.getMonitoredAlliances()
        
        res.json({
          config,
          monitoring,
          guilds: this.client.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount
          }))
        })
      } catch (error) {
        console.error('Error getting bot config:', error)
        res.status(500).json({ error: 'Failed to get configuration' })
      }
    })

    // Update notification channel
    this.app.post('/api/bot/config/channel', async (req, res) => {
      try {
        const { guildId, channelId } = req.body
        
        await this.database.setNotificationChannel(guildId, channelId)
        res.json({ success: true })
      } catch (error) {
        console.error('Error setting notification channel:', error)
        res.status(500).json({ error: 'Failed to set notification channel' })
      }
    })

    // Get monitored alliances
    this.app.get('/api/bot/monitoring', async (req, res) => {
      try {
        const alliances = await this.database.getMonitoredAlliances()
        res.json({ alliances })
      } catch (error) {
        console.error('Error getting monitored alliances:', error)
        res.status(500).json({ error: 'Failed to get monitored alliances' })
      }
    })

    // Add alliance to monitoring
    this.app.post('/api/bot/monitoring', async (req, res) => {
      try {
        const { allianceId, guildId, channelId, userId } = req.body
        
        await this.database.addMonitoredAlliance(allianceId, guildId, channelId, userId || 'web-interface')
        res.json({ success: true })
      } catch (error) {
        console.error('Error adding monitored alliance:', error)
        res.status(500).json({ error: 'Failed to add monitored alliance' })
      }
    })

    // Remove alliance from monitoring
    this.app.delete('/api/bot/monitoring/:allianceId/:guildId', async (req, res) => {
      try {
        const { allianceId, guildId } = req.params
        
        await this.database.removeMonitoredAlliance(parseInt(allianceId), guildId)
        res.json({ success: true })
      } catch (error) {
        console.error('Error removing monitored alliance:', error)
        res.status(500).json({ error: 'Failed to remove monitored alliance' })
      }
    })

    // Discord OAuth endpoints
    
    // Exchange OAuth code for access token
    this.app.post('/api/auth/discord/callback', async (req, res) => {
      try {
        const { code } = req.body
        
        if (!code) {
          return res.status(400).json({ error: 'Authorization code required' })
        }

        // Exchange code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', {
          client_id: this.discordClientId,
          client_secret: this.discordClientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${req.headers.origin}/discord`,
          scope: 'identify guilds'
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })

        const tokens: DiscordTokenResponse = tokenResponse.data

        // Get user information
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })

        const user: DiscordUser = userResponse.data

        // Get user's guilds
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })

        const guilds: DiscordGuild[] = guildsResponse.data

        res.json({
          access_token: tokens.access_token,
          user: user,
          guilds: guilds
        })

      } catch (error) {
        console.error('OAuth callback error:', error)
        res.status(500).json({ error: 'OAuth authentication failed' })
      }
    })

    // Validate user token and get user data
    this.app.get('/api/auth/discord/user', async (req, res) => {
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Invalid authorization header' })
        }

        const token = authHeader.split(' ')[1]

        // Get user information
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const user: DiscordUser = userResponse.data

        // Get user's guilds
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const guilds: DiscordGuild[] = guildsResponse.data

        res.json({
          user: user,
          guilds: guilds
        })

      } catch (error) {
        console.error('Token validation error:', error)
        res.status(401).json({ error: 'Invalid or expired token' })
      }
    })

    // Get bot's guilds (requires authentication)
    this.app.get('/api/bot/guilds', async (req, res) => {
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const token = authHeader.split(' ')[1]

        // Validate the token by making a request to Discord
        await axios.get('https://discord.com/api/users/@me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        // If validation succeeds, return bot's guilds
        const botGuilds = this.client.guilds.cache.map(guild => ({
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          icon: guild.icon
        }))

        res.json(botGuilds)

      } catch (error) {
        console.error('Guild fetch error:', error)
        res.status(401).json({ error: 'Authentication failed' })
      }
    })

    // Protected channel endpoint (requires authentication)
    this.app.get('/api/bot/channels/:guildId', async (req, res) => {
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const token = authHeader.split(' ')[1]
        const { guildId } = req.params

        // Validate token and get user's guilds
        const userGuildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const userGuilds: DiscordGuild[] = userGuildsResponse.data
        
        // Check if user has admin permissions for this guild
        const userGuild = userGuilds.find(g => g.id === guildId)
        if (!userGuild) {
          return res.status(403).json({ error: 'Access denied: You are not a member of this guild' })
        }

        // Check for admin permissions
        const hasAdminPermissions = userGuild.owner || (BigInt(userGuild.permissions) & BigInt(0x8)) === BigInt(0x8)
        if (!hasAdminPermissions) {
          return res.status(403).json({ error: 'Access denied: Administrator permissions required' })
        }

        // Get bot's guild
        const guild = this.client.guilds.cache.get(guildId)
        if (!guild) {
          return res.status(404).json({ error: 'Guild not found or bot not present' })
        }

        const channels = guild.channels.cache
          .filter(channel => channel.isTextBased() && !channel.isDMBased())
          .map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.type
          }))

        res.json({ channels })

      } catch (error) {
        console.error('Protected channel fetch error:', error)
        res.status(401).json({ error: 'Authentication failed' })
      }
    })

    // Protected monitoring endpoints
    this.app.get('/api/bot/monitoring', async (req, res) => {
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const token = authHeader.split(' ')[1]

        // Validate token
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const user: DiscordUser = userResponse.data

        // Get user's guilds to filter monitoring data
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const userGuilds: DiscordGuild[] = guildsResponse.data
        const adminGuildIds = userGuilds
          .filter(guild => guild.owner || (BigInt(guild.permissions) & BigInt(0x8)) === BigInt(0x8))
          .map(guild => guild.id)

        // Get monitoring data filtered by user's admin guilds
        const allMonitoring = await this.database.getMonitoredAlliances()
        const userMonitoring = allMonitoring.filter(item => adminGuildIds.includes(item.guild_id))

        res.json({ monitoring: userMonitoring })

      } catch (error) {
        console.error('Monitoring fetch error:', error)
        res.status(401).json({ error: 'Authentication failed' })
      }
    })

    // Protected channel configuration endpoint
    this.app.post('/api/bot/config/channel', async (req, res) => {
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const token = authHeader.split(' ')[1]
        const { guildId, channelId, userId } = req.body

        // Validate token and get user's guilds
        const userGuildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const userGuilds: DiscordGuild[] = userGuildsResponse.data
        
        // Check if user has admin permissions for this guild
        const userGuild = userGuilds.find(g => g.id === guildId)
        if (!userGuild) {
          return res.status(403).json({ error: 'Access denied: You are not a member of this guild' })
        }

        const hasAdminPermissions = userGuild.owner || (BigInt(userGuild.permissions) & BigInt(0x8)) === BigInt(0x8)
        if (!hasAdminPermissions) {
          return res.status(403).json({ error: 'Access denied: Administrator permissions required' })
        }

        // Set the notification channel
        await this.database.setNotificationChannel(guildId, channelId)
        res.json({ success: true })

      } catch (error) {
        console.error('Channel config error:', error)
        res.status(500).json({ error: 'Failed to set notification channel' })
      }
    })
  }

  public start(port: number = 3001) {
    this.app.listen(port, () => {
      console.log(`🌐 API server running on port ${port}`)
    })
  }
}
