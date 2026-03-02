/**
 * API client for public and admin endpoints.
 * Logs on error, exception, and cancel per project coding rule.
 */

import type { AdminUser, Category, Product, ProductsListResponse } from "./types";

/** Default fetch options for admin: send cookies (session). */
const ADMIN_CREDENTIALS: RequestInit = { credentials: "include" };

/** Server-side (SSR) needs the backend base URL; browser uses same-origin (Nginx proxies /api to backend). */
const BASE =
  typeof window === "undefined"
    ? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001"
    : "";

function logError(context: string, err: unknown, extra?: Record<string, unknown>): void {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[api] ${context}`, { error: err, ...extra });
  }
}

function logCancel(context: string, extra?: Record<string, unknown>): void {
  if (typeof console !== "undefined" && console.info) {
    console.info(`[api] Request cancelled: ${context}`, extra);
  }
}

async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(url, { ...options, signal });
  if (!res.ok) {
    const body = await res.text();
    let parsed: { error?: string } = {};
    try {
      parsed = JSON.parse(body) as { error?: string };
    } catch {
      // ignore
    }
    const message = (parsed.error ?? body) || res.statusText;
    logError("request failed", new Error(message), { url, status: res.status });
    throw new Error(message || `Request failed: ${res.status}`);
  }
  try {
    return (await res.json()) as T;
  } catch (err) {
    logError("parse response", err, { url });
    throw err;
  }
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: number | string;
  promoted?: boolean;
  q?: string;
}

export async function getProducts(
  params: GetProductsParams = {},
  signal?: AbortSignal
): Promise<ProductsListResponse> {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.category != null) search.set("category", String(params.category));
  if (params.promoted === true) search.set("promoted", "true");
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  const url = `${BASE}/api/products${qs ? `?${qs}` : ""}`;
  try {
    const data = await fetchJson<ProductsListResponse | Product[]>(url, {}, signal);
    if (Array.isArray(data)) return { products: data };
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("getProducts", { url });
      throw err;
    }
    throw err;
  }
}

export async function getProduct(idOrSlug: string, signal?: AbortSignal): Promise<Product> {
  const url = `${BASE}/api/products/${encodeURIComponent(idOrSlug)}`;
  try {
    return await fetchJson<Product>(url, {}, signal);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("getProduct", { url });
      throw err;
    }
    throw err;
  }
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const url = `${BASE}/api/categories`;
  try {
    return await fetchJson<Category[]>(url, {}, signal);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("getCategories", { url });
      throw err;
    }
    throw err;
  }
}

/** Admin list categories (GET /api/admin/categories). Same shape as public; protected by admin auth. */
export async function getAdminCategories(
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<Category[]> {
  const url = `${BASE}/api/admin/categories`;
  const headers: HeadersInit = {};
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    return await fetchJson<Category[]>(
      url,
      { headers, ...ADMIN_CREDENTIALS },
      options.signal
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("getAdminCategories", { url });
      throw err;
    }
    throw err;
  }
}

export async function createCategory(
  body: { name: string; slug?: string; parent_id?: number | null },
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<Category> {
  const url = `${BASE}/api/admin/categories`;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    return await fetchJson<Category>(
      url,
      { method: "POST", headers, body: JSON.stringify(body), ...ADMIN_CREDENTIALS },
      options.signal
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("createCategory", { url });
      throw err;
    }
    throw err;
  }
}

/** Update category (PUT /api/admin/categories/:id). Body: name (required), slug? (admin-high-level-design §7). */
export async function updateCategory(
  id: number,
  body: { name: string; slug?: string },
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<Category> {
  const url = `${BASE}/api/admin/categories/${id}`;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    return await fetchJson<Category>(
      url,
      { method: "PUT", headers, body: JSON.stringify(body), ...ADMIN_CREDENTIALS },
      options.signal
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("updateCategory", { url });
      throw err;
    }
    throw err;
  }
}

/** Delete category (DELETE /api/admin/categories/:id). Throws with message on 409 (in use). */
export async function deleteCategory(
  id: number,
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<void> {
  const url = `${BASE}/api/admin/categories/${id}`;
  const headers: HeadersInit = {};
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers,
      ...ADMIN_CREDENTIALS,
      signal: options.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = text;
      try {
        const j = JSON.parse(text) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        // ignore
      }
      logError("deleteCategory failed", new Error(msg), { url, status: res.status });
      throw new Error(msg || `Delete failed: ${res.status}`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("deleteCategory", { url });
      throw err;
    }
    throw err;
  }
}

export async function getPromoted(signal?: AbortSignal): Promise<Product[]> {
  const url = `${BASE}/api/promoted`;
  try {
    const data = await fetchJson<Product[] | { products: Product[] }>(url, {}, signal);
    return Array.isArray(data) ? data : data.products ?? [];
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("getPromoted", { url });
      throw err;
    }
    throw err;
  }
}

export interface ShopSettings {
  shop_name: string;
}

export async function getSettings(signal?: AbortSignal): Promise<ShopSettings> {
  const url = `${BASE}/api/settings`;
  try {
    return await fetchJson<ShopSettings>(url, {}, signal);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("getSettings", { url });
      throw err;
    }
    throw err;
  }
}

export async function getAdminSettings(
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<ShopSettings> {
  const url = `${BASE}/api/admin/settings`;
  const headers: HeadersInit = {};
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    return await fetchJson<ShopSettings>(url, { headers, ...ADMIN_CREDENTIALS }, options.signal);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("getAdminSettings", { url });
      throw err;
    }
    logError("getAdminSettings failed", err, { url });
    throw err;
  }
}

export async function updateAdminSettings(
  body: { shop_name?: string },
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<ShopSettings> {
  const url = `${BASE}/api/admin/settings`;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    return await fetchJson<ShopSettings>(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      ...ADMIN_CREDENTIALS,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("updateAdminSettings", { url });
      throw err;
    }
    logError("updateAdminSettings failed", err, { url });
    throw err;
  }
}

// Auth (admin-high-level-design.md §5). credentials: include for session cookie.
export async function getAuthMe(signal?: AbortSignal): Promise<AdminUser> {
  const url = `${BASE}/api/auth/me`;
  const res = await fetch(url, { ...ADMIN_CREDENTIALS, signal });
  if (!res.ok) {
    const text = await res.text();
    logError("getAuthMe failed", new Error(text), { url, status: res.status });
    throw new Error(text || "Unauthorized");
  }
  const data = (await res.json()) as { user: AdminUser };
  return data.user;
}

export async function login(
  email: string,
  password: string,
  signal?: AbortSignal
): Promise<{ user: AdminUser }> {
  const url = `${BASE}/api/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      // ignore
    }
    logError("login failed", new Error(msg), { url, status: res.status });
    throw new Error(msg || "Login failed");
  }
  return (await res.json()) as { user: AdminUser };
}

