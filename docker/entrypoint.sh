#!/bin/sh
set -e

# Map DATABASE_URL to DB_URL if provided by cloud platforms like Koyeb/Render/Railway
if [ -n "$DATABASE_URL" ] && [ -z "$DB_URL" ]; then
  export DB_URL="$DATABASE_URL"
fi

# Ensure .env exists so artisan commands don't complain
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
fi

# Generate application key if not set
if [ -z "$APP_KEY" ]; then
  echo "Generating application key..."
  php artisan key:generate --force || true
fi

# Clear old configuration and optimize cache
php artisan optimize:clear || true
php artisan storage:link || true

# Run database migrations without crashing the container if DB is not ready yet
if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  echo "Checking database connection and running migrations..."
  php artisan migrate --force --isolated || echo "WARNING: Database migration failed. Continuing application startup..."
fi

# Determine the port to bind to (Koyeb injects dynamic PORT, default to 8000)
PORT="${PORT:-8000}"
export PHP_CLI_SERVER_WORKERS="${PHP_CLI_SERVER_WORKERS:-4}"

echo "Starting IntelliTrack Web on 0.0.0.0:${PORT}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT}"