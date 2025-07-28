import express from 'express'
import cors from 'cors'
import { Client } from 'discord.js'
import { Database } from './database'

export class ApiServer {
  private app: express.Application
  private client: Client
  private database: Database

  constructor(client: Client, database: Database) {
    this.app = express()
    this.client = client
    this.database = database
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
  }

  public start(port: number = 3001) {
    this.app.listen(port, () => {
      console.log(`🌐 API server running on port ${port}`)
    })
  }
}
