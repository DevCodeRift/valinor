#!/bin/bash

# Digital Ocean Deployment Script for Valinor Alliance Monitor
# Run this script on your Digital Ocean droplet

set -e

echo "🚀 Starting Valinor Alliance Monitor deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🔧 Installing Docker and dependencies..."
sudo apt install -y docker.io docker-compose git curl

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Create application directory
APP_DIR="/opt/valinor"
echo "📁 Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

# Clone repository (replace with your actual repository URL)
echo "📥 Cloning repository..."
if [ ! -d ".git" ]; then
    echo "Please run: git clone <your-repository-url> ."
    echo "Then run this script again."
    exit 1
fi

# Create environment file
echo "⚙️ Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "🔧 Please edit .env file with your actual values:"
    echo "  - DISCORD_TOKEN"
    echo "  - DISCORD_CLIENT_ID"
    echo "  - PW_API_KEY (optional)"
    echo ""
    echo "Run: nano .env"
    echo "Then run this script again with --skip-setup flag"
    exit 1
fi

# Create data directory
sudo mkdir -p /opt/valinor/data
sudo chown $USER:$USER /opt/valinor/data

# Build and start the application
echo "🏗️ Building and starting application..."
sudo docker-compose down || true
sudo docker-compose build
sudo docker-compose up -d

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

# Setup Nginx reverse proxy (optional)
read -p "🌐 Setup Nginx reverse proxy? (y/n): " setup_nginx
if [ "$setup_nginx" = "y" ]; then
    sudo apt install -y nginx certbot python3-certbot-nginx
    
    read -p "Enter your domain name: " domain_name
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/valinor << EOF
server {
    listen 80;
    server_name $domain_name;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/valinor /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    # Setup SSL certificate
    read -p "🔒 Setup SSL certificate with Let's Encrypt? (y/n): " setup_ssl
    if [ "$setup_ssl" = "y" ]; then
        sudo certbot --nginx -d $domain_name
    fi
fi

# Setup automatic updates
echo "🔄 Setting up automatic updates..."
sudo tee /opt/valinor/update.sh << 'EOF'
#!/bin/bash
cd /opt/valinor
git pull
sudo docker-compose build
sudo docker-compose up -d
EOF

sudo chmod +x /opt/valinor/update.sh

# Add to crontab for weekly updates
(crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/valinor/update.sh") | crontab -

# Display status
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
sudo docker-compose ps

echo ""
echo "🔗 Access your application:"
if [ ! -z "$domain_name" ]; then
    echo "  Web App: https://$domain_name"
else
    echo "  Web App: http://$(curl -s ifconfig.me):3000"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Invite your Discord bot to your server"
echo "2. Use /help command in Discord to see available commands"
echo "3. Set up API keys using /api command"
echo "4. Start monitoring alliances with /alert command"
echo ""
echo "📝 Logs:"
echo "  View logs: sudo docker-compose logs -f"
echo "  Bot logs: sudo docker-compose logs -f valinor-monitor"
echo ""
echo "🔧 Management:"
echo "  Stop: sudo docker-compose down"
echo "  Start: sudo docker-compose up -d"
echo "  Update: /opt/valinor/update.sh"
echo ""
echo "🆘 Troubleshooting:"
echo "  Check bot token and permissions if Discord commands don't work"
echo "  Verify API key if data isn't loading"
echo "  Check firewall settings if web app isn't accessible"
echo ""
EOF
