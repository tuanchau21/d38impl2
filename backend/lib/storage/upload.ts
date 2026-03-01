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
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: ns ? `${ns}/${bucketName}` : bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
  } catch (err) {
    logError("uploadProductImage failed", err);
    throw err;
  }
  const region = process.env.OCI_OBJECT_STORAGE_REGION || "us-phoenix-1";
  const baseUrl = process.env.OCI_OBJECT_STORAGE_ENDPOINT || `https://objectstorage.${region}.oraclecloud.com`;
  return `${baseUrl}/n/${ns}/b/${bucketName}/o/${encodeURIComponent(key)}`;
}
