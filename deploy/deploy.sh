#!/usr/bin/env bash
# d38shop — build and restart on Oracle Cloud VM
# Usage: from Next.js app root (implementation/frontend), run: ../deploy/deploy.sh
#    or: from repo root, run: implementation/deploy/deploy.sh (script will use implementation/frontend)
# Requires: Node.js, npm, PM2 (npm install -g pm2). Load .env before or in the app.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PARENT/package.json" ]; then
  APP_DIR="$PARENT"
else
  APP_DIR="${PARENT}/frontend"
fi
APP_DIR="${APP_DIR:-$PARENT}"
cd "$APP_DIR"

echo "[deploy] App dir: $APP_DIR"

# Install dependencies (production only when deploying for run)
if [ -z "${SKIP_NPM_CI}" ]; then
  echo "[deploy] Running npm ci..."
  npm ci
fi

# Build Next.js
echo "[deploy] Building Next.js..."
npm run build

# Restart with PM2 if available
if command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] Restarting via PM2..."
  if pm2 describe d38shop >/dev/null 2>&1; then
    pm2 restart d38shop
  else
    pm2 start npm --name d38shop -- start
    pm2 save
  fi
  echo "[deploy] Done. Check: pm2 logs d38shop"
else
  echo "[deploy] PM2 not found. Build complete. Run manually: npm run start (or use systemd)"
fi
