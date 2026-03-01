/**
 * Categories queries. Schema: deploy/schema.sql, high-level-plan §5.3.
 */

import { query } from "./client";
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

export async function listCategories(): Promise<Category[]> {
  const rows = await query<CategoryRow[]>(
    "SELECT id, name, slug, parent_id FROM categories ORDER BY name"
  );
  return rows.map(rowToCategory);
}
