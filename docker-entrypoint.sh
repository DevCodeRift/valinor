#!/bin/sh

# Start the Discord bot in the background
echo "Starting Discord bot..."
cd /app/bot && npm start &

# Start the web server using Express
echo "Starting web server..."
cd /app && npm start
