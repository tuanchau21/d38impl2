/**
 * DELETE /api/admin/products/:id/images/:imageId — remove one image (admin-high-level-design §6.3).
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteProductImage } from "@/lib/db/products";

function logError(context: string, err: unknown): void {
  console.error(`[api/admin/products/[id]/images/[imageId]] ${context}`, { error: err });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const { id, imageId } = await params;
  const productId = parseInt(id, 10);
  const imgId = parseInt(imageId, 10);
  if (Number.isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  if (Number.isNaN(imgId)) {
    return NextResponse.json({ error: "Invalid image id" }, { status: 400 });
  }
  try {
    const deleted = await deleteProductImage(productId, imgId);
    if (!deleted) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logError("DELETE image failed", err);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
