import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    online: true, 
    message: 'Valinor API Server - OAuth Testing',
    timestamp: new Date().toISOString()
  })
})

// OAuth callback endpoint
app.post('/api/auth/discord/callback', async (req, res) => {
  try {
    const { code } = req.body
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' })
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://178.62.35.158:3000/discord', // Production redirect URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const { access_token } = tokenResponse.data

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    // Get user guilds
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    res.json({
      access_token,
      user: userResponse.data,
      guilds: guildsResponse.data,
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

// Validate token and get user info
app.get('/api/auth/discord/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid token provided' })
    }

    const token = authHeader.split(' ')[1]

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Get user guilds
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    res.json({
      user: userResponse.data,
      guilds: guildsResponse.data,
    })
  } catch (error) {
    console.error('Token validation error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 OAuth Test Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: DISCORD_CLIENT_ID=${process.env.DISCORD_CLIENT_ID}`)
  console.log(`🔐 Client Secret configured: ${process.env.DISCORD_CLIENT_SECRET ? 'Yes' : 'No'}`)
})
