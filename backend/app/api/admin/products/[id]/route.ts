import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateProduct, deleteProduct } from "@/lib/db/products";

function logError(context: string, err: unknown): void {
  console.error(`[api/admin/products/[id]] ${context}`, { error: err });
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
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const price = body?.price != null ? Number(body.price) : undefined;
    const quantity_per_box = body?.quantity_per_box != null ? Number(body.quantity_per_box) : undefined;
    if (price != null && (Number.isNaN(price) || price < 0)) {
      return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
    }
    if (quantity_per_box != null && (!Number.isInteger(quantity_per_box) || quantity_per_box < 1)) {
      return NextResponse.json({ error: "quantity_per_box must be a positive integer" }, { status: 400 });
    }
    const product = await updateProduct(numId, {
      name: body?.name,
      sku: body?.sku,
      category_id: body?.category_id,
      description: body?.description,
      price,
      discount_percent: body?.discount_percent != null ? Number(body.discount_percent) : undefined,
      quantity_per_box,
      is_promoted: body?.is_promoted !== undefined ? Boolean(body.is_promoted) : undefined,
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err) {
    logError("PUT update failed", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
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
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  try {
    const deleted = await deleteProduct(numId);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logError("DELETE failed", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
