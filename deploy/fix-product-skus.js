#!/usr/bin/env node
/**
 * Backfill product SKUs: assign each product a new SKU from the shared counter using
 * the same algorithm as the backend (14-bit rotation + base36). Preserves existing
 * data; only updates products.sku and sku_counter.value.
 *
 * Uses backend/.env for DB connection. Run from repo root:
 *   node deploy/fix-product-skus.js
 *   node deploy/fix-product-skus.js --dry-run   (log only, no writes)
 *
 * Prerequisite: sku_counter table must exist (run node deploy/setup-database.js first).
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

const ROTATE_BITS = 14;
const ROTATE_LEFT = 5;

function getConnOpts() {
  return {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "d38shop",
  };
}

function validateEnv() {
  const missing = [];
  if (!process.env.MYSQL_HOST?.trim()) missing.push("MYSQL_HOST");
  if (process.env.MYSQL_USER === undefined || process.env.MYSQL_USER === null) missing.push("MYSQL_USER");
  if (process.env.MYSQL_PASSWORD === undefined || process.env.MYSQL_PASSWORD === null) missing.push("MYSQL_PASSWORD");
  if (!process.env.MYSQL_DATABASE?.trim()) missing.push("MYSQL_DATABASE");
  if (missing.length > 0) {
    console.error("Missing in backend/.env:", missing.join(", "));
    process.exit(1);
  }
}

/**
 * 14-bit rotation left by k (product-data-layout.md SKU generation).
 */
function rotl14(x, k) {
  x = x & 0x3fff;
  return ((x << k) | (x >>> (ROTATE_BITS - k))) & 0x3fff;
}

/**
 * Counter value -> 3-char base36 SKU (uppercase, zero-padded).
 */
function counterToSku(counter) {
  const rotated = rotl14(counter, ROTATE_LEFT);
  return rotated.toString(36).toUpperCase().padStart(3, "0");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("Dry run: no changes will be written.\n");

  validateEnv();

  const conn = await mysql.createConnection(getConnOpts());

  try {
    const [counterRows] = await conn.query("SELECT value FROM sku_counter WHERE id = 1");
    if (!counterRows?.length) {
      console.error("sku_counter table missing or empty. Run: node deploy/setup-database.js");
      process.exit(1);
    }

    const [products] = await conn.query(
      "SELECT id, sku AS old_sku FROM products ORDER BY id ASC"
    );
    if (products.length === 0) {
      console.log("No products to update.");
      return;
    }

    let nextValue = Number(counterRows[0].value);
    const updates = [];

    for (const row of products) {
      const newSku = counterToSku(nextValue);
      updates.push({ id: row.id, old_sku: row.old_sku, new_sku: newSku });
      nextValue += 1;
    }

    if (dryRun) {
      updates.forEach((u) => console.log(`  id=${u.id}  ${u.old_sku} -> ${u.new_sku}`));
      console.log("\nTotal:", updates.length, "products. Run without --dry-run to apply.");
      return;
    }

    await conn.beginTransaction();
    try {
      await conn.query("SELECT value FROM sku_counter WHERE id = 1 FOR UPDATE");
      for (const u of updates) {
        await conn.query("UPDATE products SET sku = ? WHERE id = ?", [u.new_sku, u.id]);
      }
      await conn.query("UPDATE sku_counter SET value = ? WHERE id = 1", [nextValue]);
      await conn.commit();
      console.log("Updated", updates.length, "product SKUs. sku_counter.value set to", nextValue);
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection refused. Check MYSQL_* in backend/.env");
    } else if (err.code === "ER_NO_SUCH_TABLE" && err.message?.includes("sku_counter")) {
      console.error("Table sku_counter not found. Run: node deploy/setup-database.js");
    } else {
      console.error("Error:", err.message || err);
      if (err.sqlMessage) console.error("SQL:", err.sqlMessage);
    }
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
