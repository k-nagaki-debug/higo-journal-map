#!/bin/bash

# Local database backup script
# Usage: ./scripts/backup-local-db.sh

BACKUP_DIR="/home/user/webapp/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE=$(find /home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" | head -1)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
    # Copy database file
    cp "$DB_FILE" "$BACKUP_DIR/local_db_backup_$TIMESTAMP.sqlite"
    
    # Export as SQL dump using wrangler
    cd /home/user/webapp
    npx wrangler d1 execute webapp-production --local --command="SELECT * FROM facilities;" > "$BACKUP_DIR/facilities_backup_$TIMESTAMP.json"
    
    echo "✅ Backup created: $BACKUP_DIR/local_db_backup_$TIMESTAMP.sqlite"
    echo "✅ JSON export: $BACKUP_DIR/facilities_backup_$TIMESTAMP.json"
    
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/local_db_backup_*.sqlite | tail -n +11 | xargs -r rm
    ls -t "$BACKUP_DIR"/facilities_backup_*.json | tail -n +11 | xargs -r rm
    
    echo "🗑️  Old backups cleaned up (keeping last 10)"
else
    echo "❌ Database file not found"
    exit 1
fi
