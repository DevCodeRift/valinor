#!/bin/bash

# Backup script for Valinor Alliance Monitor
# Run this script to backup your data before updates

BACKUP_DIR="/opt/valinor/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="valinor_backup_$TIMESTAMP.tar.gz"

echo "🗄️  Creating backup: $BACKUP_FILE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
cd /opt/valinor
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='logs' \
    --exclude='.git' \
    .

echo "✅ Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t valinor_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "🧹 Old backups cleaned up"
echo "📁 Available backups:"
ls -lah valinor_backup_*.tar.gz
