/**
 * GET /api/admin/categories — list categories (admin-high-level-design §7).
 * POST /api/admin/categories — create category (§6.5.2, §7).
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createCategory, listCategories } from "@/lib/db/categories";

function logError(context: string, err: unknown): void {
  console.error(`[api/admin/categories] ${context}`, { error: err });
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  try {
    const categories = await listCategories();
    return NextResponse.json(categories);
  } catch (err) {
    logError("GET list failed", err);
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  try {
    const body = await request.json();
    const name = body?.name;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const slug = body?.slug != null ? (typeof body.slug === "string" ? body.slug.trim() : undefined) : undefined;
    let parentId: number | null = null;
    if (body?.parent_id != null) {
      const n = Number(body.parent_id);
      if (Number.isNaN(n) || n < 1) {
        return NextResponse.json({ error: "parent_id must be a positive number" }, { status: 400 });
      }
      parentId = n;
    }
    const category = await createCategory({
      name: name.trim(),
      slug: slug || undefined,
      parent_id: parentId,
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    logError("POST create failed", err);
    const message = err instanceof Error ? err.message : "Failed to create category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
