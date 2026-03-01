import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db/products";

function logError(context: string, err: unknown): void {
  console.error(`[api/products] ${context}`, { error: err });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const category = searchParams.get("category");
    const promoted = searchParams.get("promoted");
    const q = searchParams.get("q");

    const result = await listProducts({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category: category ?? undefined,
      promoted: promoted === "true",
      q: q ?? undefined,
    });

    return NextResponse.json({
      products: result.products,
      total: result.total,
      hasMore: result.hasMore,
    });
  } catch (err) {
    logError("GET list failed", err);
    return NextResponse.json({ error: "Failed to list products" }, { status: 500 });
  }
}
