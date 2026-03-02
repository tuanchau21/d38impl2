#!/usr/bin/env node
/**
 * Verify and optionally fix database schema to match plan/database-high-level-design.md.
 * Uses backend/.env for DB connection (MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE).
 * Run from repo root. Requires: mysql2 (e.g. cd backend && npm ci, then node ../deploy/verify-schema.js).
 *
 * Usage:
 *   node deploy/verify-schema.js           Report only: yield what's wrong, no changes. Exit 0 if OK, non-zero if mismatch.
 *   node deploy/verify-schema.js --fix     Fix: create missing tables (apply schema.sql), add missing columns. Exit 0 when done.
 *   node deploy/verify-schema.js --dry-run  Print expected layout only, no DB connection.
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

// Expected schema from plan/database-high-level-design.md (tables and columns with type family for verification)
const EXPECTED_SCHEMA = {
  categories: [
    { name: "id", type: "int" },
    { name: "name", type: "varchar" },
    { name: "slug", type: "varchar" },
    { name: "parent_id", type: "int" },
  ],
  products: [
    { name: "id", type: "int" },
    { name: "category_id", type: "int" },
    { name: "sku", type: "varchar" },
    { name: "name", type: "varchar" },
    { name: "slug", type: "varchar" },
    { name: "description", type: "text" },
    { name: "price", type: "decimal" },
    { name: "discount_percent", type: "decimal" },
    { name: "quantity_per_box", type: "int" },
    { name: "is_promoted", type: "tinyint" },
    { name: "created_at", type: "datetime" },
    { name: "updated_at", type: "datetime" },
  ],
  product_images: [
    { name: "id", type: "int" },
    { name: "product_id", type: "int" },
    { name: "url", type: "varchar" },
    { name: "sort_order", type: "int" },
  ],
  sku_counter: [
    { name: "id", type: "tinyint" },
    { name: "value", type: "int" },
  ],
  users: [
    { name: "id", type: "int" },
    { name: "email", type: "varchar" },
    { name: "created_at", type: "datetime" },
    { name: "updated_at", type: "datetime" },
  ],
  admin_users: [
    { name: "id", type: "int" },
    { name: "email", type: "varchar" },
    { name: "password_hash", type: "varchar" },
    { name: "name", type: "varchar" },
    { name: "role", type: "varchar" },
    { name: "created_at", type: "datetime" },
    { name: "updated_at", type: "datetime" },
  ],
  sessions: [
    { name: "id", type: "int" },
    { name: "user_id", type: "int" },
    { name: "token", type: "varchar" },
    { name: "expires_at", type: "datetime" },
    { name: "created_at", type: "datetime" },
  ],
  orders: [
    { name: "id", type: "int" },
    { name: "user_id", type: "int" },
    { name: "created_at", type: "datetime" },
    { name: "updated_at", type: "datetime" },
  ],
  order_items: [
    { name: "id", type: "int" },
    { name: "order_id", type: "int" },
    { name: "product_id", type: "int" },
    { name: "quantity", type: "int" },
    { name: "created_at", type: "datetime" },
  ],
  payments: [
    { name: "id", type: "int" },
    { name: "order_id", type: "int" },
    { name: "created_at", type: "datetime" },
    { name: "updated_at", type: "datetime" },
  ],
};

// Full MySQL column definitions for ALTER TABLE ADD COLUMN (only non-PK columns; order = AFTER previous)
// Aligns with deploy/schema.sql and plan/database-high-level-design.md
const ADD_COLUMN_DEFS = {
  categories: [
    { name: "name", def: "VARCHAR(255) NOT NULL", after: "id" },
    { name: "slug", def: "VARCHAR(255) NOT NULL", after: "name" },
    { name: "parent_id", def: "INT UNSIGNED NULL", after: "slug" },
  ],
  products: [
    { name: "category_id", def: "INT UNSIGNED NULL", after: "id" },
    { name: "sku", def: "VARCHAR(64) NOT NULL", after: "category_id" },
    { name: "name", def: "VARCHAR(255) NOT NULL", after: "sku" },
    { name: "slug", def: "VARCHAR(255) NOT NULL", after: "name" },
    { name: "description", def: "TEXT NULL", after: "slug" },
    { name: "price", def: "DECIMAL(12,2) NOT NULL DEFAULT 0", after: "description" },
    { name: "discount_percent", def: "DECIMAL(5,2) NOT NULL DEFAULT 0", after: "price" },
    { name: "quantity_per_box", def: "INT UNSIGNED NOT NULL DEFAULT 1", after: "discount_percent" },
    { name: "is_promoted", def: "TINYINT(1) NOT NULL DEFAULT 0", after: "quantity_per_box" },
    { name: "created_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)", after: "is_promoted" },
    { name: "updated_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)", after: "created_at" },
  ],
  product_images: [
    { name: "product_id", def: "INT UNSIGNED NOT NULL", after: "id" },
    { name: "url", def: "VARCHAR(2048) NOT NULL", after: "product_id" },
    { name: "sort_order", def: "SMALLINT UNSIGNED NOT NULL DEFAULT 0", after: "url" },
  ],
  users: [
    { name: "email", def: "VARCHAR(255) NOT NULL", after: "id" },
    { name: "created_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)", after: "email" },
    { name: "updated_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)", after: "created_at" },
  ],
  admin_users: [
    { name: "email", def: "VARCHAR(255) NOT NULL", after: "id" },
    { name: "password_hash", def: "VARCHAR(255) NOT NULL", after: "email" },
    { name: "name", def: "VARCHAR(255) NULL", after: "password_hash" },
    { name: "role", def: "VARCHAR(64) NULL", after: "name" },
    { name: "created_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)", after: "role" },
    { name: "updated_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)", after: "created_at" },
  ],
  sessions: [
    { name: "user_id", def: "INT UNSIGNED NOT NULL", after: "id" },
    { name: "token", def: "VARCHAR(255) NOT NULL", after: "user_id" },
    { name: "expires_at", def: "DATETIME(3) NOT NULL", after: "token" },
    { name: "created_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)", after: "expires_at" },
  ],
  orders: [
    { name: "user_id", def: "INT UNSIGNED NULL", after: "id" },
    { name: "created_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)", after: "user_id" },
    { name: "updated_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)", after: "created_at" },
  ],
  order_items: [
    { name: "order_id", def: "INT UNSIGNED NOT NULL", after: "id" },
    { name: "product_id", def: "INT UNSIGNED NOT NULL", after: "order_id" },
    { name: "quantity", def: "INT UNSIGNED NOT NULL", after: "product_id" },
    { name: "created_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)", after: "quantity" },
  ],
  payments: [
    { name: "order_id", def: "INT UNSIGNED NOT NULL", after: "id" },
    { name: "created_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)", after: "order_id" },
    { name: "updated_at", def: "DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)", after: "created_at" },
  ],
};

const REQUIRED_TABLES = Object.keys(EXPECTED_SCHEMA);

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

/** Normalize MySQL COLUMN_TYPE to a family for comparison. */
function typeFamily(columnType) {
  if (!columnType || typeof columnType !== "string") return "";
  const t = columnType.toLowerCase();
  if (t.startsWith("int") || t.startsWith("smallint") || t.startsWith("mediumint") || t.startsWith("bigint")) return "int";
  if (t.startsWith("varchar") || t.startsWith("char(")) return "varchar";
  if (t.startsWith("decimal") || t.startsWith("numeric")) return "decimal";
  if (t.startsWith("tinyint")) return "tinyint";
  if (t.startsWith("datetime")) return "datetime";
  if (t.startsWith("text") || t.startsWith("longtext") || t.startsWith("mediumtext")) return "text";
  return t.split("(")[0] || t;
}

