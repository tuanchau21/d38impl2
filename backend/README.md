# Backend — d38shop API

Per [plan/backend-technical-design.md](../../plan/backend-technical-design.md), this directory is the **backend implementation root**. It contains only backend logic: Next.js API routes, MySQL HeatWave access, Oracle Object Storage uploads, and admin protection. No UI or pages (except a minimal root for the App Router).

- **Run:** `npm run dev` (port 3001) or `npm run build` then `npm run start`.
- **Env:** Copy `../deploy/.env.example` to `.env` and set DB, Object Storage, and `ADMIN_API_KEY`.
- **Deploy:** Build and run this app alongside the frontend; Nginx proxies `/api` to this process (see [plan/deployment-plan.md](../../plan/deployment-plan.md)).
