#!/usr/bin/env node
/**
 * One-time seed: create first admin user (admin-login-design.md).
 * Usage: set env ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD and MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (from backend/.env), then:
 *   node deploy/seed-admin.js
 * From repo root. Requires: cd deploy && npm install (once), then run from repo root.
 */

const path = require("path");
const fs = require("fs");
const deployDir = __dirname;
const deployNodeModules = path.join(deployDir, "node_modules");
if (fs.existsSync(deployNodeModules)) {
  module.paths.unshift(deployNodeModules);
}

// Load backend .env so DB connection uses same config as the app
const backendEnv = path.join(deployDir, "..", "backend", ".env");
if (fs.existsSync(backendEnv)) {
  require("dotenv").config({ path: backendEnv });
}

const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.error("Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const connOpts = {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "d38shop",
  };
  const conn = await mysql.createConnection(connOpts);
  try {
    const [rows] = await conn.execute(
      "SELECT id FROM admin_users WHERE email = ?",
      [email.trim().toLowerCase()]
    );
    if (rows.length > 0) {
      console.log("Admin user already exists:", email);
      return;
    }
    await conn.execute(
      "INSERT INTO admin_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
      [email.trim().toLowerCase(), hash, process.env.ADMIN_SEED_NAME || null, "admin"]
    );
    console.log("Admin user created:", email);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
