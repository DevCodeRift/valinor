# Valinor Alliance War Monitor

A comprehensive Discord bot and web application system for monitoring war declarations against the **Valinor Alliance** (and other alliances) in Politics and War.

## Features

### Discord Bot
- 🔔 **Real-time war notifications** when alliance members are attacked
- 🔑 **Secure API key management** per user
- 📊 **Alliance monitoring** with customizable alerts
- ⚔️ **War tracking** and historical data
- 🤖 **Slash commands** for easy interaction

### Web Application
- 📈 **Alliance dashboard** with real-time statistics
- 🎯 **War monitoring interface** for multiple alliances
- ⚙️ **API settings management**
- 📱 **Responsive design** for mobile and desktop

## Discord Bot Commands

- `/api <key>` - Set your Politics and War API key
- `/alert <alliance_id>` - Monitor an alliance for war declarations
- `/status` - Check current monitoring status
- `/help` - Show available commands

## Quick Start

### Prerequisites
- Node.js 18+ 
- Discord Bot Token
- Politics and War API Key

### Local Development

1. **Clone and setup:**
   ```cmd
   git clone <your-repo-url>
   cd valinor
   npm install
   cd bot
   npm install
   cd ..
   ```

2. **Configure environment:**
   ```cmd
   copy .env.example .env
   copy bot\.env.example bot\.env
   ```

3. **Fill in your environment variables in both `.env` files**

4. **Start development servers:**
   ```cmd
   npm run dev
   ```
   ```cmd
   npm run bot:dev
   ```

### Production Deployment on Digital Ocean

#### Option 1: Docker Compose (Recommended)

1. **Setup Digital Ocean Droplet:**
   - Create a new Ubuntu 22.04 droplet (minimum $6/month)
   - SSH into your droplet
   - Install Docker and Docker Compose:
     ```bash
     sudo apt update
     sudo apt install docker.io docker-compose -y
     sudo systemctl start docker
     sudo systemctl enable docker
     sudo usermod -aG docker $USER
     ```

2. **Deploy the application:**
   ```bash
   # Clone your repository
   git clone <your-repo-url>
   cd valinor
   
   # Configure environment
   cp .env.example .env
   nano .env  # Fill in your values
   
   # Deploy with Docker Compose
   sudo docker-compose up -d
   ```

3. **Setup domain and SSL (Optional):**
   - Point your domain to the droplet IP
   - Use Nginx with Let's Encrypt for SSL

#### Option 2: Digital Ocean App Platform

1. **Create new app in Digital Ocean:**
   - Go to Digital Ocean Dashboard → Apps
   - Create App from GitHub repository
   - Configure build settings:
     - Build Command: `npm install && npm run build && cd bot && npm install && npm run build`
     - Run Command: `chmod +x docker-entrypoint.sh && ./docker-entrypoint.sh`

2. **Set environment variables** in the App Platform dashboard

3. **Deploy** - Digital Ocean will handle the rest!

#### Option 3: Manual Deployment

1. **Setup server:**
   ```bash
   # On your Digital Ocean droplet
   sudo apt update
   sudo apt install nodejs npm nginx -y
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Deploy application:**
   ```bash
   # Clone and build
   git clone <your-repo-url>
   cd valinor
   npm install && npm run build
   cd bot && npm install && npm run build
   cd ..
   
   # Configure environment
   cp .env.example .env
   cp bot/.env.example bot/.env
   # Edit both .env files with your values
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

3. **Setup Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Variables

### Discord Bot Configuration
- `DISCORD_TOKEN` - Your Discord bot token
- `DISCORD_CLIENT_ID` - Your Discord application client ID
- `DISCORD_GUILD_ID` - Your Discord server ID (optional)
- `DISCORD_CHANNEL_ID` - Default notification channel ID (optional)

### Politics and War API
- `PW_API_KEY` - Your Politics and War API key (optional, users can set their own)

### Database & Monitoring
- `DB_PATH` - SQLite database file path
- `CHECK_INTERVAL_MINUTES` - How often to check for new wars (default: 5)
- `MAX_WARS_TO_TRACK` - Maximum wars to keep in database (default: 100)

## Getting Your Credentials

### Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to "Bot" section and create a bot
4. Copy the token for `DISCORD_TOKEN`
5. Copy the Application ID for `DISCORD_CLIENT_ID`
6. Invite bot to your server with appropriate permissions

### Politics and War API Key
1. Log in to [Politics and War](https://politicsandwar.com)
2. Go to Account Settings → API
3. Generate or copy your API key

## Architecture

```
├── src/                    # React web application
│   ├── components/         # React components
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── bot/                   # Discord bot
│   ├── src/
│   │   ├── index.ts       # Bot entry point
│   │   ├── database.ts    # SQLite database layer
│   │   ├── api.ts         # Politics and War API client
│   │   └── warMonitor.ts  # War monitoring logic
│   └── package.json
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Multi-service deployment
└── README.md
```

## Development

### Web App Development
```cmd
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Bot Development
```cmd
npm run bot:dev      # Start bot in development mode
npm run bot:build    # Build bot for production
npm run bot:start    # Start built bot
```

## Monitoring

The system automatically:
- Checks for new wars every 5 minutes
- Stores war data in SQLite database
- Sends Discord notifications for defensive wars
- Tracks notification status to prevent duplicates
- Cleans up old war data (30+ days)

## Security

- API keys are stored securely per user
- Environment variables for sensitive data
- Input validation on all commands
- Rate limiting through Politics and War API

## Support

For issues or questions:
1. Check the [Politics and War API documentation](https://politicsandwar.com/api)
2. Verify your API key permissions
3. Check Discord bot permissions in your server
4. Review application logs for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
