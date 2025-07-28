import { useState, useEffect } from 'react'
import { Settings, MessageSquare, Bot, Users } from 'lucide-react'

interface Guild {
  id: string
  name: string
  memberCount: number
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
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [selectedGuild, setSelectedGuild] = useState<string>('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [monitoring, setMonitoring] = useState<MonitoredAlliance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchBotStatus()
    fetchBotConfig()
  }, [])

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

  const fetchBotConfig = async () => {
    try {
      const response = await fetch('/api/bot/config')
      if (response.ok) {
        const data = await response.json()
        setGuilds(data.guilds || [])
        setMonitoring(data.monitoring || [])
      }
    } catch (err) {
      console.error('Failed to fetch bot config:', err)
      setError('Failed to connect to Discord bot')
    } finally {
      setLoading(false)
    }
  }

  const fetchChannels = async (guildId: string) => {
    try {
      const response = await fetch(`/api/bot/channels/${guildId}`)
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
    if (!selectedGuild || !selectedChannel) {
      setError('Please select both a server and channel')
      return
    }

    try {
      const response = await fetch('/api/bot/config/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guildId: selectedGuild,
          channelId: selectedChannel,
        }),
      })

      if (response.ok) {
        setError('')
        alert('Notification channel updated successfully!')
        fetchBotConfig() // Refresh data
      } else {
        setError('Failed to update notification channel')
      }
    } catch (err) {
      setError('Failed to update notification channel')
    }
  }

  const addMonitoredAlliance = async (allianceId: number) => {
    if (!selectedGuild || !selectedChannel) {
      setError('Please select a server and channel first')
      return
    }

    try {
      const response = await fetch('/api/bot/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allianceId,
          guildId: selectedGuild,
          channelId: selectedChannel,
          userId: 'web-interface',
        }),
      })

      if (response.ok) {
        setError('')
        alert('Alliance monitoring added successfully!')
        fetchBotConfig() // Refresh data
      } else {
        setError('Failed to add alliance monitoring')
      }
    } catch (err) {
      setError('Failed to add alliance monitoring')
    }
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

        <div className="form-group">
          <label htmlFor="guild-select">Discord Server:</label>
          <select
            id="guild-select"
            className="select"
            value={selectedGuild}
            onChange={(e) => handleGuildChange(e.target.value)}
          >
            <option value="">Select a Discord server...</option>
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name} ({guild.memberCount} members)
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
      </div>

      <div className="card cyber-border">
        <h2 className="neon-text" style={{ color: '#ffaa00' }}>
          <MessageSquare /> Quick Actions
        </h2>
        
        <div className="quick-actions">
          <button
            className="button"
            onClick={() => addMonitoredAlliance(10523)} // Valinor Alliance ID
            disabled={!selectedGuild || !selectedChannel}
          >
            🛡️ Monitor Valinor Alliance
          </button>
          
          <p style={{ marginTop: '1rem', color: '#888' }}>
            More monitoring options available via Discord slash commands: /alert, /status, /help
          </p>
        </div>
      </div>

      {monitoring.length > 0 && (
        <div className="card cyber-border">
          <h2 className="neon-text" style={{ color: '#00aaff' }}>
            📊 Current Monitoring
          </h2>
          
          <div className="monitoring-list">
            {monitoring.map((item) => {
              const guild = guilds.find(g => g.id === item.guild_id)
              const channel = channels.find(c => c.id === item.channel_id)
              
              return (
                <div key={item.id} className="monitoring-item">
                  <div>
                    <strong>Alliance ID:</strong> {item.alliance_id}
                  </div>
                  <div>
                    <strong>Server:</strong> {guild?.name || item.guild_id}
                  </div>
                  <div>
                    <strong>Channel:</strong> #{channel?.name || item.channel_id}
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
