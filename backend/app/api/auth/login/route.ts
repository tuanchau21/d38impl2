/**
 * POST /api/auth/login — admin login (admin-high-level-design.md §5.3).
 * Body: { email, password }. Success: set session cookie, return { user }.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { findUserByEmail } from "@/lib/db/users";
import { createSession } from "@/lib/db/sessions";
import { sessionCookieHeader } from "@/lib/cookies";
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/rateLimit";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function logWarn(context: string, data?: Record<string, unknown>): void {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[api/auth/login] ${context}`, data ?? {});
  }
}

function logError(context: string, err: unknown): void {
  console.error(`[api/auth/login] ${context}`, { error: err });
}

export async function POST(request: Request) {
  if (isLoginRateLimited(request)) {
    logWarn("Login rate limited");
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  recordLoginAttempt(request);
  try {
    const userRow = await findUserByEmail(email);
    if (!userRow) {
      logWarn("Login failed: user not found", { email: email.slice(0, 3) + "***" });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      logWarn("Login failed: invalid password", { email: email.slice(0, 3) + "***" });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const { token, expiresAt } = await createSession(userRow.id);
    const cookie = sessionCookieHeader(token, SESSION_MAX_AGE_SECONDS);
    const res = NextResponse.json({
      user: { id: userRow.id, email: userRow.email, name: userRow.name ?? undefined, role: userRow.role ?? undefined },
    });
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (err) {
    logError("Login failed", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
