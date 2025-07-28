import { useState, useEffect } from 'react'
import { LogIn, LogOut, User, Shield } from 'lucide-react'

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  global_name: string | null
}

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
  features: string[]
}

interface AuthContextType {
  user: DiscordUser | null
  guilds: DiscordGuild[]
  isAuthenticated: boolean
  login: () => void
  logout: () => void
  loading: boolean
}

const DISCORD_CLIENT_ID = '1399211561670807665'
const REDIRECT_URI = encodeURIComponent(`${window.location.origin}/discord`)
const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20guilds`

export const useDiscordAuth = (): AuthContextType => {
  const [user, setUser] = useState<DiscordUser | null>(null)
  const [guilds, setGuilds] = useState<DiscordGuild[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
    
    // Handle OAuth callback on any page (especially Discord settings)
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      handleOAuthCallback(code)
      // Clean up URL after processing
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('discord_access_token')
      if (!token) {
        setLoading(false)
        return
      }

      const userResponse = await fetch('/api/auth/discord/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.user)
        setGuilds(userData.guilds)
      } else {
        localStorage.removeItem('discord_access_token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('discord_access_token')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthCallback = async (code: string) => {
    try {
      const response = await fetch('/api/auth/discord/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('discord_access_token', data.access_token)
        setUser(data.user)
        setGuilds(data.guilds)
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        console.error('OAuth callback failed')
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
    }
  }

  const login = () => {
    window.location.href = DISCORD_OAUTH_URL
  }

  const logout = () => {
    localStorage.removeItem('discord_access_token')
    setUser(null)
    setGuilds([])
  }

  return {
    user,
    guilds,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  }
}

interface DiscordAuthButtonProps {
  onAuthChange?: (authenticated: boolean) => void
}

const DiscordAuthButton: React.FC<DiscordAuthButtonProps> = ({ onAuthChange }) => {
  const { user, isAuthenticated, login, logout, loading } = useDiscordAuth()

  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(isAuthenticated)
    }
  }, [isAuthenticated, onAuthChange])

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-discord-blue"></div>
        <span>Checking authentication...</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center justify-between p-3 bg-discord-blue bg-opacity-10 rounded-lg border border-discord-blue border-opacity-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {user.avatar ? (
              <img 
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                alt={user.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="w-8 h-8 text-discord-blue" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {user.global_name || user.username}
              </p>
              <p className="text-sm text-gray-500">
                @{user.username}#{user.discriminator}
              </p>
            </div>
          </div>
          <Shield className="w-4 h-4 text-green-500" />
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    )
  }

  return (
    <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Discord Authentication Required
      </h3>
      <p className="text-gray-600 mb-4">
        You need to authenticate with Discord to manage bot settings for your servers.
        We'll only access servers where you have administrator permissions.
      </p>
      <button
        onClick={login}
        className="inline-flex items-center space-x-2 px-6 py-3 bg-discord-blue text-white rounded-lg hover:bg-discord-blue-dark transition-colors font-medium"
      >
        <LogIn className="w-5 h-5" />
        <span>Login with Discord</span>
      </button>
      <p className="text-xs text-gray-500 mt-3">
        We only request permissions to identify you and see your server list.
      </p>
    </div>
  )
}

export default DiscordAuthButton