function dryRun() {
  console.log("Dry run: expected schema (plan/database-high-level-design.md). No DB connection.\n");
  for (const table of REQUIRED_TABLES) {
    const cols = EXPECTED_SCHEMA[table];
    console.log(`Table: ${table}`);
    for (const c of cols) {
      console.log(`  - ${c.name} (${c.type})`);
    }
    console.log("");
  }
  console.log("Total tables:", REQUIRED_TABLES.length);
  console.log("Total columns:", REQUIRED_TABLES.reduce((sum, t) => sum + EXPECTED_SCHEMA[t].length, 0));
  process.exit(0);
}

/**
 * Run verification; returns { errors, missingTables, columnsByTable }.
 * columnsByTable is used by fix to know which columns to add.
 */
async function runVerify(conn) {
  const db = (process.env.MYSQL_DATABASE || "d38shop").trim();
  const errors = [];

  const [tableRows] = await conn.query("SHOW TABLES");
  const actualTables = Array.isArray(tableRows) ? tableRows.map((r) => Object.values(r)[0]).filter(Boolean) : [];

  const missingTables = REQUIRED_TABLES.filter((t) => !actualTables.includes(t));
  if (missingTables.length > 0) {
    errors.push({ kind: "table", message: `Missing tables: ${missingTables.join(", ")}`, detail: missingTables });
  }

  const [colRows] = await conn.query(
    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [db]
  );

  const columnsByTable = {};
  for (const row of colRows || []) {
    const t = row.TABLE_NAME;
    if (!columnsByTable[t]) columnsByTable[t] = [];
    columnsByTable[t].push({ name: row.COLUMN_NAME, type: row.COLUMN_TYPE });
  }

  for (const table of REQUIRED_TABLES) {
    if (missingTables.includes(table)) continue;
    const expectedCols = EXPECTED_SCHEMA[table];
    const actualCols = columnsByTable[table] || [];
    const actualColNames = new Set(actualCols.map((c) => c.name));
    const actualColByName = {};
    for (const c of actualCols) actualColByName[c.name] = c.type;

    for (const exp of expectedCols) {
      if (!actualColNames.has(exp.name)) {
        errors.push({ kind: "column", table, column: exp.name, message: `Missing column: ${table}.${exp.name}` });
        continue;
      }
      const actualType = actualColByName[exp.name];
      const expectedFamily = exp.type.toLowerCase();
      const actualFamily = typeFamily(actualType);
      if (expectedFamily !== actualFamily) {
        errors.push({
          kind: "type",
          table,
          column: exp.name,
          message: `Column ${table}.${exp.name}: expected type family "${expectedFamily}", got "${actualType}" (family: ${actualFamily})`,
        });
      }
    }
  }

  return { errors, missingTables, columnsByTable };
}

