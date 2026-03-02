/**
 * PUT /api/admin/categories/:id — update category name/slug (admin-high-level-design §7).
 * DELETE /api/admin/categories/:id — remove category. Returns 409 if category is in use by any product.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getCategoryById,
  countProductsByCategoryId,
  deleteCategory,
  updateCategory,
} from "@/lib/db/categories";

function logError(context: string, err: unknown): void {
  console.error(`[api/admin/categories/[id]] ${context}`, { error: err });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId) || numId < 1) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }
    const slug =
      typeof body?.slug === "string" && body.slug.trim()
        ? body.slug.trim()
        : undefined;
    const category = await updateCategory(numId, { name, slug });
    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (err) {
    logError("PUT update failed", err);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId) || numId < 1) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }
  try {
    const category = await getCategoryById(numId);
    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const productCount = await countProductsByCategoryId(numId);
    if (productCount > 0) {
      return NextResponse.json(
        { error: "Category is in use by one or more products" },
        { status: 409 }
      );
    }
    const deleted = await deleteCategory(numId);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logError("DELETE failed", err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
