/**
 * Admin users for login. Schema: users table (admin-login-design.md §6).
 */

import { query } from "./client";
import type { AdminUser } from "@/lib/types";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string | null;
  name: string | null;
  role: string | null;
}

export async function findUserByEmail(email: string): Promise<(UserRow & { password_hash: string }) | null> {
  const rows = await query<UserRow[]>(
    "SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()]
  );
  const row = rows[0];
  if (!row || row.password_hash == null) return null;
  return row as UserRow & { password_hash: string };
}

export async function getUserById(id: number): Promise<AdminUser | null> {
  const rows = await query<UserRow[]>(
    "SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name ?? undefined, role: row.role ?? undefined };
}
