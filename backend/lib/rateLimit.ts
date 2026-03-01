/**
 * Simple in-memory rate limit for POST /api/auth/login (admin-high-level-design.md §5.7).
 * Per-IP; not distributed (single process).
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

const store = new Map<string, { count: number; resetAt: number }>();

function getClientId(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export function isLoginRateLimited(request: Request): boolean {
  const id = getClientId(request);
  const now = Date.now();
  const entry = store.get(id);
  if (!entry) return false;
  if (now >= entry.resetAt) {
    store.delete(id);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordLoginAttempt(request: Request): void {
  const id = getClientId(request);
  const now = Date.now();
  const entry = store.get(id);
  if (!entry) {
    store.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (now >= entry.resetAt) {
    store.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}
