# Deployment artifacts — d38shop

Artifacts for deploying the bulk shoe shop to Oracle Cloud Always Free. See [../../plan/high-level-plan.md](../../plan/high-level-plan.md) and the [deployment plan](../../plan/deployment-plan.md) for full context.

| File | Purpose |
|------|--------|
| **nginx-d38shop.conf** | Nginx reverse proxy: `/api` → backend (port 3001), all other paths → frontend (port 3000). Optional: SSL, basic auth or IP allowlist for `/admin` and `/api/admin`. |
| **.env.example** | Template for **backend** env vars (DB, Object Storage, `ADMIN_API_KEY`). Copy to `implementation/backend/.env` on the server. Frontend may use `API_URL` or `NEXT_PUBLIC_API_URL` in `implementation/frontend/.env` for SSR. |
| **schema.sql** | MySQL HeatWave schema: `categories`, `products`, `product_images`, plus placeholder tables. Run once per database. Used by the backend. |
| **deploy.sh** | Builds and starts both apps: from repo root run `implementation/deploy/deploy.sh`. Runs `npm ci` and `npm run build` in `implementation/backend` and `implementation/frontend`, then restarts `d38shop-backend` and `d38shop-frontend` via PM2. |

## Quick usage

1. **Provision:** Create MySQL HeatWave, Object Storage bucket + credentials, and Compute VM (same region).
2. **VM:** Install Node.js LTS, Nginx, PM2. Create app dir (e.g. `/var/www/d38shop`), clone repo. Copy `.env.example` to `implementation/backend/.env` and fill values; optionally set `API_URL` in `implementation/frontend/.env` for SSR.
3. **Nginx:** Include or copy `nginx-d38shop.conf`; set `server_name` and reload Nginx.
4. **Database:** Run `schema.sql` against the app database (e.g. `mysql -h HOST -u USER -p DATABASE < implementation/deploy/schema.sql` from repo root).
5. **Deploy:** From repo root run `implementation/deploy/deploy.sh` to build and start both frontend and backend.
