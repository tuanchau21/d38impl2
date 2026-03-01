import { NextResponse } from "next/server";
import { appendFileSync } from "fs";
import { requireAdmin } from "@/lib/auth";
import { listProducts, createProduct } from "@/lib/db/products";

function logError(context: string, err: unknown): void {
  console.error(`[api/admin/products] ${context}`, { error: err });
}

function debugLog(payload: Record<string, unknown>): void {
  try {
    appendFileSync(
      "debug-7fe144.log",
      JSON.stringify({ sessionId: "7fe144", ...payload, timestamp: Date.now() }) + "\n"
    );
  } catch (_) {}
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  // #region agent log
  debugLog({
    location: "admin/products/route.ts:GET after auth",
    message: "auth result",
    data: { authOk: auth.ok, status: !auth.ok ? auth.status : undefined, body: !auth.ok ? auth.body : undefined },
    hypothesisId: "H1",
  });
  // #endregion
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const q = searchParams.get("q");
    // #region agent log
    debugLog({
      location: "admin/products/route.ts:GET before listProducts",
      message: "calling listProducts",
      data: { page, limit, q },
      hypothesisId: "H2",
    });
    // #endregion
    const result = await listProducts({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      q: q ?? undefined,
    });
    // #region agent log
    debugLog({
      location: "admin/products/route.ts:GET after listProducts",
      message: "listProducts success",
      data: { count: result.products.length, total: result.total },
      hypothesisId: "H2",
    });
    // #endregion
    return NextResponse.json({ products: result.products, total: result.total, hasMore: result.hasMore });
  } catch (err) {
    // #region agent log
    const errData =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack?.slice(0, 200) }
        : { err: String(err) };
    debugLog({
      location: "admin/products/route.ts:GET catch",
      message: "GET list failed",
      data: errData,
      hypothesisId: "H2",
    });
    // #endregion
    logError("GET list failed", err);
    const message = err instanceof Error ? err.message : String(err);
    const error = message ? `Failed to list products: ${message}` : "Failed to list products";
    return NextResponse.json({ error }, { status: 500 });
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
    const sku = body?.sku;
    const price = body?.price != null ? Number(body.price) : undefined;
    const quantity_per_box = body?.quantity_per_box != null ? Number(body.quantity_per_box) : undefined;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!sku || typeof sku !== "string" || sku.trim() === "") {
      return NextResponse.json({ error: "sku is required" }, { status: 400 });
    }
    if (price == null || Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
    }
    if (quantity_per_box == null || !Number.isInteger(quantity_per_box) || quantity_per_box < 1) {
      return NextResponse.json({ error: "quantity_per_box must be a positive integer" }, { status: 400 });
    }
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slug) {
      return NextResponse.json({ error: "name must contain at least one letter or number" }, { status: 400 });
    }
    const product = await createProduct({
      name: name.trim(),
      sku: sku.trim(),
      category_id: body?.category_id ?? null,
      description: body?.description ?? null,
      price,
      discount_percent: body?.discount_percent != null ? Number(body.discount_percent) : 0,
      quantity_per_box,
      is_promoted: Boolean(body?.is_promoted),
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    logError("POST create failed", err);
    const mysqlErr = err as { code?: string; sqlMessage?: string };
    if (mysqlErr.code === "ER_DUP_ENTRY") {
      const msg =
        mysqlErr.sqlMessage?.includes("uq_products_sku") || mysqlErr.sqlMessage?.includes("sku")
          ? "A product with this SKU already exists"
          : mysqlErr.sqlMessage?.includes("uq_products_slug") || mysqlErr.sqlMessage?.includes("slug")
            ? "A product with this name already exists (slug conflict)"
            : "A product with this SKU or name already exists";
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
