#!/bin/sh
set -e

echo "ClawdOS — waiting for database..."

# Wait for PostgreSQL to accept connections (up to 30s)
attempts=0
until node -e "
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT 1').then(() => { pool.end(); process.exit(0) }).catch(() => { pool.end(); process.exit(1) });
" 2>/dev/null; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 30 ]; then
    echo "ERROR: Database not reachable after 30 seconds"
    exit 1
  fi
  sleep 1
done

echo "Database is ready"

# Apply baseline schema if fresh DB (core schema doesn't exist yet)
HAS_SCHEMA=$(node -e "
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  pool.query(\"SELECT 1 FROM information_schema.schemata WHERE schema_name='core' LIMIT 1\")
    .then(r => { console.log(r.rows.length); pool.end(); })
    .catch(() => { console.log('0'); pool.end(); });
" 2>/dev/null)

if [ "$HAS_SCHEMA" = "0" ]; then
  echo "Fresh database — applying baseline schema..."
  node -e "
    const fs = require('fs');
    const pg = require('pg');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const sql = fs.readFileSync('/app/db/schema.sql', 'utf8');
    pool.query(sql).then(() => { console.log('Baseline schema applied'); pool.end(); }).catch(e => { console.error(e); pool.end(); process.exit(1); });
  "
fi

# Run migrations
echo "Applying migrations..."
node scripts/migrate.mjs
echo "Migrations complete"

# Create default user if CLAWDOS_USER and CLAWDOS_PASSWORD are set and no users exist
if [ -n "$CLAWDOS_USER" ] && [ -n "$CLAWDOS_PASSWORD" ]; then
  echo "Checking for existing users..."
  HAS_USERS=$(node -e "
    const pg = require('pg');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    pool.query('SELECT 1 FROM core.\"user\" LIMIT 1')
      .then(r => { console.log(r.rows.length); pool.end(); })
      .catch(() => { console.log('0'); pool.end(); });
  " 2>/dev/null)

  if [ "$HAS_USERS" = "0" ]; then
    echo "Creating user '$CLAWDOS_USER'..."
    node scripts/create-user.mjs "$CLAWDOS_USER" "$CLAWDOS_PASSWORD"
    echo "User created"
  else
    echo "Users already exist, skipping creation"
  fi
fi

echo "Starting ClawdOS..."
exec "$@"
