# Deployment artifacts — d38shop

Artifacts for deploying the bulk shoe shop to Oracle Cloud Always Free. See [../../plan/high-level-plan.md](../../plan/high-level-plan.md) and the [deployment plan](../../plan/deployment-plan.md) for full context.

| File | Purpose |
|------|--------|
| **nginx-d38shop.conf** | Nginx reverse proxy for Next.js (port 3000). Optional: SSL, basic auth or IP allowlist for `/admin` and `/api/admin`. |
| **.env.example** | Template for production env vars (DB, Object Storage, `ADMIN_API_KEY`). Copy to `.env` on the server; do not commit values. |
| **schema.sql** | MySQL HeatWave schema: `categories`, `products`, `product_images`, plus placeholder tables for users/orders/payments. Run once per database. |
| **deploy.sh** | Build and restart script: `npm ci`, `npm run build`, then `pm2 restart d38shop` (or start if not yet registered). Run from Next.js app root (`implementation/frontend`): `../deploy/deploy.sh`. |

## Quick usage

1. **Provision:** Create MySQL HeatWave, Object Storage bucket + credentials, and Compute VM (same region).
2. **VM:** Install Node.js LTS, Nginx, PM2. Create app dir (e.g. `/var/www/d38shop`), clone repo. Copy `.env` from `implementation/deploy/.env.example` into `implementation/frontend/.env` and fill values.
3. **Nginx:** Include or copy `nginx-d38shop.conf`; set `server_name` and reload Nginx.
4. **Database:** Run `schema.sql` against the app database (e.g. `mysql -h HOST -u USER -p DATABASE < implementation/deploy/schema.sql` from repo root).
5. **Deploy app:** Clone or rsync repo to VM, then from `implementation/frontend` run `../deploy/deploy.sh`.
