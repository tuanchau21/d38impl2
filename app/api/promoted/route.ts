import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db/products";

function logError(context: string, err: unknown): void {
  console.error(`[api/promoted] ${context}`, { error: err });
}

export async function GET() {
  try {
    const result = await listProducts({ promoted: true, limit: 24 });
    return NextResponse.json(result.products);
  } catch (err) {
    logError("GET promoted failed", err);
    return NextResponse.json({ error: "Failed to get promoted products" }, { status: 500 });
  }
}
