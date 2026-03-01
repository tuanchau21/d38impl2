/**
 * API client for public and admin endpoints.
 * Logs on error, exception, and cancel per project coding rule.
 */

import type { Product, ProductsListResponse } from "./types";

const BASE = "";

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

// Admin API (same-origin; API key should be set by caller via headers)
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
    const data = await fetchJson<ProductsListResponse | Product[]>(url, { headers }, options.signal);
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
    sku: string;
    category_id: number;
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
    return await fetchJson<Product>(url, { method: "POST", headers, body: JSON.stringify(body) }, options.signal);
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
    sku: string;
    category_id: number;
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
    return await fetchJson<Product>(url, { method: "PUT", headers, body: JSON.stringify(body) }, options.signal);
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
    const res = await fetch(url, { method: "DELETE", headers, signal: options.signal });
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
    const res = await fetch(url, { method: "POST", headers, body: form, signal: options.signal });
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
