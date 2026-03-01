#!/usr/bin/env node
/**
 * Verify admin login from the VM: POST /api/auth/login, then GET /api/auth/me with session cookie.
 * Use after backend is running (e.g. on port 3001). Exits 0 if both succeed.
 *
 * Usage: node deploy/verify-admin-login.js --email admin@example.com --password secret
 *        Or set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD (same as seed-admin.js).
 *
 * Optional: API_BASE_URL (default http://127.0.0.1:3001) — backend base URL for requests.
 * Run from repo root. No DB or bcrypt deps; uses fetch (Node 18+).
 */

const path = require("path");
const deployDir = __dirname;
const backendEnv = path.join(deployDir, "..", "backend", ".env");
if (require("fs").existsSync(backendEnv)) {
  require("dotenv").config({ path: backendEnv });
}

const SESSION_COOKIE_NAME = "d38_session";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1] !== undefined && !args[i + 1].startsWith("--")) {
      opts[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return opts;
}

function getBaseUrl() {
  return (process.env.API_BASE_URL || process.env.API_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
}

function extractSessionCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const prefix = SESSION_COOKIE_NAME + "=";
  const parts = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const part of parts) {
    const trimmed = part.trim();
    const start = trimmed.indexOf(prefix);
    if (start !== -1) {
      const value = trimmed.slice(start + prefix.length);
      const end = value.indexOf(";");
      return end === -1 ? value.trim() : value.slice(0, end).trim();
    }
  }
  return null;
}

async function main() {
  const opts = parseArgs();
  const email = opts.email || process.env.ADMIN_SEED_EMAIL;
  const password = opts.password || process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.error("Provide --email and --password, or set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD");
    process.exit(1);
  }

  const base = getBaseUrl();
  const loginUrl = `${base}/api/auth/login`;
  const meUrl = `${base}/api/auth/me`;

  try {
    // 1. Login
    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const loginBody = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok) {
      console.error("Login failed:", loginRes.status, loginBody.error || loginBody);
      process.exit(1);
    }

    const setCookie = loginRes.headers.get("Set-Cookie");
    const sessionToken = extractSessionCookie(setCookie);
    if (!sessionToken) {
      console.error("Login OK but no session cookie in response");
      process.exit(1);
    }

    console.log("Login OK:", loginBody.user?.email ?? email);

    // 2. Verify session with GET /api/auth/me
    const meRes = await fetch(meUrl, {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` },
    });

    const meBody = await meRes.json().catch(() => ({}));
    if (!meRes.ok) {
      console.error("GET /api/auth/me failed:", meRes.status, meBody.error || meBody);
      process.exit(1);
    }

    if (!meBody.user) {
      console.error("GET /api/auth/me: no user in response");
      process.exit(1);
    }

    console.log("Session OK: user", meBody.user.id, meBody.user.email);
    console.log("Admin login verification passed.");
  } catch (err) {
    if (err.cause?.code === "ECONNREFUSED") {
      console.error("Connection refused to", base, "- is the backend running on that port?");
    } else {
      console.error("Error:", err.message || err);
    }
    process.exit(1);
  }
}

main();
