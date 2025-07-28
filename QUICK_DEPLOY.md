# 🚀 Quick Start Deployment Guide

Choose your deployment method:

## Option 1: Digital Ocean Droplet (Recommended - $6/month)

### Step 1: Create Droplet
1. Create Ubuntu 22.04 LTS droplet ($6/month, 1GB RAM)
2. SSH into your droplet: `ssh root@YOUR_DROPLET_IP`

### Step 2: Clone and Deploy
```bash
# Clone the repository
git clone https://github.com/your-username/valinor.git /opt/valinor
cd /opt/valinor

# Make deployment script executable
chmod +x scripts/deploy.sh

# Run automated deployment
./scripts/deploy.sh
```

### Step 3: Configure (Smart Way!)
```bash
# Only set Discord bot token in environment
nano /opt/valinor/.env
# Edit: DISCORD_TOKEN=your_actual_token
pm2 restart valinor-bot
```

**Then configure everything else through the interfaces:**
- **Bot settings**: Use Discord slash commands like `/set-api-key`
- **Web settings**: Use the web interface API Settings page

### Step 4: Access Your App
- Visit: `http://YOUR_DROPLET_IP`
- Invite bot: Use the provided Discord invite URL
- Configure via Discord commands and web interface

---

## Option 2: Digital Ocean App Platform ($17/month)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy to App Platform"
git push origin main
```

### Step 2: Create App
1. Go to Digital Ocean Console → Apps
2. Click "Create App"
3. Select your GitHub repository
4. Use the configuration from `.do/app.yaml`

### Step 3: Set Environment Variables
In App Platform console, add:
- `DISCORD_TOKEN`: Your Discord bot token
- `PW_API_KEY`: Your Politics and War API key

---

## Required Credentials

Before deploying, you'll need:

1. **Discord Bot Token**
   - Go to https://discord.com/developers/applications
   - Select your bot application
   - Go to "Bot" section
   - Copy the token

2. **Politics and War API Key**
   - Log into Politics and War
   - Go to Account Settings → API
   - Generate/copy your API key

3. **Invite Bot to Discord**
   - Use this URL: `https://discord.com/api/oauth2/authorize?client_id=1399211561670807665&permissions=414464724032&scope=bot%20applications.commands`

---

## Quick Commands

### Droplet Management
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart applications
pm2 restart all

# Update application
/opt/valinor/update.sh

# Backup data
/opt/valinor/backup.sh
```

### Troubleshooting
```bash
# Check if services are running
pm2 list

# Check web app
curl http://localhost:3000

# Check logs
journalctl -u nginx -f
pm2 logs valinor-web
pm2 logs valinor-bot
```

---

## Support

For detailed instructions, see `DEPLOYMENT.md`

Need help? Check the troubleshooting section in the deployment guide.
