/**
 * Categories queries. Schema: deploy/schema.sql, high-level-plan §5.3.
 */

import { query, insertAndGetId } from "./client";
import type { Category } from "@/lib/types";

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parent_id: row.parent_id,
  };
}

/** Derive URL-friendly slug from name (backend-technical-design POST /api/admin/categories). */
export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function listCategories(): Promise<Category[]> {
  const rows = await query<CategoryRow[]>(
    "SELECT id, name, slug, parent_id FROM categories ORDER BY name"
  );
  return rows.map(rowToCategory);
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  parent_id?: number | null;
}

export async function createCategory(data: CreateCategoryData): Promise<Category> {
  const name = data.name.trim();
  if (!name) {
    throw new Error("name is required");
  }
  let slug = (data.slug?.trim() || slugFromName(name)) || "category";
  const parentId = data.parent_id ?? null;
  // Ensure slug is unique; append suffix if collision
  const existing = await getCategoryBySlug(slug);
  if (existing) {
    let suffix = 1;
    while (await getCategoryBySlug(`${slug}-${suffix}`)) suffix++;
    slug = `${slug}-${suffix}`;
  }
  const id = await insertAndGetId(
    "INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)",
    [name, slug, parentId]
  );
  const rows = await query<CategoryRow[]>(
    "SELECT id, name, slug, parent_id FROM categories WHERE id = ?",
    [id]
  );
  const row = rows[0];
  if (!row) {
    throw new Error("Failed to read created category");
  }
  return rowToCategory(row);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await query<CategoryRow[]>(
    "SELECT id, name, slug, parent_id FROM categories WHERE slug = ? LIMIT 1",
    [slug]
  );
  const row = rows[0];
  return row ? rowToCategory(row) : null;
}
