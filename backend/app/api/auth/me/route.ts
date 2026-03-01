/**
 * GET /api/auth/me — current admin user (admin-high-level-design.md §5.3).
 * Credentials via session cookie or Authorization. 401 if not authenticated.
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

function logError(context: string, err: unknown): void {
  console.error(`[api/auth/me] ${context}`, { error: err });
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    logError("GET me failed", err);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