export async function logout(signal?: AbortSignal): Promise<void> {
  const url = `${BASE}/api/auth/logout`;
  try {
    await fetch(url, { method: "POST", ...ADMIN_CREDENTIALS, signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("logout", { url });
      throw err;
    }
    logError("logout failed", err, { url });
    throw err;
  }
}

// Admin API (session cookie via credentials, or API key in header)
export async function getAdminProducts(
  params: { page?: number; limit?: number; q?: string } = {},
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<ProductsListResponse> {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  const url = `${BASE}/api/admin/products${qs ? `?${qs}` : ""}`;
  const headers: HeadersInit = {};
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    const data = await fetchJson<ProductsListResponse | Product[]>(
      url,
      { headers, ...ADMIN_CREDENTIALS },
      options.signal
    );
    if (Array.isArray(data)) return { products: data };
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("getAdminProducts", { url });
      throw err;
    }
    throw err;
  }
}

export async function createProduct(
  body: Partial<{
    name: string;
    category_id: number | null;
    description: string;
    price: number;
    discount_percent: number;
    quantity_per_box: number;
    is_promoted: boolean;
  }>,
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<Product> {
  const url = `${BASE}/api/admin/products`;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    return await fetchJson<Product>(
      url,
      { method: "POST", headers, body: JSON.stringify(body), ...ADMIN_CREDENTIALS },
      options.signal
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("createProduct", { url });
      throw err;
    }
    throw err;
  }
}

export async function updateProduct(
  id: number,
  body: Partial<{
    name: string;
    category_id: number | null;
    description: string;
    price: number;
    discount_percent: number;
    quantity_per_box: number;
    is_promoted: boolean;
  }>,
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<Product> {
  const url = `${BASE}/api/admin/products/${id}`;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    return await fetchJson<Product>(
      url,
      { method: "PUT", headers, body: JSON.stringify(body), ...ADMIN_CREDENTIALS },
      options.signal
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("updateProduct", { url });
      throw err;
    }
    throw err;
  }
}

export async function deleteProduct(
  id: number,
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<void> {
  const url = `${BASE}/api/admin/products/${id}`;
  const headers: HeadersInit = {};
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    const res = await fetch(url, { method: "DELETE", headers, ...ADMIN_CREDENTIALS, signal: options.signal });
    if (!res.ok) {
      const text = await res.text();
      logError("deleteProduct failed", new Error(text), { url, status: res.status });
      throw new Error(text || `Delete failed: ${res.status}`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("deleteProduct", { url });
      throw err;
    }
    throw err;
  }
}

export async function uploadProductImages(
  productId: number,
  files: File[],
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<{ id: number; url: string; sort_order: number }[]> {
  const url = `${BASE}/api/admin/products/${productId}/images`;
  const form = new FormData();
  for (const f of files) form.append("images", f);
  const headers: HeadersInit = {};
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: form,
      ...ADMIN_CREDENTIALS,
      signal: options.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      logError("uploadProductImages failed", new Error(text), { url, status: res.status });
      throw new Error(text || `Upload failed: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("uploadProductImages", { url });
      throw err;
    }
    throw err;
  }
}

export async function deleteProductImage(
  productId: number,
  imageId: number,
  options: { signal?: AbortSignal; adminKey?: string } = {}
): Promise<void> {
  const url = `${BASE}/api/admin/products/${productId}/images/${imageId}`;
  const headers: HeadersInit = {};
  if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
  try {
    const res = await fetch(url, { method: "DELETE", headers, ...ADMIN_CREDENTIALS, signal: options.signal });
    if (!res.ok) {
      const text = await res.text();
      logError("deleteProductImage failed", new Error(text), { url, status: res.status });
      throw new Error(text || `Delete image failed: ${res.status}`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logCancel("deleteProductImage", { url });
      throw err;
    }
    throw err;
  }
}
