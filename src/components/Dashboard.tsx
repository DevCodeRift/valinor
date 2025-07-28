import { useState, useEffect } from 'react'
import { useQuery, gql } from '@apollo/client'
import { Activity, Users, Shield, AlertTriangle } from 'lucide-react'

const GET_ALLIANCE_INFO = gql`
  query GetAllianceInfo($id: Int!) {
    alliances(id: [$id]) {
      data {
        id
        name
        acronym
        score
        nations {
          id
          nation_name
          leader_name
          score
          num_cities
          alliance_position
          wars(limit: 5, active: true) {
            id
            date
            attacker {
              id
              nation_name
              alliance {
                name
              }
            }
            defender {
              id
              nation_name
              alliance {
                name
              }
            }
            turns_left
          }
        }
      }
    }
  }
`

interface War {
  id: string
  date: string
  attacker: {
    id: string
    nation_name: string
    alliance: {
      name: string
    } | null
  }
  defender: {
    id: string
    nation_name: string
    alliance: {
      name: string
    } | null
  }
  turns_left: number
}

interface Nation {
  id: string
  nation_name: string
  leader_name: string
  score: number
  num_cities: number
  alliance_position: string
  wars: War[]
}

interface Alliance {
  id: string
  name: string
  acronym: string
  score: number
  nations: Nation[]
}

const Dashboard = () => {
  const [allianceId] = useState(10523) // Valinor Alliance ID
  const [apiKeySet, setApiKeySet] = useState(false)
  
  useEffect(() => {
    const apiKey = localStorage.getItem('pw_api_key')
    setApiKeySet(!!apiKey)
  }, [])
  
  const { loading, error, data, refetch } = useQuery(GET_ALLIANCE_INFO, {
    variables: { id: allianceId },
    pollInterval: 300000, // Poll every 5 minutes
    skip: !apiKeySet, // Skip query if no API key is set
  })

  const [activeWars, setActiveWars] = useState<War[]>([])

  useEffect(() => {
    if (data?.alliances?.data?.[0]) {
      const alliance: Alliance = data.alliances.data[0]
      const wars: War[] = []
      
      alliance.nations.forEach(nation => {
        nation.wars.forEach(war => {
          wars.push(war)
        })
      })
      
      setActiveWars(wars)
    }
  }, [data])

  if (!apiKeySet) {
    return (
      <div>
        <h1 className="neon-text">⚔️ VALINOR ALLIANCE DASHBOARD ⚔️</h1>
        <div className="card cyber-border">
          <h3 className="neon-text" style={{ color: '#ffaa00' }}>⚠️ API KEY REQUIRED ⚠️</h3>
          <p style={{ marginBottom: '1rem', color: '#ff00ff' }}>
            Please set your Politics and War API key in the API Settings page to view alliance data.
          </p>
          <button 
            className="button"
            onClick={() => window.location.href = '/settings'}
          >
            🔑 GO TO API SETTINGS
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <div className="card cyber-border neon-text">⚡ LOADING ALLIANCE DATA ⚡</div>
  if (error) return <div className="card cyber-border" style={{color: '#ff0040'}}>❌ ERROR: {error.message}</div>

  const alliance: Alliance | undefined = data?.alliances?.data?.[0]
  
  if (!alliance) {
    return <div className="card cyber-border neon-text">⚠️ NO ALLIANCE DATA FOUND ⚠️</div>
  }

  const defensiveWars = activeWars.filter(war => 
    alliance.nations.some(nation => nation.id === war.defender.id)
  )

  const offensiveWars = activeWars.filter(war => 
    alliance.nations.some(nation => nation.id === war.attacker.id)
  )

  return (
    <div>
      <h1 className="neon-text">⚔️ VALINOR ALLIANCE DASHBOARD ⚔️</h1>
      
      <div className="stats-grid">
        <div className="card cyber-border">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Shield style={{ color: '#ff00ff', filter: 'drop-shadow(0 0 10px #ff00ff)' }} />
            <h3 className="neon-text">ALLIANCE DATA</h3>
          </div>
          <p><strong className="neon-text">Name:</strong> {alliance.name}</p>
          <p><strong className="neon-text">Acronym:</strong> {alliance.acronym}</p>
          <p><strong className="neon-text">Score:</strong> {alliance.score.toLocaleString()}</p>
        </div>

        <div className="card cyber-border">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Users style={{ color: '#ff00ff', filter: 'drop-shadow(0 0 10px #ff00ff)' }} />
            <h3 className="neon-text">MEMBERS</h3>
          </div>
          <p><strong className="neon-text">Total Nations:</strong> {alliance.nations.length}</p>
          <p><strong className="neon-text">Active Nations:</strong> {alliance.nations.filter(n => n.alliance_position !== 'Inactive').length}</p>
        </div>

        <div className="card cyber-border">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity style={{ color: '#ff00ff', filter: 'drop-shadow(0 0 10px #ff00ff)' }} />
            <h3 className="neon-text">WAR STATUS</h3>
          </div>
          <p><strong className="neon-text">Defensive Wars:</strong> {defensiveWars.length}</p>
          <p><strong className="neon-text">Offensive Wars:</strong> {offensiveWars.length}</p>
        </div>

        <div className="card cyber-border">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle style={{ 
              color: defensiveWars.length > 0 ? '#ff0040' : '#00ff80',
              filter: `drop-shadow(0 0 10px ${defensiveWars.length > 0 ? '#ff0040' : '#00ff80'})` 
            }} />
            <h3 className="neon-text">ALERT STATUS</h3>
          </div>
          <p style={{ 
            color: defensiveWars.length > 0 ? '#ff0040' : '#00ff80',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${defensiveWars.length > 0 ? '#ff0040' : '#00ff80'}`
          }}>
            {defensiveWars.length > 0 ? '🚨 UNDER ATTACK 🚨' : '✅ SECURE ✅'}
          </p>
        </div>
      </div>

      {defensiveWars.length > 0 && (
        <div className="card cyber-border">
          <h3 style={{ color: '#ff0040', marginBottom: '1rem', textShadow: '0 0 20px #ff0040' }}>🚨 ACTIVE DEFENSIVE WARS 🚨</h3>
          {defensiveWars.map(war => (
            <div key={war.id} className="war-alert active" style={{ marginBottom: '1rem' }}>
              <p><strong className="neon-text">Attacker:</strong> <span style={{color: '#ff0040'}}>{war.attacker.nation_name}</span> ({war.attacker.alliance?.name || 'No Alliance'})</p>
              <p><strong className="neon-text">Defender:</strong> <span style={{color: '#00ff80'}}>{war.defender.nation_name}</span></p>
              <p><strong className="neon-text">Turns Left:</strong> {war.turns_left}</p>
              <p><strong className="neon-text">Started:</strong> {new Date(war.date).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button 
          className="button" 
          onClick={() => refetch()}
          style={{ marginRight: '1rem' }}
        >
          🔄 REFRESH DATA
        </button>
        <span style={{ color: '#ff00ff', textShadow: '0 0 5px #ff00ff' }}>
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default Dashboard
