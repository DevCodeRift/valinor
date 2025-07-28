#!/bin/bash

# Quick deployment script for Digital Ocean App Platform

echo "🚀 Preparing for Digital Ocean App Platform deployment..."

# Create .env.example for reference
cat > .env.example << 'EOF'
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=1399211561670807665

# Database Configuration (App Platform will use PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# Politics and War API
PW_API_KEY=your_politics_and_war_api_key

# Production settings
NODE_ENV=production
PORT=8080
EOF

# Create app.yaml for App Platform
cat > .do/app.yaml << 'EOF'
name: valinor
services:
- name: web
  source_dir: /
  github:
    repo: your-username/valinor
    branch: main
  run_command: npm run build && npm run preview -- --host 0.0.0.0 --port $PORT
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 8080
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: production
    
- name: bot
  source_dir: /bot
  github:
    repo: your-username/valinor
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DISCORD_TOKEN
    value: ${DISCORD_TOKEN}
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
    
databases:
- engine: PG
  name: db
  num_nodes: 1
  size: db-s-dev-database
  version: "13"
EOF

# Create directories
mkdir -p .do scripts

echo "✅ App Platform configuration created!"
echo ""
echo "📋 Next steps for App Platform deployment:"
echo ""
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m \"Prepare for App Platform deployment\""
echo "   git push origin main"
echo ""
echo "2. Go to Digital Ocean Console > Apps"
echo "3. Click 'Create App'"
echo "4. Select your GitHub repository"
echo "5. Use the generated .do/app.yaml configuration"
echo "6. Set environment variables in the App Platform console:"
echo "   - DISCORD_TOKEN (your Discord bot token)"
echo "   - PW_API_KEY (your Politics and War API key)"
echo ""
echo "7. Deploy and wait for the application to start"
echo ""
echo "The app will be available at the provided App Platform URL."
