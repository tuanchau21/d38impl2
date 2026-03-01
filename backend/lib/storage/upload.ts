/**
 * Upload to Oracle Object Storage (S3-compatible API). Per high-level-plan §6.
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function logError(context: string, err: unknown): void {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[storage] ${context}`, { error: err });
  }
}

function getClient(): S3Client {
  const region = process.env.OCI_OBJECT_STORAGE_REGION || "us-phoenix-1";
  const endpoint = process.env.OCI_OBJECT_STORAGE_ENDPOINT || `https://objectstorage.${region}.oraclecloud.com`;
  const forcePathStyle = true;
  const credentials = {
    accessKeyId: process.env.OCI_OBJECT_STORAGE_ACCESS_KEY || "",
    secretAccessKey: process.env.OCI_OBJECT_STORAGE_SECRET_KEY || "",
  };
  return new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials,
  });
}

const bucket = () => process.env.OCI_OBJECT_STORAGE_BUCKET || "shop-product-images";
const namespace = () => process.env.OCI_OBJECT_STORAGE_NAMESPACE || "";

/**
 * Upload a buffer to OCI Object Storage. Key pattern: products/{productId}/{uuid}.webp
 * Returns the public URL (or a path that the app can use to build the URL).
 */
export async function uploadProductImage(
  productId: number,
  buffer: Buffer,
  contentType: string,
  keySuffix: string
): Promise<string> {
  const key = `products/${productId}/${keySuffix}`;
  const client = getClient();
  const ns = namespace();
  const bucketName = bucket();
  const bucketParam = ns ? `${ns}/${bucketName}` : bucketName;
  // #region agent log
  fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
    body: JSON.stringify({
      sessionId: "7fe144",
      location: "storage/upload.ts:before PutObject",
      message: "uploadProductImage start",
      data: { productId, key, hasNs: !!ns, bucketName, bucketParamLength: bucketParam.length },
      timestamp: Date.now(),
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketParam,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
  } catch (err) {
    // #region agent log
    const errData = err instanceof Error ? { name: err.name, message: err.message, code: (err as { code?: string }).code } : { err: String(err) };
    fetch("http://127.0.0.1:7484/ingest/cda7c92b-65a3-4c72-a194-70a9941e9586", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7fe144" },
      body: JSON.stringify({
        sessionId: "7fe144",
        location: "storage/upload.ts:catch",
        message: "uploadProductImage failed",
        data: errData,
        timestamp: Date.now(),
        hypothesisId: "H1",
      }),
    }).catch(() => {});
    // #endregion
    logError("uploadProductImage failed", err);
    throw err;
  }
  const region = process.env.OCI_OBJECT_STORAGE_REGION || "us-phoenix-1";
  const baseUrl = process.env.OCI_OBJECT_STORAGE_ENDPOINT || `https://objectstorage.${region}.oraclecloud.com`;
  return `${baseUrl}/n/${ns}/b/${bucketName}/o/${encodeURIComponent(key)}`;
}
