/**
 * Product and product_images queries. Schema: deploy/schema.sql, high-level-plan §5.3.
 * SKU is generated from sku_counter (product-data-layout.md).
 */

import { query, insertAndGetId, withTransaction } from "./client";
import { counterToSku } from "@/lib/sku";
import type { Product, ProductImage } from "@/lib/types";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 24;

export interface ListProductsParams {
  page?: number;
  limit?: number;
  category?: number | string;
  promoted?: boolean;
  q?: string;
}

export interface ProductRow {
  id: number;
  category_id: number | null;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_percent: number;
  quantity_per_box: number;
  is_promoted: number;
  created_at: Date;
  updated_at: Date;
  category_name?: string | null;
  category_slug?: string | null;
}

export interface ProductImageRow {
  id: number;
  product_id: number;
  url: string;
  sort_order: number;
}

function rowToProduct(row: ProductRow, images?: ProductImageRow[]): Product {
  const product: Product = {
    id: row.id,
    category_id: row.category_id ?? 0,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    discount_percent: Number(row.discount_percent),
    quantity_per_box: row.quantity_per_box,
    is_promoted: Boolean(row.is_promoted),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    images: images?.map((i) => ({ id: i.id, product_id: i.product_id, url: i.url, sort_order: i.sort_order })),
  };
  if (row.category_id != null && row.category_name != null) {
    product.category = {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug ?? "",
      parent_id: null,
    };
  }
  return product;
}

export async function listProducts(params: ListProductsParams): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.category != null) {
    if (typeof params.category === "number") {
      conditions.push("p.category_id = ?");
      values.push(params.category);
    } else {
      conditions.push("p.category_id = (SELECT id FROM categories WHERE slug = ? LIMIT 1)");
      values.push(params.category);
    }
  }
  if (params.promoted === true) {
    conditions.push("p.is_promoted = 1");
  }
  if (params.q?.trim()) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)");
    const term = `%${params.q.trim()}%`;
    values.push(term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*) AS total FROM products p ${where}`;
  const countResult = await query<{ total: number }[]>(countSql, values);
  const total = Number(countResult[0]?.total ?? 0);

  const sql = `
    SELECT p.id, p.category_id, p.sku, p.name, p.slug, p.description, p.price, p.discount_percent, p.quantity_per_box, p.is_promoted, p.created_at, p.updated_at,
           c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${where}
    ORDER BY p.updated_at DESC
    LIMIT ? OFFSET ?
  `;
  // MySQL 8.0.22 + mysql2: pass LIMIT/OFFSET as strings to avoid mysqld_stmt_execute error
  const rows = await query<ProductRow[]>(sql, [...values, String(limit), String(offset)]);

  const productIds = rows.map((r) => r.id);
  let images: ProductImageRow[] = [];
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => "?").join(",");
    images = await query<ProductImageRow[]>(
      `SELECT id, product_id, url, sort_order FROM product_images WHERE product_id IN (${placeholders}) ORDER BY product_id, sort_order`,
      productIds.map((id) => String(id))
    );
  }

  const byProduct = new Map<number, ProductImageRow[]>();
  for (const img of images) {
    const list = byProduct.get(img.product_id) ?? [];
    list.push(img);
    byProduct.set(img.product_id, list);
  }

  const products = rows.map((r) => rowToProduct(r, byProduct.get(r.id)));

  return { products, total, hasMore: offset + rows.length < total };
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  const isNumeric = /^\d+$/.test(idOrSlug);
  const sql = isNumeric
    ? "SELECT id, category_id, sku, name, slug, description, price, discount_percent, quantity_per_box, is_promoted, created_at, updated_at FROM products WHERE id = ?"
    : "SELECT id, category_id, sku, name, slug, description, price, discount_percent, quantity_per_box, is_promoted, created_at, updated_at FROM products WHERE slug = ?";
  const rows = await query<ProductRow[]>(sql, [idOrSlug]);
  const row = rows[0];
  if (!row) return null;
  const imgs = await query<ProductImageRow[]>("SELECT id, product_id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order", [row.id]);
  return rowToProduct(row, imgs);
}

export async function createProduct(data: {
  name: string;
  category_id?: number | null;
  description?: string | null;
  price: number;
  discount_percent?: number;
  quantity_per_box: number;
  is_promoted?: boolean;
}): Promise<Product> {
  const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return withTransaction(async (conn) => {
    const [counterRows] = await conn.execute<RowDataPacket[]>(
      "SELECT value FROM sku_counter WHERE id = 1 FOR UPDATE"
    );
    const counterValue = Number(counterRows[0]?.value ?? 0);
    const sku = counterToSku(counterValue);

    await conn.execute("UPDATE sku_counter SET value = value + 1 WHERE id = 1");

    const insertSql = `
      INSERT INTO products (category_id, sku, name, slug, description, price, discount_percent, quantity_per_box, is_promoted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [insertResult] = await conn.execute<ResultSetHeader>(insertSql, [
      data.category_id ?? null,
      sku,
      data.name,
      slug,
      data.description ?? null,
      data.price,
      data.discount_percent ?? 0,
      data.quantity_per_box,
      data.is_promoted ? 1 : 0,
    ]);
    const id = insertResult.insertId;

    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT id, category_id, sku, name, slug, description, price, discount_percent, quantity_per_box, is_promoted, created_at, updated_at FROM products WHERE id = ?",
      [id]
    );
    return rowToProduct(rows[0] as ProductRow, []);
  });
}

