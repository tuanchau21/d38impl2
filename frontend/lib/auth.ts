/**
 * Admin API protection: validate X-Admin-Key header.
 * Per backend-technical-design.md §5, reject with 401 if missing or invalid.
 */

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
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  return { ok: true, key };
}
