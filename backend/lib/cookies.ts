/**
 * Session cookie helpers (admin-high-level-design.md §5). httpOnly, secure in production, sameSite.
 */

export const SESSION_COOKIE_NAME = "d38_session";

export function getSessionCookie(request: Request): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const prefix = `${SESSION_COOKIE_NAME}=`;
  for (const part of cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length).trim() || null;
    }
  }
  return null;
}

export function sessionCookieHeader(token: string, maxAgeSeconds: number): string {
  const isProd = process.env.NODE_ENV === "production";
  const secure = isProd ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
