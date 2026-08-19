#!/bin/sh
set -e

if [ ! -f .env ]; then
  cp .env.example .env
fi

php artisan key:generate --force
php artisan migrate --force
php artisan storage:link || true
php artisan config:clear

exec php artisan serve --host=0.0.0.0 --port=8000
