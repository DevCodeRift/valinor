# Valinor Alliance Monitor - Quick Setup Guide

## Digital Ocean Deployment (Fastest Setup)

### Method 1: One-Click Deploy with App Platform
1. Fork this repository to your GitHub account
2. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
3. Click "Create App" → "GitHub" → Select your forked repository
4. Use the configuration in `.do/app.yaml`
5. Set environment variables:
   - `DISCORD_TOKEN` - Your Discord bot token
   - `DISCORD_CLIENT_ID` - Your Discord app client ID  
   - `PW_API_KEY` - Your Politics and War API key (optional)
6. Deploy!

### Method 2: Droplet with Docker (Recommended)
```bash
# 1. Create Ubuntu 22.04 droplet ($6/month minimum)
# 2. SSH into your droplet
ssh root@your-droplet-ip

# 3. Run the deployment script
curl -sSL https://raw.githubusercontent.com/your-username/valinor-alliance-monitor/main/deploy-digital-ocean.sh | bash
```

## Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application → Bot
3. Copy bot token for `DISCORD_TOKEN`
4. Copy Application ID for `DISCORD_CLIENT_ID`
5. Invite bot with permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`

## Quick Start Commands

After deployment, in your Discord server:
```
/help                    # Show all commands
/api YOUR_API_KEY        # Set your Politics and War API key
/alert 10523            # Monitor Valinor Alliance (ID: 10523)
/status                 # Check monitoring status
```

## Monitoring Multiple Alliances
```
/alert 10523            # Valinor Alliance
/alert 1234             # Another alliance ID
/alert 5678             # Yet another alliance
```

## Web Dashboard
- Access at: `http://your-droplet-ip:3000` or your custom domain
- View alliance statistics and war status
- Manage API settings
- Monitor multiple alliances

## Cost Estimate (Digital Ocean)
- **Basic Droplet**: $6/month (1GB RAM, 1 CPU)
- **App Platform**: $5-12/month (auto-scaling)
- **Domain** (optional): $10-15/year
- **Total**: ~$5-15/month

## Support Links
- [Politics and War](https://politicsandwar.com)
- [Valinor Alliance](https://politicsandwar.com/alliance/id=10523)
- [Digital Ocean Documentation](https://docs.digitalocean.com)
- [Discord.js Guide](https://discordjs.guide)

---
*Built for the Valinor Alliance by the community* 🛡️
