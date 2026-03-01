#!/usr/bin/env node
/**
 * Print all admin users (admin_users table) with all columns.
 * DB: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (from backend/.env).
 * Run from repo root. Requires mysql2 (e.g. run from backend/ after npm ci: node ../deploy/list-admin-users.js).
 *
 * Usage: node deploy/list-admin-users.js
 *        node deploy/list-admin-users.js --no-hash   (hide password_hash column in output)
 */

const path = require("path");
const fs = require("fs");
const deployDir = __dirname;
const deployNodeModules = path.join(deployDir, "node_modules");
if (fs.existsSync(deployNodeModules)) {
  module.paths.unshift(deployNodeModules);
}

const backendEnv = path.join(deployDir, "..", "backend", ".env");
if (fs.existsSync(backendEnv)) {
  require("dotenv").config({ path: backendEnv });
}

const mysql = require("mysql2/promise");

function getConnOpts() {
  return {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "d38shop",
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--no-hash") opts.noHash = true;
  }
  return opts;
}

function formatCell(val) {
  if (val == null) return "";
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function printTable(rows, hideHash) {
  if (rows.length === 0) {
    console.log("(no admin users)");
    return;
  }
  const cols = ["id", "email", "password_hash", "name", "role", "created_at", "updated_at"];
  const displayCols = hideHash ? cols.filter((c) => c !== "password_hash") : cols;
  const widths = {};
  for (const c of displayCols) widths[c] = c.length;
  for (const row of rows) {
    for (const c of displayCols) {
      const val = c === "password_hash" && hideHash ? "***" : row[c];
      widths[c] = Math.max(widths[c], formatCell(val).length);
    }
  }
  const sep = "  ";
  const header = displayCols.map((c) => c.padEnd(widths[c])).join(sep);
  console.log(header);
  console.log(displayCols.map((c) => "-".repeat(widths[c])).join(sep));
  for (const row of rows) {
    const line = displayCols
      .map((c) => {
        const val = c === "password_hash" && hideHash ? "***" : row[c];
        return formatCell(val).padEnd(widths[c]);
      })
      .join(sep);
    console.log(line);
  }
}

async function main() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(getConnOpts());
  try {
    const [rows] = await conn.execute(
      "SELECT id, email, password_hash, name, role, created_at, updated_at FROM admin_users ORDER BY id"
    );
    console.log("admin_users (" + rows.length + " row(s)):\n");
    printTable(rows, opts.noHash);
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection refused. Check backend/.env (MYSQL_HOST, etc.) and that MySQL is reachable.");
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Access denied. Check MYSQL_USER and MYSQL_PASSWORD in backend/.env");
    } else if (err.code === "ER_BAD_DB_ERROR") {
      console.error("Database does not exist. Run setup-database.js or create the database first.");
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
