/**
 * Server-side sessions (admin-login-design.md §6). Sessions table.
 */

import { query } from "./client";
import { randomBytes } from "crypto";

const TOKEN_BYTES = 32;
const SESSION_DAYS = 7;

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

function expiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d;
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const exp = expiresAt();
  await query(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
    [userId, token, exp]
  );
  return { token, expiresAt: exp };
}

export interface SessionRow {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
}

export async function getSessionByToken(token: string): Promise<{ userId: number } | null> {
  await deleteExpiredSessions();
  const rows = await query<SessionRow[]>(
    "SELECT id, user_id, token, expires_at FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1",
    [token]
  );
  const row = rows[0];
  if (!row) return null;
  return { userId: row.user_id };
}

export async function deleteSessionByToken(token: string): Promise<boolean> {
  const result = await query<{ affectedRows: number }>("DELETE FROM sessions WHERE token = ?", [token]);
  const affected = (result as unknown as { affectedRows: number }).affectedRows;
  return affected > 0;
}

export async function deleteExpiredSessions(): Promise<void> {
  await query("DELETE FROM sessions WHERE expires_at <= NOW()");
}
