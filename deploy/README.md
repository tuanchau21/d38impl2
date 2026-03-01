# Deployment artifacts — d38shop

Artifacts for deploying the bulk shoe shop to Oracle Cloud Always Free. See [../../plan/high-level-plan.md](../../plan/high-level-plan.md) and the [deployment plan](../../plan/deployment-plan.md) for full context.

| File | Purpose |
|------|--------|
| **nginx-d38shop.conf** | Nginx reverse proxy: `/api` → backend (port 3001), all other paths → frontend (port 3000). Optional: SSL, basic auth or IP allowlist for `/admin` and `/api/admin`. |
| **.env.example** | Index: points to `.env.backend.example` and `.env.frontend.example`. |
| **.env.backend.example** | Backend env template (DB, Object Storage, `ADMIN_API_KEY`). Copy to `implementation/backend/.env` on the server. |
| **.env.frontend.example** | Frontend env template (`API_URL` or `NEXT_PUBLIC_API_URL` for SSR). Copy to `implementation/frontend/.env` (optional). |
| **schema.sql** | MySQL HeatWave schema: `categories`, `products`, `product_images`, plus placeholder tables. Run once per database. Used by the backend. |
| **deploy.sh** | Builds and starts both apps: from repo root run `implementation/deploy/deploy.sh`. Runs `npm ci` and `npm run build` in `implementation/backend` and `implementation/frontend`, then restarts `d38shop-backend` and `d38shop-frontend` via PM2. |
| **seed-admin.js** | One-time seed: create first admin from env `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (see script header). |
| **manage-admin-users.js** | CLI to create, edit, or remove admin users. DB from `DATABASE_URL` or `MYSQL_*`. **Create:** `node implementation/deploy/manage-admin-users.js create --email admin@example.com --password secret` (optional: `--name`, `--role`). **Edit:** `node implementation/deploy/manage-admin-users.js edit --email admin@example.com` (optional: `--password`, `--name`, `--role`). **Remove:** `node implementation/deploy/manage-admin-users.js remove --email admin@example.com` or `--id 1`. Requires `bcrypt` and `mysql2` (e.g. install in backend). |

## Quick usage

1. **Provision:** Create MySQL HeatWave, Object Storage bucket + credentials, and Compute VM (same region).
2. **VM:** Install Node.js LTS, Nginx, PM2. Create app dir (e.g. `/var/www/d38shop`), clone repo. Copy `.env.backend.example` to `implementation/backend/.env` and `.env.frontend.example` to `implementation/frontend/.env` (optional); fill values for each app.
3. **Nginx:** Include or copy `nginx-d38shop.conf`; set `server_name` and reload Nginx.
4. **Database:** Run `schema.sql` against the app database (e.g. `mysql -h HOST -u USER -p DATABASE < implementation/deploy/schema.sql` from repo root).
5. **Deploy:** From repo root run `implementation/deploy/deploy.sh` to build and start both frontend and backend.