/** Apply fixes: 1) run schema.sql if any table is missing; 2) add missing columns. */
async function applyFixes(conn) {
  const schemaPath = path.join(deployDir, "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error("Schema file not found:", schemaPath);
    process.exit(1);
  }

  let { errors, missingTables } = await runVerify(conn);

  if (errors.length === 0) {
    console.log("Schema OK: nothing to fix.");
    return;
  }

  // 1) Missing tables: apply full schema (CREATE TABLE IF NOT EXISTS only creates missing ones)
  if (missingTables.length > 0) {
    console.log("Applying schema.sql (will create missing tables:", missingTables.join(", ") + ")...");
    const sql = fs.readFileSync(schemaPath, "utf8");
    await conn.query({ sql, multipleStatements: true });
    console.log("Schema applied.");
    const after = await runVerify(conn);
    if (after.errors.length === 0) {
      console.log("All tables and columns are now present.");
      return;
    }
    errors = after.errors;
    missingTables = after.missingTables;
    if (missingTables.length > 0) {
      console.error("After applying schema, some tables are still missing:", missingTables.join(", "));
      console.error("Check deploy/schema.sql and database-high-level-design.md.");
      process.exit(1);
    }
  }

  // 2) Missing columns: ALTER TABLE ADD COLUMN for each
  const missingColumnErrors = errors.filter((e) => e.kind === "column");
  const typeErrors = errors.filter((e) => e.kind === "type");

  for (const e of missingColumnErrors) {
    const defs = ADD_COLUMN_DEFS[e.table];
    if (!defs) continue;
    const colDef = defs.find((d) => d.name === e.column);
    if (!colDef) continue;
    const afterClause = colDef.after ? ` AFTER \`${colDef.after}\`` : "";
    const alterSql = `ALTER TABLE \`${e.table}\` ADD COLUMN \`${e.column}\` ${colDef.def}${afterClause}`;
    console.log("Adding column:", e.table + "." + e.column);
    await conn.query(alterSql);
  }

  if (typeErrors.length > 0) {
    console.warn("\nType mismatches (not auto-fixed; may require manual ALTER or migration):");
    for (const e of typeErrors) console.warn("  -", e.message);
  }

  const final = await runVerify(conn);
  if (final.errors.length > 0) {
    console.error("\nRemaining issues after fix:");
    for (const e of final.errors) console.error("  -", e.message);
    process.exit(1);
  }
  console.log("Schema fix complete: all tables and fields match plan/database-high-level-design.md.");
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const isFix = process.argv.includes("--fix");

  if (isDryRun) {
    dryRun();
    return;
  }

  validateEnv();

  const mysql = require("mysql2/promise");
  const conn = await mysql.createConnection({
    ...getConnOpts(true),
    multipleStatements: true,
  });

  try {
    if (isFix) {
      await applyFixes(conn);
      process.exit(0);
    }

    // Report only: yield what's wrong, no changes
    const { errors } = await runVerify(conn);
    if (errors.length === 0) {
      console.log("Schema OK: all tables and fields match plan/database-high-level-design.md");
      console.log("Tables:", REQUIRED_TABLES.join(", "));
      process.exit(0);
    }
    console.error("Schema verification failed (report only; use --fix to apply fixes):\n");
    for (const e of errors) {
      console.error("  -", e.message);
    }
    process.exit(1);
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection refused. Check MYSQL_HOST, MYSQL_PORT and that MySQL is reachable.");
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Access denied. Check MYSQL_USER and MYSQL_PASSWORD in backend/.env");
    } else if (err.code === "ER_BAD_DB_ERROR") {
      console.error("Database does not exist. Create it first (e.g. run deploy/setup-database.js --create-db).");
    } else {
      console.error("Failed:", err.message || err);
      if (err.sqlMessage) console.error("SQL:", err.sqlMessage);
    }
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