export async function updateProduct(
  id: number,
  data: Partial<{
    name: string;
    category_id: number | null;
    description: string | null;
    price: number;
    discount_percent: number;
    quantity_per_box: number;
    is_promoted: boolean;
  }>
): Promise<Product | null> {
  const existing = await query<ProductRow[]>("SELECT id FROM products WHERE id = ?", [id]);
  if (!existing.length) return null;

  const updates: string[] = [];
  const values: unknown[] = [];
  if (data.name != null) {
    updates.push("name = ?");
    values.push(data.name);
    const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    updates.push("slug = ?");
    values.push(slug);
  }
  if (data.category_id !== undefined) {
    updates.push("category_id = ?");
    values.push(data.category_id);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.price != null) {
    updates.push("price = ?");
    values.push(data.price);
  }
  if (data.discount_percent != null) {
    updates.push("discount_percent = ?");
    values.push(data.discount_percent);
  }
  if (data.quantity_per_box != null) {
    updates.push("quantity_per_box = ?");
    values.push(data.quantity_per_box);
  }
  if (data.is_promoted !== undefined) {
    updates.push("is_promoted = ?");
    values.push(data.is_promoted ? 1 : 0);
  }
  if (updates.length === 0) {
    const row = await query<ProductRow[]>("SELECT id, category_id, sku, name, slug, description, price, discount_percent, quantity_per_box, is_promoted, created_at, updated_at FROM products WHERE id = ?", [id]);
    const imgs = await query<ProductImageRow[]>("SELECT id, product_id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order", [id]);
    return rowToProduct(row[0]!, imgs);
  }
  values.push(id);
  await query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, values);
  return getProductByIdOrSlug(String(id));
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await query<{ affectedRows: number }>("DELETE FROM products WHERE id = ?", [id]);
  const affected = (result as unknown as { affectedRows: number }).affectedRows;
  return affected > 0;
}

export async function getProductImageCount(productId: number): Promise<number> {
  const r = await query<{ count: number }[]>("SELECT COUNT(*) AS count FROM product_images WHERE product_id = ?", [productId]);
  return Number(r[0]?.count ?? 0);
}

const MAX_IMAGES_PER_PRODUCT = 6;

export async function addProductImages(productId: number, imageUrls: { url: string; sort_order: number }[]): Promise<ProductImage[]> {
  const current = await getProductImageCount(productId);
  if (current + imageUrls.length > MAX_IMAGES_PER_PRODUCT) {
    throw new Error(`Product may have at most ${MAX_IMAGES_PER_PRODUCT} images (current: ${current}, adding: ${imageUrls.length})`);
  }
  const inserted: ProductImage[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const { url, sort_order } = imageUrls[i]!;
    const so = sort_order + current;
    const id = await insertAndGetId("INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)", [productId, url, so]);
    inserted.push({ id, product_id: productId, url, sort_order: so });
  }
  return inserted;
}

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  const rows = await query<ProductImageRow[]>("SELECT id, product_id, url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order", [productId]);
  return rows.map((r) => ({ id: r.id, product_id: r.product_id, url: r.url, sort_order: r.sort_order }));
}

export async function deleteProductImage(productId: number, imageId: number): Promise<boolean> {
  const result = await query<{ affectedRows: number }>("DELETE FROM product_images WHERE product_id = ? AND id = ?", [productId, imageId]);
  const affected = (result as unknown as { affectedRows: number }).affectedRows;
  return affected > 0;
}
