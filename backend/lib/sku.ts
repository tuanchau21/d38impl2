/**
 * SKU generation: 14-bit rotation + base36 (product-data-layout.md).
 * Used when creating a product; counter comes from sku_counter table.
 */

const ROTATE_BITS = 14;
const ROTATE_LEFT = 5;

/** 14-bit rotation left by k. */
function rotl14(x: number, k: number): number {
  x = x & 0x3fff;
  return ((x << k) | (x >>> (ROTATE_BITS - k))) & 0x3fff;
}

/** Counter value → 3-char base36 SKU (uppercase, zero-padded). */
export function counterToSku(counter: number): string {
  const rotated = rotl14(counter, ROTATE_LEFT);
  return rotated.toString(36).toUpperCase().padStart(3, "0");
}
