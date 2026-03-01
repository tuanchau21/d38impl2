#!/usr/bin/env node
/**
 * CLI to create, edit, or remove admin users (admin_users table).
 * Normal customers use the users table (placeholder); admins use admin_users.
 * DB: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (from backend/.env).
 * Run from repo root. Requires: cd deploy && npm install (once), then run from repo root.
 *
 * Create:  node deploy/manage-admin-users.js create --email admin@example.com --password secret [--name "Admin"] [--role admin]
 * Edit:    node deploy/manage-admin-users.js edit --email admin@example.com [--password newpass] [--name "Name"] [--role admin]
 * Remove:  node deploy/manage-admin-users.js remove --email admin@example.com
 *          node deploy/manage-admin-users.js remove --id 1
 */

const path = require("path");
const fs = require("fs");
const deployDir = __dirname;
const deployNodeModules = path.join(deployDir, "node_modules");
if (fs.existsSync(deployNodeModules)) {
  module.paths.unshift(deployNodeModules);
}

// Load backend .env so DB connection uses same config as the app (no need to export MYSQL_* manually)
const backendEnv = path.join(deployDir, "..", "backend", ".env");
if (fs.existsSync(backendEnv)) {
  require("dotenv").config({ path: backendEnv });
}

const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

function parseArgs() {
  const args = process.argv.slice(2);
  const action = args[0];
  if (!action || !["create", "edit", "remove"].includes(action)) {
    return { error: "Usage: create | edit | remove, then --email, --password, --name, --role, or --id" };
  }
  const opts = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1] !== undefined && !args[i + 1].startsWith("--")) {
      opts[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return { action, ...opts };
}

function getConnOpts() {
  return {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "d38shop",
  };
}

async function create(conn, { email, password, name, role }) {
  const normEmail = email.trim().toLowerCase();
  const [rows] = await conn.execute("SELECT id FROM admin_users WHERE email = ?", [normEmail]);
  if (rows.length > 0) {
    console.error("Admin user already exists:", normEmail);
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await conn.execute(
    "INSERT INTO admin_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
    [normEmail, hash, name || null, role || "admin"]
  );
  console.log("Admin user created:", normEmail);
}

async function edit(conn, { email, password, name, role }) {
  const normEmail = email.trim().toLowerCase();
  const [rows] = await conn.execute("SELECT id, email FROM admin_users WHERE email = ?", [normEmail]);
  if (rows.length === 0) {
    console.error("Admin user not found:", normEmail);
    process.exit(1);
  }
  const userId = rows[0].id;
  const updates = [];
  const values = [];
  if (password != null && password !== "") {
    updates.push("password_hash = ?");
    values.push(await bcrypt.hash(password, 10));
  }
  if (name !== undefined) {
    updates.push("name = ?");
    values.push(name || null);
  }
  if (role !== undefined) {
    updates.push("role = ?");
    values.push(role || null);
  }
  if (updates.length === 0) {
    console.log("Nothing to update for:", normEmail);
    return;
  }
  values.push(userId);
  await conn.execute(`UPDATE admin_users SET ${updates.join(", ")} WHERE id = ?`, values);
  console.log("Admin user updated:", normEmail);
}

async function remove(conn, { email, id }) {
  let userId;
  if (id != null && id !== "") {
    userId = parseInt(id, 10);
    if (Number.isNaN(userId)) {
      console.error("Invalid --id");
      process.exit(1);
    }
  } else if (email != null && email !== "") {
    const normEmail = email.trim().toLowerCase();
    const [rows] = await conn.execute("SELECT id FROM admin_users WHERE email = ?", [normEmail]);
    if (rows.length === 0) {
      console.error("Admin user not found:", normEmail);
      process.exit(1);
    }
    userId = rows[0].id;
  } else {
    console.error("Provide --email or --id");
    process.exit(1);
  }
  await conn.execute("DELETE FROM sessions WHERE user_id = ?", [userId]);
  const [result] = await conn.execute("DELETE FROM admin_users WHERE id = ?", [userId]);
  const affected = result.affectedRows;
  if (affected === 0) {
    console.error("User not found (id:", userId, ")");
    process.exit(1);
  }
  console.log("Admin user removed (id:", userId, ")");
}

async function main() {
  const parsed = parseArgs();
  if (parsed.error) {
    console.error(parsed.error);
    process.exit(1);
  }
  const { action } = parsed;
  if (action === "create") {
    if (!parsed.email || !parsed.password) {
      console.error("create requires --email and --password");
      process.exit(1);
    }
  } else if (action === "edit") {
    if (!parsed.email) {
      console.error("edit requires --email");
      process.exit(1);
    }
  } else if (action === "remove") {
    if (!parsed.email && parsed.id === undefined) {
      console.error("remove requires --email or --id");
      process.exit(1);
    }
  }
  const conn = await mysql.createConnection(getConnOpts());
  try {
    if (action === "create") {
      await create(conn, {
        email: parsed.email,
        password: parsed.password,
        name: parsed.name,
        role: parsed.role,
      });
    } else if (action === "edit") {
      await edit(conn, {
        email: parsed.email,
        password: parsed.password,
        name: parsed.name,
        role: parsed.role,
      });
    } else {
      await remove(conn, { email: parsed.email, id: parsed.id });
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  if (err.code === "ECONNREFUSED") {
    console.error("Database connection refused. Ensure backend/.env has MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE and that MySQL is reachable (e.g. Oracle HeatWave endpoint).");
  }
  console.error(err);
  process.exit(1);
});
