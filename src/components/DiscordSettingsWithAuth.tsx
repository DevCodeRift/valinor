import { useState, useEffect } from 'react'
import { Settings, MessageSquare, Bot, Users } from 'lucide-react'
import DiscordAuthButton, { useDiscordAuth } from './DiscordAuth'

interface Guild {
  id: string
  name: string
  memberCount?: number
  icon?: string | null
  permissions?: string
  owner?: boolean
}

interface Channel {
  id: string
  name: string
  type: number
}

interface BotStatus {
  online: boolean
  username: string
  discriminator: string
  guilds: number
  uptime: number
}

interface MonitoredAlliance {
  id: number
  alliance_id: number
  guild_id: string
  channel_id: string
  user_id: string
  created_at: string
}

const DiscordSettings = () => {
  const { user, guilds: userGuilds, isAuthenticated } = useDiscordAuth()
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [availableGuilds, setAvailableGuilds] = useState<Guild[]>([])
  const [selectedGuild, setSelectedGuild] = useState<string>('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [monitoring, setMonitoring] = useState<MonitoredAlliance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchBotStatus()
    if (isAuthenticated && user) {
      fetchUserManagedGuilds()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  // Check if user has administrator permissions
  const hasAdminPermissions = (permissions: string): boolean => {
    const permissionBits = BigInt(permissions)
    const adminBit = BigInt(0x8) // Administrator permission
    return (permissionBits & adminBit) === adminBit
  }

  const fetchUserManagedGuilds = async () => {
    try {
      if (!user) return

      // Filter user guilds to only include those where they have admin permissions
      const adminGuilds = userGuilds.filter(guild => 
        guild.owner || hasAdminPermissions(guild.permissions)
      )

      // Get bot's guilds and cross-reference with user's admin guilds
      const response = await fetch('/api/bot/guilds', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
        }
      })

      if (response.ok) {
        const botGuilds = await response.json()
        
        // Only show guilds where both the bot and user (with admin perms) are present
        const mutualGuilds = adminGuilds.filter(userGuild =>
          botGuilds.some((botGuild: Guild) => botGuild.id === userGuild.id)
        )

        setAvailableGuilds(mutualGuilds)
        
        // Fetch monitoring config for these guilds
        const monitoringResponse = await fetch('/api/bot/monitoring', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
          }
        })
        
        if (monitoringResponse.ok) {
          const monitoringData = await monitoringResponse.json()
          setMonitoring(monitoringData.monitoring || [])
        }
      } else {
        setError('Failed to fetch bot guilds')
      }
    } catch (error) {
      console.error('Error fetching managed guilds:', error)
      setError('Failed to fetch guild information')
    } finally {
      setLoading(false)
    }
  }

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/bot/status')
      if (response.ok) {
        const data = await response.json()
        setBotStatus(data)
      }
    } catch (err) {
      console.error('Failed to fetch bot status:', err)
    }
  }

  const fetchChannels = async (guildId: string) => {
    try {
      const response = await fetch(`/api/bot/channels/${guildId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels || [])
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err)
    }
  }

  const handleGuildChange = (guildId: string) => {
    setSelectedGuild(guildId)
    setSelectedChannel('')
    setChannels([])
    if (guildId) {
      fetchChannels(guildId)
    }
  }

  const setNotificationChannel = async () => {
    if (!selectedGuild || !selectedChannel || !user) {
      setError('Please select both a server and channel')
      return
    }

    try {
      const response = await fetch('/api/bot/config/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
        },
        body: JSON.stringify({
          guildId: selectedGuild,
          channelId: selectedChannel,
          userId: user.id,
        }),
      })

      if (response.ok) {
        setError('')
        alert('Notification channel set successfully!')
        fetchUserManagedGuilds() // Refresh data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to set notification channel')
      }
    } catch (err) {
      setError('Failed to set notification channel')
    }
  }

  // Show authentication required if not logged in
  if (!isAuthenticated) {
    return (
      <div className="discord-settings">
        <div className="card cyber-border">
          <h2 className="neon-text" style={{ color: '#ff00ff' }}>
            <Bot /> Discord Settings
          </h2>
          <DiscordAuthButton onAuthChange={() => {}} />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card cyber-border">
        <h2 className="neon-text" style={{ color: '#ff00ff' }}>
          <Bot /> Loading Discord Settings...
        </h2>
        <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
      </div>
    )
  }

  return (
    <div className="discord-settings">
      <div className="card cyber-border">
        <h2 className="neon-text" style={{ color: '#ff00ff' }}>
          <Bot /> Discord Settings
        </h2>
        <DiscordAuthButton onAuthChange={() => {}} />
      </div>

      <div className="card cyber-border">
        <h2 className="neon-text" style={{ color: '#ff00ff' }}>
          <Bot /> Discord Bot Status
        </h2>
        
        {botStatus ? (
          <div className="bot-status">
            <div className="status-item">
              <span className={`status-indicator ${botStatus.online ? 'online' : 'offline'}`}></span>
              <strong>{botStatus.username}</strong> - {botStatus.online ? 'Online' : 'Offline'}
            </div>
            <div className="status-item">
              <Users size={16} /> Connected to {botStatus.guilds} server(s)
            </div>
            {botStatus.uptime && (
              <div className="status-item">
                Uptime: {Math.floor(botStatus.uptime / (1000 * 60 * 60))}h {Math.floor((botStatus.uptime % (1000 * 60 * 60)) / (1000 * 60))}m
              </div>
            )}
          </div>
        ) : (
          <div className="error" style={{ color: '#ff4444' }}>
            ⚠️ Unable to connect to Discord bot
          </div>
        )}
      </div>

      <div className="card cyber-border">
        <h2 className="neon-text" style={{ color: '#00ffaa' }}>
          <Settings /> Notification Settings
        </h2>
        
        {error && (
          <div className="error" style={{ color: '#ff4444', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {availableGuilds.length === 0 ? (
          <div className="info" style={{ color: '#ffaa00', marginBottom: '1rem' }}>
            No mutual servers found where you have administrator permissions and the bot is present.
            Make sure the bot is added to your server and you have administrator permissions.
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="guild-select">Discord Server:</label>
              <select
                id="guild-select"
                className="select"
                value={selectedGuild}
                onChange={(e) => handleGuildChange(e.target.value)}
              >
                <option value="">Select a Discord server...</option>
                {availableGuilds.map((guild) => (
                  <option key={guild.id} value={guild.id}>
                    {guild.name} {guild.owner ? '(Owner)' : '(Admin)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="channel-select">Notification Channel:</label>
              <select
                id="channel-select"
                className="select"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                disabled={!selectedGuild}
              >
                <option value="">Select a channel...</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="button"
              onClick={setNotificationChannel}
              disabled={!selectedGuild || !selectedChannel}
            >
              <MessageSquare /> Set Notification Channel
            </button>
          </>
        )}
      </div>

      {monitoring.length > 0 && (
        <div className="card cyber-border">
          <h2 className="neon-text" style={{ color: '#00aaff' }}>
            <MessageSquare /> Active Monitoring
          </h2>
          <div className="monitoring-list">
            {monitoring.map((item) => {
              const guild = availableGuilds.find((g: Guild) => g.id === item.guild_id)
              return (
                <div key={item.id} className="monitoring-item">
                  <div>
                    <strong>Alliance ID:</strong> {item.alliance_id}
                  </div>
                  <div>
                    <strong>Server:</strong> {guild?.name || 'Unknown'}
                  </div>
                  <div>
                    <strong>Channel:</strong> #{item.channel_id}
                  </div>
                  <div>
                    <strong>Added:</strong> {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscordSettings
