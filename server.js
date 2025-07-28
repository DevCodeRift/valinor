import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    bot: 'running',
    web: 'running',
    database: 'connected',
    api: 'available'
  })
})

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'))
})

app.listen(port, () => {
  console.log(`🌐 Web server running on port ${port}`)
})
