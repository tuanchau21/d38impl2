/**
 * MySQL client for Oracle HeatWave. Connection from env (DATABASE_URL or MYSQL_*).
 */

import mysql from "mysql2/promise";

function logError(context: string, err: unknown): void {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[db] ${context}`, { error: err });
  }
}

function getConfig(): mysql.ConnectionOptions {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const u = new URL(url);
      return {
        host: u.hostname,
        port: u.port ? parseInt(u.port, 10) : 3306,
        user: u.username,
        password: u.password,
        database: u.pathname?.replace(/^\//, "") || "d38shop",
      };
    } catch (err) {
      logError("Invalid DATABASE_URL", err);
      throw err;
    }
  }
  const host = process.env.MYSQL_HOST || "localhost";
  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306;
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD || "";
  const database = process.env.MYSQL_DATABASE || "d38shop";
  return { host, port, user, password, database };
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({ ...getConfig(), waitForConnections: true, connectionLimit: 10 });
  }
  return pool;
}

export async function query<T = mysql.RowDataPacket[]>(sql: string, params?: unknown[]): Promise<T> {
  const p = getPool();
  try {
    const [rows] = await p.execute(sql, params as (string | number | null)[] | undefined);
    return rows as T;
  } catch (err) {
    logError("query failed", err);
    throw err;
  }
}

export async function insertAndGetId(sql: string, params: unknown[]): Promise<number> {
  const p = getPool();
  try {
    const [result] = await p.execute(sql, params as (string | number | null)[]);
    const header = result as mysql.ResultSetHeader;
    return header.insertId;
  } catch (err) {
    logError("insert failed", err);
    throw err;
  }
}
