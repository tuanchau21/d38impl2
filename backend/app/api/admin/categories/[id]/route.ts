/**
 * DELETE /api/admin/categories/:id — remove category (admin-high-level-design §7).
 * Returns 409 if category is in use by any product.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getCategoryById,
  countProductsByCategoryId,
  deleteCategory,
} from "@/lib/db/categories";

function logError(context: string, err: unknown): void {
  console.error(`[api/admin/categories/[id]] ${context}`, { error: err });
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
