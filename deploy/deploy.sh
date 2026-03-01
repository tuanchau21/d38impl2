#!/usr/bin/env bash
# d38shop — build and restart frontend + backend on Oracle Cloud VM
# Usage: from repo root, run: deploy/deploy.sh
# Requires: Node.js, npm, PM2 (npm install -g pm2). .env in backend/ (and optionally frontend/).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Parent of deploy is repo root (contains backend/, frontend/, deploy/)
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"

echo "[deploy] Repo root: $REPO_ROOT"

# Backend
echo "[deploy] Backend: $BACKEND_DIR"
cd "$BACKEND_DIR"
if [ -z "${SKIP_NPM_CI}" ]; then
  npm ci
fi
npm run build
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe d38shop-backend >/dev/null 2>&1; then
    pm2 restart d38shop-backend
  else
    pm2 start npm --name d38shop-backend -- start
  fi
fi

# Frontend
echo "[deploy] Frontend: $FRONTEND_DIR"
cd "$FRONTEND_DIR"
if [ -z "${SKIP_NPM_CI}" ]; then
  npm ci
fi
npm run build
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe d38shop-frontend >/dev/null 2>&1; then
    pm2 restart d38shop-frontend
  else
    pm2 start npm --name d38shop-frontend -- start
  fi
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 save
  echo "[deploy] Done. Check: pm2 logs d38shop-backend, pm2 logs d38shop-frontend"
else
  echo "[deploy] PM2 not found. Build complete. Run manually: (backend) cd backend && npm run start; (frontend) cd frontend && npm run start"
fi
