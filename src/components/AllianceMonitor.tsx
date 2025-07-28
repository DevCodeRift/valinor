import { useState } from 'react'
import { Bell, Target, AlertTriangle } from 'lucide-react'

const AllianceMonitor = () => {
  const [monitoredAlliances, setMonitoredAlliances] = useState<number[]>([10523]) // Default to Valinor
  const [newAllianceId, setNewAllianceId] = useState('')
  const [notifications, setNotifications] = useState(true)

  const handleAddAlliance = () => {
    const id = parseInt(newAllianceId)
    if (id && !monitoredAlliances.includes(id)) {
      setMonitoredAlliances([...monitoredAlliances, id])
      setNewAllianceId('')
    }
  }

  const handleRemoveAlliance = (id: number) => {
    setMonitoredAlliances(monitoredAlliances.filter(allianceId => allianceId !== id))
  }

  return (
    <div>
      <h1 className="neon-text">🎯 ALLIANCE MONITOR 🎯</h1>
      
      <div className="card cyber-border">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Target style={{ color: '#ff00ff', filter: 'drop-shadow(0 0 10px #ff00ff)' }} />
          <h3 className="neon-text">MONITORED ALLIANCES</h3>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="number"
              className="input"
              placeholder="Alliance ID"
              value={newAllianceId}
              onChange={(e) => setNewAllianceId(e.target.value)}
              style={{ flex: 1 }}
            />
            <button 
              className="button"
              onClick={handleAddAlliance}
              disabled={!newAllianceId || isNaN(parseInt(newAllianceId))}
            >
              ➕ ADD ALLIANCE
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {monitoredAlliances.map(id => (
              <div 
                key={id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(255, 0, 255, 0.1) 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #00ffff',
                  boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                  color: '#00ffff'
                }}
              >
                <span style={{ textShadow: '0 0 5px #00ffff' }}>Alliance {id}</span>
                <button 
                  onClick={() => handleRemoveAlliance(id)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#ff0040', 
                    cursor: 'pointer',
                    padding: '0.25rem',
                    fontSize: '1.2rem',
                    textShadow: '0 0 5px #ff0040'
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card cyber-border">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Bell style={{ color: '#ff00ff', filter: 'drop-shadow(0 0 10px #ff00ff)' }} />
          <h3 className="neon-text">NOTIFICATION SETTINGS</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="checkbox"
            id="notifications"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            style={{ transform: 'scale(1.5)' }}
          />
          <label htmlFor="notifications" style={{ color: '#ff00ff' }}>Enable Discord notifications for new wars</label>
        </div>
        
        <p style={{ color: '#ff00ff', fontSize: '0.9rem' }}>
          When enabled, the Discord bot will send notifications to the configured channel 
          whenever a member of a monitored alliance is declared war upon.
        </p>
      </div>

      <div className="card cyber-border">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertTriangle style={{ color: '#ffaa00', filter: 'drop-shadow(0 0 10px #ffaa00)' }} />
          <h3 className="neon-text">RECENT ACTIVITY</h3>
        </div>
        
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ff00ff' }}>
          <p style={{ fontSize: '1.2rem', textShadow: '0 0 10px #ff00ff' }}>🌌 NO RECENT WAR DECLARATIONS DETECTED 🌌</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'rgba(255, 0, 255, 0.7)' }}>
            Activity will appear here when wars are declared against monitored alliances.
          </p>
        </div>
      </div>

      <div className="card cyber-border">
        <h3 className="neon-text">🤖 DISCORD BOT COMMANDS</h3>
        <div style={{ textAlign: 'left', fontFamily: 'Courier New, monospace' }}>
          <p style={{ color: '#00ffff', marginBottom: '0.5rem' }}><strong>/api [key]</strong> <span style={{ color: '#ff00ff' }}>- Set your Politics and War API key</span></p>
          <p style={{ color: '#00ffff', marginBottom: '0.5rem' }}><strong>/alert [alliance_id]</strong> <span style={{ color: '#ff00ff' }}>- Monitor an alliance for war declarations</span></p>
          <p style={{ color: '#00ffff', marginBottom: '0.5rem' }}><strong>/status</strong> <span style={{ color: '#ff00ff' }}>- Check current monitoring status</span></p>
          <p style={{ color: '#00ffff' }}><strong>/help</strong> <span style={{ color: '#ff00ff' }}>- Show available commands</span></p>
        </div>
      </div>
    </div>
  )
}

export default AllianceMonitor
