/**
 * Admin API protection: session (cookie) or X-Admin-Key.
 * admin-high-level-design.md §5: session/JWT or API key; requireAdmin tries session first, then API key.
 */

import { getSessionByToken } from "@/lib/db/sessions";
import { getUserById } from "@/lib/db/users";
import type { AdminUser } from "@/lib/types";
import { getSessionCookie } from "./cookies";

function logError(context: string, err: unknown): void {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[auth] ${context}`, { error: err });
  }
}

export function getAdminKeyFromRequest(request: Request): string | null {
  return request.headers.get("X-Admin-Key") || request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || null;
}

export function requireAdminKey(request: Request): { ok: true; key: string } | { ok: false; status: number; body: { error: string } } {
  const key = getAdminKeyFromRequest(request);
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    logError("ADMIN_API_KEY not configured", new Error("Missing ADMIN_API_KEY"));
    return { ok: false, status: 501, body: { error: "Admin API not configured" } };
  }
  if (!key || key !== expected) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[auth] Admin API key missing or invalid", { hasKey: !!key });
    }
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  return { ok: true, key };
}

/** Resolve session from cookie; returns user or null. */
export async function getSessionUser(request: Request): Promise<AdminUser | null> {
  const token = getSessionCookie(request);
  if (!token) return null;
  const session = await getSessionByToken(token);
  if (!session) return null;
  return getUserById(session.userId);
}

/**
 * Require admin: valid session (cookie) OR valid API key. Order: session first, then API key.
 * admin-high-level-design.md §5.
 */
export async function requireAdmin(
  request: Request
): Promise<
  | { ok: true; user?: AdminUser; key?: string }
  | { ok: false; status: number; body: { error: string } }
> {
  const user = await getSessionUser(request);
  if (user) return { ok: true, user };
  const keyResult = requireAdminKey(request);
  if (keyResult.ok) return { ok: true, key: keyResult.key };
  return keyResult;
}
