import { useState } from 'react'
import { Save, Key, CheckCircle, XCircle } from 'lucide-react'

interface ApiSettingsProps {
  apiKey: string
  setApiKey: (key: string) => void
}

const ApiSettings = ({ apiKey, setApiKey }: ApiSettingsProps) => {
  const [inputKey, setInputKey] = useState(apiKey)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testMessage, setTestMessage] = useState('')

  const testApiKey = async (key: string) => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch(`https://api.politicsandwar.com/graphql?api_key=${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'query { nations(first: 1) { data { id nation_name } } }'
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.data) {
        setTestResult('success')
        setTestMessage('API key is valid!')
      } else {
        setTestResult('error')
        setTestMessage(result.errors?.[0]?.message || 'API key test failed')
      }
    } catch (error) {
      setTestResult('error')
      setTestMessage('Network error or invalid API key')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    localStorage.setItem('pw_api_key', inputKey)
    setApiKey(inputKey)
    setSaved(true)
    
    // Test the API key
    await testApiKey(inputKey)
    
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <h1 className="neon-text">⚙️ API SETTINGS ⚙️</h1>
      
      <div className="card cyber-border">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Key style={{ color: '#ff00ff', filter: 'drop-shadow(0 0 10px #ff00ff)' }} />
          <h3 className="neon-text">POLITICS AND WAR API KEY</h3>
        </div>
        
        <p style={{ marginBottom: '1rem', color: '#ff00ff' }}>
          Enter your Politics and War API key to enable data fetching. You can get your API key from your Politics and War account settings.
        </p>
        
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#ff00ff' }}>
            API Key:
          </label>
          <input
            id="apiKey"
            type="password"
            className="input"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Enter your Politics and War API key"
            style={{ marginBottom: '1rem' }}
          />
        </div>
        
        <button 
          className="button"
          onClick={handleSave}
          disabled={!inputKey.trim() || testing}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: saved ? 'linear-gradient(135deg, #00ff80 0%, #00cc66 100%)' : undefined
          }}
        >
          <Save size={16} />
          {testing ? '🔄 TESTING...' : saved ? '✅ SAVED!' : '💾 SAVE & TEST API KEY'}
        </button>
        
        {testResult && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: testResult === 'success' 
              ? 'linear-gradient(135deg, rgba(0, 255, 128, 0.2) 0%, rgba(0, 255, 255, 0.1) 100%)' 
              : 'linear-gradient(135deg, rgba(255, 0, 64, 0.2) 0%, rgba(255, 0, 255, 0.1) 100%)', 
            borderRadius: '0.5rem',
            border: testResult === 'success' ? '2px solid #00ff80' : '2px solid #ff0040',
            boxShadow: testResult === 'success' 
              ? '0 0 20px rgba(0, 255, 128, 0.3)' 
              : '0 0 20px rgba(255, 0, 64, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {testResult === 'success' ? (
                <CheckCircle style={{ color: '#00ff80', filter: 'drop-shadow(0 0 5px #00ff80)' }} size={20} />
              ) : (
                <XCircle style={{ color: '#ff0040', filter: 'drop-shadow(0 0 5px #ff0040)' }} size={20} />
              )}
              <p style={{ 
                color: testResult === 'success' ? '#00ff80' : '#ff0040', 
                textShadow: `0 0 10px ${testResult === 'success' ? '#00ff80' : '#ff0040'}`,
                fontWeight: 'bold'
              }}>
                {testMessage}
              </p>
            </div>
          </div>
        )}
        
        {apiKey && !testResult && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'linear-gradient(135deg, rgba(0, 255, 128, 0.2) 0%, rgba(0, 255, 255, 0.1) 100%)', 
            borderRadius: '0.5rem',
            border: '2px solid #00ff80',
            boxShadow: '0 0 20px rgba(0, 255, 128, 0.3)'
          }}>
            <p style={{ color: '#00ff80', textShadow: '0 0 10px #00ff80' }}>✅ API KEY CONFIGURED</p>
          </div>
        )}
      </div>
      
      <div className="card cyber-border">
        <h3 className="neon-text">📋 HOW TO GET YOUR API KEY</h3>
        <ol style={{ textAlign: 'left', paddingLeft: '1.5rem', color: '#ff00ff' }}>
          <li>Log in to your Politics and War account</li>
          <li>Go to Account Settings</li>
          <li>Navigate to the API section</li>
          <li>Generate or copy your API key</li>
          <li>Paste it in the field above</li>
        </ol>
      </div>
    </div>
  )
}

export default ApiSettings
