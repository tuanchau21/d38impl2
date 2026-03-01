/**
 * GET /api/categories — list categories for filters and admin product form.
 * Public; no auth. See backend-technical-design.md §9.
 */

import { NextResponse } from "next/server";
import { listCategories } from "@/lib/db/categories";

function logError(context: string, err: unknown): void {
  console.error(`[api/categories] ${context}`, { error: err });
}

export async function GET() {
  try {
    const categories = await listCategories();
    return NextResponse.json(categories);
  } catch (err) {
    logError("GET list failed", err);
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
  }
}
