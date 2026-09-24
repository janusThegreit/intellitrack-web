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
      if (!empty($url["query"])) {
        parse_str($url["query"], $q);
        if (!empty($q["sslmode"])) echo "export DB_SSLMODE=" . escapeshellarg($q["sslmode"]) . ";\n";
      }
    }
  ')
fi

# Support DB_USER alias if set
if [ -n "$DB_USER" ] && [ -z "$DB_USERNAME" ]; then
  export DB_USERNAME="$DB_USER"
fi

# Neon Tech and modern cloud Postgres require SSL
if [ -z "$DB_SSLMODE" ]; then
  case "$DB_HOST" in
    *neon.tech*) export DB_SSLMODE="require" ;;
  esac
fi

# Ensure .env exists so artisan commands don't complain
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
fi

# Safely sync active DB variables into .env using PHP to avoid sed escaping issues (&, |, /)
php -r '
  $envFile = ".env";
  if (!file_exists($envFile)) exit(0);
  $content = file_get_contents($envFile);
  $vars = [
    "DATABASE_URL" => getenv("DATABASE_URL"),
    "DB_URL"       => getenv("DB_URL"),
    "DB_HOST"      => getenv("DB_HOST"),
    "DB_PORT"      => getenv("DB_PORT"),
    "DB_DATABASE"  => getenv("DB_DATABASE"),
    "DB_USERNAME"  => getenv("DB_USERNAME"),
    "DB_PASSWORD"  => getenv("DB_PASSWORD"),
    "DB_SSLMODE"   => getenv("DB_SSLMODE"),
  ];
  foreach ($vars as $key => $val) {
    if ($val === false || $val === null || $val === "") continue;
    if (preg_match("/^{$key}=/m", $content)) {
      $content = preg_replace("/^{$key}=.*/m", "{$key}={$val}", $content);
    } else {
      $content .= "\n{$key}={$val}";
    }
  }
  file_put_contents($envFile, $content);
'

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
  php artisan migrate --force || echo "WARNING: Database migration failed. Continuing application startup..."
  php artisan db:seed --force || echo "WARNING: Database seeding failed."
fi

# Determine the port to bind to (Koyeb/Hostforge injects dynamic PORT, default to 8000)
PORT="${PORT:-8000}"
export PHP_CLI_SERVER_WORKERS="${PHP_CLI_SERVER_WORKERS:-4}"

echo "Starting IntelliTrack Web on 0.0.0.0:${PORT}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT}"