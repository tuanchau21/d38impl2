/**
 * Shared types aligned with API (backend-technical-design.md, high-level-plan.md §5.3).
 */

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  sort_order: number;
}

export interface Product {
  id: number;
  category_id: number;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_percent: number;
  quantity_per_box: number;
  is_promoted: boolean;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  category?: Category;
}

export interface ProductsListResponse {
  products: Product[];
  total?: number;
  hasMore?: boolean;
}

export interface ApiError {
  error: string;
}

/** Admin user from GET /api/auth/me (admin-high-level-design.md §5). */
export interface AdminUser {
  id: number;
  email: string;
  name?: string | null;
  role?: string | null;
}
