"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts } from "@/lib/api";
import { ProductCard, type ProductCardView } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

const PER_PAGE_OPTIONS = [12, 24, 48] as const;

function logError(context: string, err: unknown): void {
  console.error(`[home-product-list] ${context}`, { error: err });
}

export function HomeProductList() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = (() => {
    const v = searchParams.get("perPage");
    const n = v ? parseInt(v, 10) : 24;
    return PER_PAGE_OPTIONS.includes(n as (typeof PER_PAGE_OPTIONS)[number])
      ? (n as (typeof PER_PAGE_OPTIONS)[number])
      : 24;
  })();
  const view = (searchParams.get("view") === "list" ? "list" : "grid") as ProductCardView;
  const category = searchParams.get("category") ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof getProducts>[0] = { page, limit: perPage };
      if (category.trim()) params.category = category.trim();
      const data = await getProducts(params);
      setProducts(data.products ?? []);
      setTotal(data.total ?? data.products?.length ?? 0);
    } catch (err) {
      logError("load products", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, category]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const setParams = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      const str = String(v).trim();
      if (str === "" || (k === "page" && Number(v) === 1)) params.delete(k);
      else params.set(k, str);
    });
    if (!params.has("page")) params.set("page", "1");
    return `?${params.toString()}`;
  };

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Products
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <a
              href={setParams({ view: "grid", page: 1 })}
              className={`px-3 py-1.5 text-sm ${view === "grid" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              Grid
            </a>
            <a
              href={setParams({ view: "list", page: 1 })}
              className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              List
            </a>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            Per page:
            <select
              value={perPage}
              onChange={(e) => {
                const url = setParams({
                  perPage: e.target.value,
                  page: 1,
                });
                window.location.href = url;
              }}
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500 py-8">Loading…</p>
      ) : (
        <>
          {view === "list" ? (
            <ul className="space-y-2">
              {products.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} view="list" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} view="grid" />
              ))}
            </div>
          )}

          {!loading && products.length === 0 && (
            <p className="text-gray-500 py-8">No products found.</p>
          )}

          {totalPages > 1 && (
            <nav
              className="mt-6 flex flex-wrap items-center justify-center gap-2"
              aria-label="Pagination"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                Page {page} of {totalPages}
              </span>
              {hasPrev && (
                <a
                  href={setParams({ page: page - 1 })}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  Previous
                </a>
              )}
              {hasNext && (
                <a
                  href={setParams({ page: page + 1 })}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  Next
                </a>
              )}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
