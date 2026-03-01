import { NextResponse } from "next/server";
import { getProductByIdOrSlug } from "@/lib/db/products";

function logError(context: string, err: unknown): void {
  console.error(`[api/products/[id]] ${context}`, { error: err });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }
  try {
    const product = await getProductByIdOrSlug(id);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err) {
    logError("GET product failed", err);
    return NextResponse.json({ error: "Failed to get product" }, { status: 500 });
  }
}
