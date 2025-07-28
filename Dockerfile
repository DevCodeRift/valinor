# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files for both web app and bot
COPY package*.json ./
COPY bot/package*.json ./bot/

# Install dependencies
RUN npm install
RUN cd bot && npm install

# Copy source code
COPY . .

# Build the web application
RUN npm run build

# Build the Discord bot
RUN cd bot && npm run build

# Expose port 3000 for the web app
EXPOSE 3000

# Create a startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Start both applications
ENTRYPOINT ["/docker-entrypoint.sh"]
