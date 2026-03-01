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
  try {
    const product = await getProductByIdOrSlug(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const currentCount = await getProductImageCount(numId);
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
    for (let i = 0; i < toUpload.length; i++) {
      const { file, buffer } = toUpload[i]!;
      const ext = file.name?.split(".").pop()?.toLowerCase() || "webp";
      const contentType = file.type || (ext === "webp" ? "image/webp" : "image/jpeg");
      const keySuffix = `${randomUUID()}.${ext}`;
      const url = await uploadProductImage(numId, buffer, contentType, keySuffix);
      urls.push({ url, sort_order: i });
    }
    const inserted = await addProductImages(numId, urls);
    return NextResponse.json(inserted);
  } catch (err) {
    logError("POST upload failed", err);
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });
  }
}
