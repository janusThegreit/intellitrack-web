#!/bin/sh
set -e

# Map DATABASE_URL to DB_URL if provided by cloud platforms like Koyeb/Render/Railway
if [ -n "$DATABASE_URL" ] && [ -z "$DB_URL" ]; then
  export DB_URL="$DATABASE_URL"
fi

# Normalize DB credentials across host platforms
if [ "$DB_HOST" = "db" ] || [ -z "$DB_HOST" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
  export DB_HOST="postgresql-pzpescve.internal"
fi
if [ "$DB_PORT" = "" ] || [ -z "$DB_PORT" ]; then
  export DB_PORT="5432"
fi
if [ "$DB_DATABASE" = "intellitrack_db" ] || [ -z "$DB_DATABASE" ]; then
  export DB_DATABASE="hf_db_pzpescve"
fi
if [ "$DB_USERNAME" = "intellitrack_web" ] || [ -z "$DB_USERNAME" ] || [ "$DB_USERNAME" = "hf_dmqlt7pxci" ]; then
  export DB_USERNAME="hf_aup2rjxdid"
fi
if [ -n "$DB_USER" ]; then
  export DB_USERNAME="$DB_USER"
fi
if [ "$DB_PASSWORD" = "intellitrack_password" ] || [ -z "$DB_PASSWORD" ]; then
  export DB_PASSWORD="7B9UGfusvvsYTXIfNb5PUpgGKXTZYs9g"
fi

# Ensure .env exists so artisan commands don't complain
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
fi

# Update DB_HOST in .env if it was set to "db"
if grep -q "DB_HOST=db" .env 2>/dev/null; then
  sed -i "s|DB_HOST=db|DB_HOST=postgresql-pzpescve.internal|" .env
fi
if grep -q "DB_DATABASE=intellitrack_db" .env 2>/dev/null; then
  sed -i "s|DB_DATABASE=intellitrack_db|DB_DATABASE=hf_db_pzpescve|" .env
fi
if grep -q "DB_USERNAME=intellitrack_web" .env 2>/dev/null; then
  sed -i "s|DB_USERNAME=intellitrack_web|DB_USERNAME=hf_aup2rjxdid|" .env
fi
if grep -q "DB_PASSWORD=intellitrack_password" .env 2>/dev/null; then
  sed -i "s|DB_PASSWORD=intellitrack_password|DB_PASSWORD=7B9UGfusvvsYTXIfNb5PUpgGKXTZYs9g|" .env
fi

# Generate and export application key if not set
APP_KEY_TRIMMED=$(echo "$APP_KEY" | tr -d '[:space:]')
if [ -z "$APP_KEY_TRIMMED" ]; then
  EXISTING_KEY=$(grep "^APP_KEY=base64:" .env 2>/dev/null | cut -d '=' -f2- | tr -d '\r[:space:]')
  if [ -n "$EXISTING_KEY" ]; then
    export APP_KEY="$EXISTING_KEY"
  else
    echo "Generating new application key..."
    NEW_KEY=$(php artisan key:generate --show --no-ansi | tr -d '\r[:space:]')
    if [ -n "$NEW_KEY" ]; then
      export APP_KEY="$NEW_KEY"
      if grep -q "^APP_KEY=" .env 2>/dev/null; then
        sed -i "s|^APP_KEY=.*|APP_KEY=${NEW_KEY}|" .env
      else
        echo "APP_KEY=${NEW_KEY}" >> .env
      fi
    fi
  fi
fi

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = '""' ] || [ "$APP_KEY" = "''" ]; then
  export APP_KEY="base64:wEFibhxIILPLd8k9dYOfxAqV/5Ios9SicOeHj9ndKfQ="
fi

# Clear old configuration and optimize cache
php artisan optimize:clear || true
php artisan storage:link || true

# Run database migrations and seeds without crashing the container if DB is not ready yet
if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  echo "Checking database connection and running migrations..."
  php artisan migrate --force --isolated || echo "WARNING: Database migration failed. Continuing application startup..."
  php artisan db:seed --force || echo "WARNING: Database seeding failed."
fi

# Determine the port to bind to (Koyeb/Hostforge injects dynamic PORT, default to 8000)
PORT="${PORT:-8000}"
export PHP_CLI_SERVER_WORKERS="${PHP_CLI_SERVER_WORKERS:-4}"

echo "Starting IntelliTrack Web on 0.0.0.0:${PORT}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT}"