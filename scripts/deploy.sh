#!/bin/bash

# Valinor Discord Bot & Web App Deployment Script
# For Digital Ocean Droplet

set -e  # Exit on any error

echo "🚀 Starting Valinor deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Installing system dependencies..."

# Update system
apt update && apt upgrade -y

# Install Node.js 18 if not already installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
else
    print_status "PM2 already installed"
fi

# Install dependencies for web app
print_status "Installing web app dependencies..."
npm install

# Build web app
print_status "Building web app..."
npm run build

# Install dependencies for bot
print_status "Installing bot dependencies..."
cd bot
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cat > .env << 'EOF'
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=1399211561670807665

# Database Configuration
DATABASE_PATH=./database.sqlite

# Production settings
NODE_ENV=production
PORT=3000

# Note: Politics and War API key will be configured via web interface
# Note: Bot monitoring settings will be configured via Discord slash commands
EOF
    print_warning "Please edit .env file with your Discord bot token:"
    print_warning "nano .env"
    print_warning ""
    print_warning "After deployment:"
    print_warning "1. Set Discord token in .env and restart: pm2 restart valinor-bot"
    print_warning "2. Use Discord slash commands to configure the bot"
    print_warning "3. Use web interface to set Politics and War API key"
else
    print_status ".env file already exists"
fi

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'valinor-web',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 3000',
      cwd: '/opt/valinor',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/valinor-web-error.log',
      out_file: '/var/log/valinor-web-out.log',
      log_file: '/var/log/valinor-web-combined.log'
    },
    {
      name: 'valinor-bot',
      script: 'npm',
      args: 'start',
      cwd: '/opt/valinor/bot',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/valinor-bot-error.log',
      out_file: '/var/log/valinor-bot-out.log',
      log_file: '/var/log/valinor-bot-combined.log'
    }
  ]
};
EOF

# Install and configure Nginx
if ! command -v nginx &> /dev/null; then
    print_status "Installing and configuring Nginx..."
    apt install -y nginx
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/valinor << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site and remove default
    ln -sf /etc/nginx/sites-available/valinor /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    nginx -t
    systemctl enable nginx
    systemctl restart nginx
    
    print_status "Nginx installed and configured"
else
    print_status "Nginx already installed"
fi

# Setup UFW firewall
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw --force enable
    print_status "Firewall configured"
fi

# Create log directory
mkdir -p /var/log
touch /var/log/valinor-web-error.log
touch /var/log/valinor-web-out.log
touch /var/log/valinor-web-combined.log
touch /var/log/valinor-bot-error.log
touch /var/log/valinor-bot-out.log
touch /var/log/valinor-bot-combined.log

# Start applications with PM2
print_status "Starting applications with PM2..."

# Stop any existing processes
pm2 delete all 2>/dev/null || true

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration and set up startup
pm2 save
pm2 startup systemd -u root --hp /root

print_status "Setting up log rotation..."
cat > /etc/logrotate.d/valinor << 'EOF'
/var/log/valinor-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# Create update script
print_status "Creating update script..."
cat > /opt/valinor/update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating Valinor..."

cd /opt/valinor

# Pull latest changes
git pull origin main

# Update dependencies
npm install
cd bot && npm install && cd ..

# Rebuild web app
npm run build

# Restart applications
pm2 restart all

echo "✅ Update complete!"
EOF

chmod +x /opt/valinor/update.sh

# Create backup script
print_status "Creating backup script..."
cat > /opt/valinor/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database if it exists
if [ -f "/opt/valinor/bot/database.sqlite" ]; then
    cp /opt/valinor/bot/database.sqlite $BACKUP_DIR/database_$DATE.sqlite
fi

# Backup environment file
if [ -f "/opt/valinor/.env" ]; then
    cp /opt/valinor/.env $BACKUP_DIR/env_$DATE.backup
fi

# Keep only last 7 days of backups
find $BACKUP_DIR -name "database_*.sqlite" -mtime +7 -delete 2>/dev/null || true
find $BACKUP_DIR -name "env_*.backup" -mtime +7 -delete 2>/dev/null || true

echo "Backup completed: $DATE"
EOF

chmod +x /opt/valinor/backup.sh

# Create health check script
print_status "Creating health check script..."
cat > /opt/valinor/healthcheck.sh << 'EOF'
#!/bin/bash

# Check if web app is responding
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Web app is healthy"
else
    echo "❌ Web app is not responding"
    pm2 restart valinor-web
fi

# Check if bot process is running
if pm2 describe valinor-bot | grep -q "online"; then
    echo "✅ Bot is running"
else
    echo "❌ Bot is not running"
    pm2 restart valinor-bot
fi
EOF

chmod +x /opt/valinor/healthcheck.sh

print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Configuration Steps:"
echo ""
echo "1. Set your Discord bot token:"
echo "   nano /opt/valinor/.env"
echo "   # Edit DISCORD_TOKEN=your_actual_token"
echo "   pm2 restart valinor-bot"
echo ""
echo "2. Invite bot to Discord server:"
echo "   https://discord.com/api/oauth2/authorize?client_id=1399211561670807665&permissions=414464724032&scope=bot%20applications.commands"
echo ""
echo "3. Configure bot via Discord slash commands:"
echo "   /set-api-key your_politics_and_war_api_key"
echo "   /monitor-wars 10523 your_channel_id"
echo ""
echo "4. Configure web app:"
echo "   Visit: http://$(curl -s ifconfig.me)/"
echo "   Go to API Settings and enter your Politics and War API key"
echo ""
echo "5. Useful management commands:"
echo "   - Check status: pm2 status"
echo "   - View logs: pm2 logs"
echo "   - Restart: pm2 restart all"
echo "   - Update: /opt/valinor/update.sh"
echo "   - Backup: /opt/valinor/backup.sh"
echo ""
print_status "✨ Much better workflow - configure through Discord and web interface!"
