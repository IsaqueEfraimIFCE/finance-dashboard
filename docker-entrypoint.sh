#!/bin/sh
set -e

npx prisma migrate deploy

if [ -n "$SEED_EMAIL" ] && [ -n "$SEED_PASSWORD" ]; then
  npm run seed:user
fi

exec "$@"
