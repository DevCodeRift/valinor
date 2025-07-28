import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DiscordCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // The useDiscordAuth hook will handle the OAuth callback automatically
    // Just redirect to Discord settings page after a short delay
    const timer = setTimeout(() => {
      navigate('/discord')
    }, 2000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="card cyber-border" style={{ textAlign: 'center', padding: '2rem' }}>
      <h2 className="neon-text" style={{ color: '#ff00ff' }}>
        🔄 Processing Discord Authentication...
      </h2>
      <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
      <p>Please wait while we complete your Discord login...</p>
    </div>
  )
}

export default DiscordCallback
