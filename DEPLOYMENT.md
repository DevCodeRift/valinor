# Valinor - Digital Ocean Deployment Guide

This guide will walk you through deploying both the Discord bot and React web application on Digital Ocean.

## Prerequisites

1. Digital Ocean account
2. Domain name (optional, but recommended)
3. Docker installed locally for testing
4. Politics and War API key
5. Discord bot token

## Deployment Options

We'll cover two deployment approaches:

### Option 1: App Platform (Recommended for beginners)
- Easier setup, managed infrastructure
- Automatic scaling and SSL
- Higher cost but less maintenance

### Option 2: Droplet with Docker (More cost-effective)
- Manual setup but full control
- Lower cost for small applications
- Requires more technical knowledge

---

## Option 1: Digital Ocean App Platform

### Step 1: Prepare Your Repository

1. Push your code to GitHub/GitLab
2. Make sure your repository is public or you have access configured

### Step 2: Create App Platform Application

1. Log into Digital Ocean Console
2. Go to **Apps** in the left sidebar
3. Click **Create App**
4. Choose **GitHub** as source
5. Select your repository: `your-username/valinor`
6. Choose branch: `main`

### Step 3: Configure Services

#### Web Application (React)
```yaml
name: web
source_dir: /
github:
  repo: your-username/valinor
  branch: main
run_command: npm run build && npm run preview -- --host 0.0.0.0 --port $PORT
environment_slug: node-js
instance_count: 1
instance_size_slug: basic-xxs
```

#### Discord Bot Service
```yaml
name: bot
source_dir: /bot
github:
  repo: your-username/valinor
  branch: main
run_command: npm start
environment_slug: node-js
instance_count: 1
instance_size_slug: basic-xxs
```

### Step 4: Set Environment Variables

For the **bot** service, add these environment variables:
- `DISCORD_TOKEN`: Your Discord bot token
- `DATABASE_URL`: Will be auto-generated when you add a database
- `NODE_ENV`: production

### Step 5: Add Database

1. In App Platform, go to **Database** tab
2. Add **Dev Database** (SQLite won't work in App Platform, so we'll use PostgreSQL)
3. Choose **PostgreSQL**
4. Select smallest size for cost efficiency

### Step 6: Deploy

1. Review configuration
2. Click **Create Resources**
3. Wait for deployment (5-10 minutes)

---

## Option 2: Digital Ocean Droplet (Recommended)

### Step 1: Create Droplet

1. Go to **Droplets** in Digital Ocean
2. Click **Create Droplet**
3. Choose Ubuntu 22.04 LTS
4. Select **Basic** plan
5. Choose **Regular Intel** with SSD
6. Select **$6/month** (1GB RAM, 1vCPU) - sufficient for small apps
7. Choose datacenter region closest to your users
8. Add SSH key or set password
9. Set hostname: `valinor-server`
10. Click **Create Droplet**

### Step 2: Initial Server Setup

SSH into your droplet:
```bash
ssh root@your_droplet_ip
```

Update system and install Docker:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git and Node.js
apt install -y git nodejs npm

# Create application directory
mkdir -p /opt/valinor
cd /opt/valinor
```

### Step 3: Clone and Setup Application

```bash
# Clone your repository
git clone https://github.com/your-username/valinor.git .

# Create environment file
cp .env.example .env
nano .env
```

### Step 4: Configure Environment Variables

Create `/opt/valinor/.env`:
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=1399211561670807665

# Database Configuration
DATABASE_PATH=/data/database.sqlite

# Production settings
NODE_ENV=production
PORT=3000
BOT_PORT=3001

# Note: PW_API_KEY will be configured through the web interface
# Note: Bot configuration will be done via Discord slash commands
```

### Step 5: Build and Deploy

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### Step 6: Setup Nginx (Optional but recommended)

Install and configure Nginx for better performance:

```bash
# Install Nginx
apt install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/valinor << 'EOF'
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/valinor /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### Step 7: Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d your_domain.com -d www.your_domain.com
```

### Step 8: Setup Systemd Services for Auto-restart

Create systemd service files:

