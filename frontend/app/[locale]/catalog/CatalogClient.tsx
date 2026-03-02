"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getProducts, getCategories } from "@/lib/api";
import { ProductCard, type ProductCardView } from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import type { Category } from "@/lib/types";

const PER_PAGE_OPTIONS = [12, 24, 48] as const;

function logError(context: string, err: unknown): void {
  console.error(`[catalog] ${context}`, { error: err });
}

export function CatalogClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
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
  const q = searchParams.get("q") ?? "";

  const loadCategories = useCallback(async () => {
    try {
      const list = await getCategories();
      setCategories(list);
    } catch (err) {
      logError("load categories", err);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof getProducts>[0] = {
        page,
        limit: perPage,
      };
      if (category) params.category = category;
      if (q.trim()) params.q = q.trim();
      const data = await getProducts(params);
      const list = data.products ?? [];
      setProducts(list);
      setTotal(data.total ?? list.length);
    } catch (err) {
      logError("load products", err);
      setError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, category, q]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[name="q"]');
    setParams({ q: input?.value ?? "", page: 1 });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-56 flex-shrink-0 space-y-4">
        <form onSubmit={handleSearchSubmit} role="search">
          <label htmlFor="catalog-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            id="catalog-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search products..."
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Search
          </button>
        </form>
        <div>
          <label htmlFor="catalog-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            id="catalog-category"
            value={category}
            onChange={(e) => setParams({ category: e.target.value, page: 1 })}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Price range
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">Coming soon</p>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {total} product{total !== 1 ? "s" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setParams({ view: "grid", page: 1 })}
                className={`px-3 py-1.5 text-sm ${view === "grid" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setParams({ view: "list", page: 1 })}
                className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                List
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              Per page:
              <select
                value={perPage}
                onChange={(e) =>
                  setParams({ perPage: Number(e.target.value), page: 1 })
                }
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

            {!loading && products.length === 0 && !error && (
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
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => setParams({ page: page - 1 })}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => setParams({ page: page + 1 })}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
