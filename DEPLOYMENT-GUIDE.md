# 🛡️ Valinor Alliance Monitor - Complete Setup

## ✅ What You Have Now

### **Discord Bot Features**
- 🔔 **Real-time war notifications** when Valinor (or any monitored alliance) members are attacked
- 🔑 **Secure API key management** (each user sets their own)
- 📊 **Alliance monitoring** with customizable alerts
- ⚔️ **War tracking** and historical data storage
- 🤖 **Slash commands**: `/api`, `/alert`, `/status`, `/help`

### **Web Application Features**
- 📈 **Alliance dashboard** with real-time statistics for Valinor Alliance
- 🎯 **Multi-alliance monitoring** interface
- ⚙️ **API settings** management page
- 📱 **Responsive design** works on mobile and desktop
- 🔄 **Auto-refresh** data every 5 minutes

### **Production Ready**
- 🐳 **Docker containers** for easy deployment
- 🌊 **Digital Ocean** optimized deployment scripts
- 🔒 **SSL/HTTPS** support with Let's Encrypt
- 📊 **Health monitoring** and logging
- 🔄 **Automatic updates** and backups
- 💾 **SQLite database** for persistent storage

## 🚀 Quick Deploy to Digital Ocean

### **Method 1: One-Click App Platform** (Easiest)
1. Fork this repository to GitHub
2. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
3. Create app from your GitHub repo
4. Set environment variables in the dashboard
5. Deploy! (~$5-12/month)

### **Method 2: Droplet Deployment** (More Control)
```bash
# Create Ubuntu 22.04 droplet, then:
curl -sSL https://raw.githubusercontent.com/yourusername/valinor-alliance-monitor/main/deploy-digital-ocean.sh | bash
```

## 🔧 Required Setup

### **1. Discord Bot**
```
1. Go to: https://discord.com/developers/applications
2. Create New Application → Bot
3. Copy Bot Token → DISCORD_TOKEN
4. Copy Application ID → DISCORD_CLIENT_ID
5. Invite bot to server with "Send Messages" + "Use Slash Commands" permissions
```

### **2. Politics and War API**
```
1. Login to: https://politicsandwar.com
2. Account Settings → API
3. Copy your API key → PW_API_KEY (optional, users can set their own)
```

### **3. Environment Variables**
```bash
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here  
PW_API_KEY=your_api_key_here
```

## 📱 Using the Bot

### **Initial Setup**
```
/help                    # Show all commands
/api YOUR_API_KEY        # Set your Politics and War API key
```

### **Monitor Valinor Alliance**
```
/alert 10523            # Start monitoring Valinor Alliance
/status                 # Check what's being monitored
```

### **Monitor Additional Alliances**
```
/alert 1234             # Monitor another alliance
/alert 5678             # Monitor yet another alliance
```

## 🌐 Web Dashboard Access

- **Local Development**: `http://localhost:3000`
- **Production**: `http://your-droplet-ip:3000` or your custom domain
- **Features**: View alliance stats, manage settings, monitor wars

## 📊 What Gets Monitored

### **Automatic Notifications For:**
- ✅ **Defensive wars** - When alliance members are attacked
- ✅ **Real-time alerts** - Checks every 5 minutes
- ✅ **Rich embeds** - Detailed war information in Discord
- ✅ **Multiple alliances** - Monitor as many as you want

### **Data Tracked:**
- War declarations and details
- Alliance member statistics  
- Attack/defender information
- War start times and duration
- Historical war data (30 days)

## 💰 Cost Breakdown

### **Digital Ocean Hosting**
- **Basic Droplet**: $6/month (recommended)
- **App Platform**: $5-12/month (easiest)
- **Domain** (optional): $10-15/year
- **Total**: ~$5-15/month

### **Free Alternatives**
- **Local hosting**: $0 (if you have a computer running 24/7)
- **Railway/Render**: $0-5/month (may have limitations)

## 🆘 Troubleshooting

### **Bot Not Responding**
- ✅ Check `DISCORD_TOKEN` is correct
- ✅ Bot has proper permissions in server
- ✅ Bot is online (check server member list)

### **No War Notifications**
- ✅ API key is set with `/api command`
- ✅ Alliance is being monitored with `/alert`
- ✅ Check `/status` for monitoring confirmation

### **Web App Not Loading**  
- ✅ Port 3000 is open in firewall
- ✅ Application is running (`docker-compose ps`)
- ✅ Check logs (`docker-compose logs`)

## 📞 Support

### **Politics and War**
- Alliance Page: https://politicsandwar.com/alliance/id=10523
- API Docs: https://politicsandwar.com/api

### **Technical Support**
- Discord.js Guide: https://discordjs.guide
- Digital Ocean Docs: https://docs.digitalocean.com

---

## 🎯 Quick Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show all available commands | `/help` |
| `/api` | Set your PW API key | `/api abc123xyz` |
| `/alert` | Monitor alliance for wars | `/alert 10523` |
| `/status` | Check monitoring status | `/status` |

**Ready to deploy? Follow the deployment guide above!** 🚀

*Built with ❤️ for the Valinor Alliance community*
