# Deployment artifacts — d38shop

Artifacts for deploying the bulk shoe shop to Oracle Cloud Always Free. See [../../plan/high-level-plan.md](../../plan/high-level-plan.md) and the [deployment plan](../../plan/deployment-plan.md) for full context.

**Repo root:** The directory that contains `backend/`, `frontend/`, and `deploy/` (e.g. `implementation/` when the clone is named `d38shop`). All commands that say “from repo root” use this directory.

---

## From-scratch setup (short)

Use this order when setting up a **new** environment. For details and upgrade paths see the [deployment plan](../../plan/deployment-plan.md) (Section 2.1 and Section 7).

1. **Provision** — MySQL HeatWave, Object Storage bucket + credentials, Compute VM (same region). Record DB and OSS settings.
2. **VM** — SSH to VM. Install Node.js LTS, PM2. Create app dir, clone repo. **Repo root** = directory with `backend/`, `frontend/`, `deploy/`.
3. **Env** — Copy `deploy/.env.backend.example` → `backend/.env`, `deploy/.env.frontend.example` → `frontend/.env`; fill all values.
4. **Database** — Create DB if needed (or use `node ../deploy/setup-database.js --create-db` from `backend/` to drop DB if exists, create from scratch, apply schema, and verify). Otherwise apply `deploy/schema.sql` then verify (or run `node ../deploy/setup-database.js` from `backend/` for schema + verify). Do **not** run migrations on a fresh DB.
5. **First admin** — From `backend/`: `node ../deploy/manage-admin-users.js create --email you@example.com --password yourpassword` (or use `seed-admin.js` with env vars). Requires `npm ci` in backend first.
6. **Nginx** — Install Nginx, copy `deploy/nginx-d38shop.conf` to `/etc/nginx/conf.d/d38shop.conf`, set `server_name`, reload. Open ports 80/443 on security list if needed.
7. **Build & run** — From repo root: `deploy/deploy.sh`, then `pm2 save` and `pm2 startup`. Verify with `pm2 status` and curl to `:3000` and `:3001/api/products`.

**If you see “Unknown column 'password_hash'”** when creating an admin, the DB was created with an older schema. Apply `deploy/migrations/002_admin_users_table.sql` (see deployment plan §7.3), then create the admin again.

---

## Artifacts reference

| File                      | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **nginx-d38shop.conf**    | Nginx reverse proxy: `/api` → backend (port 3001), all other paths → frontend (port 3000). Optional: SSL, basic auth or IP allowlist for `/admin` and `/api/admin`.                                                                                                                                                                                                                                                                                                                                                                                 |
| **.env.backend.example**  | Backend env template (DB, Object Storage, `ADMIN_API_KEY`). Copy to `backend/.env` on the server (paths relative to repo root). See deployment plan §4.6.                                                                                                                                                                                                                                                                                                                                                                                           |
| **.env.frontend.example** | Frontend env template (`API_URL` or `NEXT_PUBLIC_API_URL` for SSR). Copy to `frontend/.env` (optional).                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **schema.sql**            | MySQL HeatWave schema: `categories`, `products`, `product_images`, `users` (placeholder), `admin_users`, `sessions`, plus placeholders. Run **once** per new database. Used by the backend.                                                                                                                                                                                                                                                                                                                                                           |
| **setup-database.js**     | DB setup: apply schema + verify using `backend/.env` (same layout as `.env.backend.example`). From `backend/`: `node ../deploy/setup-database.js`. Optional: `--create-db` to **drop** the database if it exists, create from scratch, then apply schema and verify. Requires `npm ci` in backend (mysql2).                                                                                                                                                                                                                    |
| **deploy.sh**             | Builds and starts both apps. From **repo root**: `deploy/deploy.sh`. Runs `npm ci` and `npm run build` in `backend` and `frontend`, then restarts `d38shop-backend` and `d38shop-frontend` via PM2.                                                                                                                                                                                                                                                                                                                                                     |
| **seed-admin.js**         | One-time seed: create first admin from env `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (see script header). Run from `backend/`: `node ../deploy/seed-admin.js` (backend must have `npm ci` so bcrypt/mysql2 resolve).                                                                                                                                                                                                                                                                                                                                   |
| **manage-admin-users.js** | CLI to create, edit, or remove admin users (stored in `admin_users` table). Reads DB from `backend/.env`. From `backend/`: `node ../deploy/manage-admin-users.js create --email admin@example.com --password secret` (optional: `--name`, `--role`). Edit/remove: same script with `edit` or `remove`. If you see “Unknown column 'password_hash'”, apply `deploy/migrations/002_admin_users_table.sql` first.                                                                                                                                                 |
| **migrations/**           | For **existing** databases only. From-scratch: use `schema.sql` only. See deployment plan §7.3.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |


## Quick reference

- **Full from-scratch steps:** See “From-scratch setup (short)” above and the [deployment plan](../../plan/deployment-plan.md) Section 2.1.
- **Database:** New DB → run `node ../deploy/setup-database.js` (or `--create-db`) from `backend/`, or apply `deploy/schema.sql` manually. Existing DB upgrade → see deployment plan §7.3 (migrations).
- **First admin:** From `backend/` after `npm ci`: `node ../deploy/manage-admin-users.js create --email you@example.com --password yourpassword`.
- **Build & run:** From repo root: `deploy/deploy.sh`, then `pm2 save` and `pm2 startup`.

