import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Activity, Settings, Bell, Bot } from 'lucide-react'
import Dashboard from './components/Dashboard'
import AllianceMonitor from './components/AllianceMonitor'
import ApiSettings from './components/ApiSettings'
import DiscordSettings from './components/DiscordSettingsWithAuth'
import './App.css'

function App() {
  const [apiKey, setApiKey] = useState<string>('')

  useEffect(() => {
    const savedApiKey = localStorage.getItem('pw_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const asciiTitle = `██╗   ██╗ █████╗ ██╗     ██╗███╗   ██╗ ██████╗ ██████╗ 
██║   ██║██╔══██╗██║     ██║████╗  ██║██╔═══██╗██╔══██╗
██║   ██║███████║██║     ██║██╔██╗ ██║██║   ██║██████╔╝
╚██╗ ██╔╝██╔══██║██║     ██║██║╚██╗██║██║   ██║██╔══██╗
 ╚████╔╝ ██║  ██║███████╗██║██║ ╚████║╚██████╔╝██║  ██║
  ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝`

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <div className="ascii-title">{asciiTitle}</div>
          </div>
          <nav className="nav">
            <Link to="/" className="nav-link">
              <Activity />
              Dashboard
            </Link>
            <Link to="/monitor" className="nav-link">
              <Bell />
              Alliance Monitor
            </Link>
            <Link to="/settings" className="nav-link">
              <Settings />
              API Settings
            </Link>
            <Link to="/discord" className="nav-link">
              <Bot />
              Discord Settings
            </Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/monitor" element={<AllianceMonitor />} />
          <Route path="/settings" element={<ApiSettings apiKey={apiKey} setApiKey={setApiKey} />} />
          <Route path="/discord" element={<DiscordSettings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
