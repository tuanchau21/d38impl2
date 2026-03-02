#!/usr/bin/env node
/**
 * Database setup: apply schema and verify (deploy/schema.sql).
 * Uses backend/.env for DB connection (MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE).
 * Run from repo root. Requires: mysql2 (e.g. cd backend && npm ci, then node ../deploy/setup-database.js).
 *
 * Usage: node deploy/setup-database.js
 *        node deploy/setup-database.js --create-db   (drop DB if exists, create from scratch, apply schema + verify)
 */

const path = require("path");
const fs = require("fs");
const deployDir = __dirname;
const deployNodeModules = path.join(deployDir, "node_modules");
if (fs.existsSync(deployNodeModules)) {
  module.paths.unshift(deployNodeModules);
}

// Load backend .env (same layout as deploy/.env.backend.example)
const backendEnv = path.join(deployDir, "..", "backend", ".env");
if (fs.existsSync(backendEnv)) {
  require("dotenv").config({ path: backendEnv });
}

const mysql = require("mysql2/promise");

const REQUIRED_TABLES = [
  "categories",
  "products",
  "product_images",
  "sku_counter",
  "users",
  "admin_users",
  "sessions",
  "orders",
  "order_items",
  "payments",
];

/** Migrations that are safe to run on existing DBs (idempotent, additive only). Run after schema. */
const SAFE_MIGRATIONS = ["003_sku_counter.sql"];

function getConnOpts(includeDatabase = true) {
  const opts = {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
  };
  if (includeDatabase) {
    opts.database = process.env.MYSQL_DATABASE || "d38shop";
  }
  return opts;
}

function validateEnv() {
  const missing = [];
  if (!process.env.MYSQL_HOST?.trim()) missing.push("MYSQL_HOST");
  if (process.env.MYSQL_USER === undefined || process.env.MYSQL_USER === null) missing.push("MYSQL_USER");
  if (process.env.MYSQL_PASSWORD === undefined || process.env.MYSQL_PASSWORD === null) missing.push("MYSQL_PASSWORD");
  if (!process.env.MYSQL_DATABASE?.trim()) missing.push("MYSQL_DATABASE");
  if (missing.length > 0) {
    console.error("Missing in backend/.env:", missing.join(", "));
    console.error("Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (same layout as deploy/.env.backend.example).");
    process.exit(1);
  }
}

function escapeDbName(name) {
  return name.replace(/\\/g, "\\\\").replace(/`/g, "``");
}

async function dropAndCreateDatabase(conn) {
  const db = (process.env.MYSQL_DATABASE || "d38shop").trim();
  const safe = escapeDbName(db);
  await conn.query(`DROP DATABASE IF EXISTS \`${safe}\``);
  console.log("Dropped database (if existed):", db);
  await conn.query(`CREATE DATABASE \`${safe}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log("Created database:", db);
}

async function applySchema(conn) {
  const schemaPath = path.join(deployDir, "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error("Schema file not found:", schemaPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(schemaPath, "utf8");
  await conn.query({ sql, multipleStatements: true });
  console.log("Schema applied: deploy/schema.sql");
}

async function applyMigrations(conn) {
  const migrationsDir = path.join(deployDir, "migrations");
  if (!fs.existsSync(migrationsDir)) return;

  for (const name of SAFE_MIGRATIONS) {
    const filePath = path.join(migrationsDir, name);
    if (!fs.existsSync(filePath)) continue;
    const sql = fs.readFileSync(filePath, "utf8");
    await conn.query({ sql, multipleStatements: true });
    console.log("Migration applied:", name);
  }
}

async function verify(conn) {
  const [rows] = await conn.query("SHOW TABLES");
  const db = (process.env.MYSQL_DATABASE || "d38shop").trim();
  const tableKey = "Tables_in_" + db;
  const tables = Array.isArray(rows) ? rows.map((r) => r[tableKey]).filter(Boolean) : [];
  const missing = REQUIRED_TABLES.filter((t) => !tables.includes(t));
  if (missing.length > 0) {
    console.error("Verification failed. Missing tables:", missing.join(", "));
    console.error("Found tables:", tables.join(", ") || "(none)");
    process.exit(1);
  }
  console.log("Verify OK: tables", REQUIRED_TABLES.join(", "));
  return tables;
}

async function main() {
  const createDb = process.argv.includes("--create-db");

  validateEnv();

  if (createDb) {
    const connNoDb = await mysql.createConnection(getConnOpts(false));
    try {
      await dropAndCreateDatabase(connNoDb);
    } finally {
      await connNoDb.end();
    }
  }

  const conn = await mysql.createConnection({
    ...getConnOpts(true),
    multipleStatements: true,
  });

  try {
    await applySchema(conn);
    await applyMigrations(conn);
    await verify(conn);
    console.log("Database setup complete.");
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection refused. Check MYSQL_HOST, MYSQL_PORT and that MySQL is reachable.");
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Access denied. Check MYSQL_USER and MYSQL_PASSWORD in backend/.env");
    } else if (err.code === "ER_BAD_DB_ERROR") {
      console.error("Database does not exist. Create it first or run with --create-db");
    } else {
      console.error("Database setup failed:", err.message || err);
      if (err.sqlMessage) console.error("SQL:", err.sqlMessage);
    }
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
