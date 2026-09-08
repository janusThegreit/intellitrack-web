#!/bin/sh
set -e

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  fi
fi

if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

php artisan optimize:clear
php artisan migrate --force
php artisan storage:link || true

PORT="${PORT:-8000}"
echo "Starting IntelliTrack Web on port ${PORT}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT}"