```bash
# Create web app service
cat > /etc/systemd/system/valinor-web.service << 'EOF'
[Unit]
Description=Valinor Web Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/valinor
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Create bot service
cat > /etc/systemd/system/valinor-bot.service << 'EOF'
[Unit]
Description=Valinor Discord Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/valinor/bot
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/valinor/.env

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
systemctl daemon-reload
systemctl enable valinor-web valinor-bot
systemctl start valinor-web valinor-bot

# Check status
systemctl status valinor-web
systemctl status valinor-bot
```

---

## Post-Deployment Configuration

### 1. Configure Discord Bot Token (One-time setup)

You only need to set the Discord bot token in the environment:

```bash
# Edit the environment file
nano /opt/valinor/.env

# Set your Discord token:
DISCORD_TOKEN=your_actual_discord_bot_token

# Restart the bot
pm2 restart valinor-bot
```

### 2. Configure Bot Settings via Discord

Once the bot is running and invited to your Discord server, use slash commands to configure it:

```
/set-api-key your_politics_and_war_api_key
/monitor-wars 10523 your_channel_id
```

### 3. Configure Web App Settings

1. Visit your web application at `http://your_domain.com`
2. Go to **API Settings**
3. Enter your Politics and War API key
4. Test the connection

This approach is much better because:
- **Secure**: API keys are stored in the database, not environment files
- **User-friendly**: Configuration through Discord commands and web interface
- **Flexible**: Different users can configure different settings
- **Auditable**: Changes are logged and can be tracked

### 4. Setup Firewall

```bash
# Setup UFW firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
```

### 2. Setup Monitoring

```bash
# Install htop for monitoring
apt install -y htop

# View logs
journalctl -u valinor-web -f
journalctl -u valinor-bot -f
```

### 3. Setup Automatic Updates

```bash
# Create update script
cat > /opt/valinor/update.sh << 'EOF'
#!/bin/bash
cd /opt/valinor
git pull origin main
npm install
npm run build
systemctl restart valinor-web valinor-bot
EOF

chmod +x /opt/valinor/update.sh

# Setup cron for automatic updates (optional)
# crontab -e
# Add: 0 2 * * * /opt/valinor/update.sh >> /var/log/valinor-update.log 2>&1
```

### 4. Access Your Application

- **Web App**: http://your_droplet_ip:3000 or http://your_domain.com
- **Bot**: Should automatically connect to Discord

### 5. Configure API Key

1. Visit your web application
2. Go to **API Settings**
3. Enter your Politics and War API key
4. Test the connection

---

## Troubleshooting

### Check Application Status
```bash
# Check if services are running
systemctl status valinor-web valinor-bot

# Check application logs
journalctl -u valinor-web -n 50
journalctl -u valinor-bot -n 50

# Check if ports are open
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
```

### Common Issues

1. **Bot not connecting**: Check Discord token in environment variables
2. **Web app not accessible**: Check firewall and Nginx configuration
3. **Database errors**: Ensure proper file permissions for SQLite
4. **API errors**: Verify Politics and War API key is correct

### Manual Restart
```bash
# Restart services
systemctl restart valinor-web valinor-bot

# Restart Nginx (if using)
systemctl restart nginx
```

---

## Cost Estimation

### Option 1: App Platform
- Web Service: ~$5/month
- Bot Service: ~$5/month
- Database: ~$7/month
- **Total: ~$17/month**

### Option 2: Droplet
- Basic Droplet (1GB): $6/month
- Domain (optional): ~$12/year
- **Total: ~$6-7/month**

---

## Security Best Practices

1. **Never commit sensitive data** to your repository
2. **Use environment variables** for all secrets
3. **Keep your droplet updated** regularly
4. **Setup automated backups** for your database
5. **Use strong passwords** and SSH keys
6. **Monitor your application logs** regularly

---

## Backup Strategy

```bash
# Create backup script
cat > /opt/valinor/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp /opt/valinor/bot/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# Backup environment file
cp /opt/valinor/.env $BACKUP_DIR/env_$DATE.backup

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete
EOF

chmod +x /opt/valinor/backup.sh

# Add to cron for daily backups
# crontab -e
# Add: 0 1 * * * /opt/valinor/backup.sh
```

This comprehensive guide should get you up and running on Digital Ocean! I recommend starting with **Option 2 (Droplet)** as it's more cost-effective and gives you full control over your environment.
