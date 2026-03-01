/**
 * POST /api/auth/logout — invalidate session (admin-login-design.md §3).
 * Clears session cookie and invalidates server-side session.
 */

import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/cookies";
import { deleteSessionByToken } from "@/lib/db/sessions";
import { clearSessionCookieHeader } from "@/lib/cookies";

export async function POST(request: Request) {
  const token = getSessionCookie(request);
  if (token) {
    try {
      await deleteSessionByToken(token);
    } catch (err) {
      console.error("[api/auth/logout] Failed to delete session", { error: err });
    }
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookieHeader());
  return res;
}
