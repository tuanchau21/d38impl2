/**
 * MySQL client for Oracle HeatWave. Connection from env (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT).
 */

import mysql from "mysql2/promise";

function logError(context: string, err: unknown): void {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[db] ${context}`, { error: err });
  }
}

function getConfig(): mysql.ConnectionOptions {
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

export type TransactionCallback<T> = (conn: mysql.PoolConnection) => Promise<T>;

/** Run a callback inside a transaction. Commits on success, rolls back on throw. */
export async function withTransaction<T>(fn: TransactionCallback<T>): Promise<T> {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    logError("transaction failed", err);
    throw err;
  } finally {
    conn.release();
  }
}
