import { NextResponse } from "next/server";
import { requireAdminKey } from "@/lib/auth";
import { getProductByIdOrSlug, getProductImageCount, addProductImages } from "@/lib/db/products";
import { uploadProductImage } from "@/lib/storage/upload";
import { randomUUID } from "crypto";

function logError(context: string, err: unknown): void {
  console.error(`[api/admin/products/[id]/images] ${context}`, { error: err });
}

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminKey(request);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  // #region agent log
  fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
    body: JSON.stringify({
      sessionId: "7fe144",
      location: "app/images/route.ts:entry",
      message: "POST images entry",
      data: { id, numId },
      timestamp: Date.now(),
      hypothesisId: "H2",
    }),
  }).catch(() => {});
  // #endregion
  try {
    const product = await getProductByIdOrSlug(id);
    // #region agent log
    fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
      body: JSON.stringify({
        sessionId: "7fe144",
        location: "app/images/route.ts:after getProduct",
        message: "product lookup done",
        data: { productFound: !!product, productId: product?.id },
        timestamp: Date.now(),
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const currentCount = await getProductImageCount(numId);
    // #region agent log
    fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
      body: JSON.stringify({
        sessionId: "7fe144",
        location: "app/images/route.ts:after getProductImageCount",
        message: "image count done",
        data: { currentCount },
        timestamp: Date.now(),
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
    const formData = await request.formData();
    const files = formData.getAll("images");
    const toUpload: { file: File; buffer: Buffer }[] = [];
    for (const f of files) {
      if (!(f instanceof File)) continue;
      if (f.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File ${f.name} exceeds 5 MB limit` }, { status: 400 });
      }
      const buffer = Buffer.from(await f.arrayBuffer());
      toUpload.push({ file: f, buffer });
    }
    if (toUpload.length === 0) {
      return NextResponse.json({ error: "No image files provided" }, { status: 400 });
    }
    if (currentCount + toUpload.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Product may have at most ${MAX_IMAGES} images (current: ${currentCount}, adding: ${toUpload.length})` },
        { status: 400 }
      );
    }
    const urls: { url: string; sort_order: number }[] = [];
    // #region agent log
    fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
      body: JSON.stringify({
        sessionId: "7fe144",
        location: "app/images/route.ts:before upload loop",
        message: "starting upload loop",
        data: { toUploadLength: toUpload.length },
        timestamp: Date.now(),
        hypothesisId: "H1",
      }),
    }).catch(() => {});
    // #endregion
    for (let i = 0; i < toUpload.length; i++) {
      const { file, buffer } = toUpload[i]!;
      const ext = file.name?.split(".").pop()?.toLowerCase() || "webp";
      const contentType = file.type || (ext === "webp" ? "image/webp" : "image/jpeg");
      const keySuffix = `${randomUUID()}.${ext}`;
      const url = await uploadProductImage(numId, buffer, contentType, keySuffix);
      urls.push({ url, sort_order: i });
    }
    // #region agent log
    fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
      body: JSON.stringify({
        sessionId: "7fe144",
        location: "app/images/route.ts:after upload loop",
        message: "upload loop done",
        data: { urlsLength: urls.length },
        timestamp: Date.now(),
        hypothesisId: "H1",
      }),
    }).catch(() => {});
    // #endregion
    const inserted = await addProductImages(numId, urls);
    // #region agent log
    fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
      body: JSON.stringify({
        sessionId: "7fe144",
        location: "app/images/route.ts:after addProductImages",
        message: "addProductImages done",
        data: { insertedLength: inserted.length },
        timestamp: Date.now(),
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(inserted);
  } catch (err) {
    // #region agent log
    const errObj = err instanceof Error ? { name: err.name, message: err.message, code: (err as { code?: string }).code } : { err: String(err) };
    fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
      body: JSON.stringify({
        sessionId: "7fe144",
        location: "app/images/route.ts:catch",
        message: "POST upload failed",
        data: errObj,
        timestamp: Date.now(),
        hypothesisId: "H1-H5",
      }),
    }).catch(() => {});
    // #endregion
    logError("POST upload failed", err);
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });
  }
}
