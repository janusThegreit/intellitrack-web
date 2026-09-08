#!/bin/sh
set -e

# Map and parse DATABASE_URL if provided (e.g. from Neon.tech, Supabase, etc.)
ACTIVE_DB_URL="${DATABASE_URL:-$DB_URL}"
if [ -n "$ACTIVE_DB_URL" ]; then
  export DATABASE_URL="$ACTIVE_DB_URL"
  export DB_URL="$ACTIVE_DB_URL"
  eval $(php -r '
    $url = parse_url(getenv("ACTIVE_DB_URL"));
    if ($url) {
      if (!empty($url["host"])) echo "export DB_HOST=" . escapeshellarg($url["host"]) . ";\n";
      if (!empty($url["port"])) echo "export DB_PORT=" . escapeshellarg((string)$url["port"]) . ";\n";
      if (!empty($url["path"])) echo "export DB_DATABASE=" . escapeshellarg(ltrim($url["path"], "/")) . ";\n";
      if (!empty($url["user"])) echo "export DB_USERNAME=" . escapeshellarg($url["user"]) . ";\n";
      if (!empty($url["pass"])) echo "export DB_PASSWORD=" . escapeshellarg($url["pass"]) . ";\n";
    }
  ')
fi

# Support DB_USER alias if set
if [ -n "$DB_USER" ] && [ -z "$DB_USERNAME" ]; then
  export DB_USERNAME="$DB_USER"
fi

# Ensure .env exists so artisan commands don't complain
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
fi

# Sync active DB variables to .env if set
if [ -n "$DATABASE_URL" ]; then
  if grep -q "^DATABASE_URL=" .env 2>/dev/null; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env
  else
    echo "DATABASE_URL=${DATABASE_URL}" >> .env
  fi
  if grep -q "^DB_URL=" .env 2>/dev/null; then
    sed -i "s|^DB_URL=.*|DB_URL=${DATABASE_URL}|" .env
  else
    echo "DB_URL=${DATABASE_URL}" >> .env
  fi
fi

if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "127.0.0.1" ] && [ "$DB_HOST" != "db" ]; then
  if grep -q "^DB_HOST=" .env 2>/dev/null; then
    sed -i "s|^DB_HOST=.*|DB_HOST=${DB_HOST}|" .env
  fi
fi
if [ -n "$DB_DATABASE" ]; then
  if grep -q "^DB_DATABASE=" .env 2>/dev/null; then
    sed -i "s|^DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE}|" .env
  fi
fi
if [ -n "$DB_USERNAME" ]; then
  if grep -q "^DB_USERNAME=" .env 2>/dev/null; then
    sed -i "s|^DB_USERNAME=.*|DB_USERNAME=${DB_USERNAME}|" .env
  fi
fi
if [ -n "$DB_PASSWORD" ]; then
  if grep -q "^DB_PASSWORD=" .env 2>/dev/null; then
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env
  fi
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