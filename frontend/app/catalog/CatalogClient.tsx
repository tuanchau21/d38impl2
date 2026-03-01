"use client";

import { useState, useEffect, useCallback } from "react";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 24;

function logError(context: string, err: unknown): void {
  console.error(`[catalog] ${context}`, { error: err });
}

export function CatalogClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");

  const load = useCallback(
    async (pageNum: number, append: boolean) => {
      const controller = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const params: Parameters<typeof getProducts>[0] = {
          page: pageNum,
          limit: PAGE_SIZE,
        };
        if (category) params.category = category;
        if (search.trim()) params.q = search.trim();
        const data = await getProducts(params, controller.signal);
        const list = data.products ?? [];
        setProducts((prev) => (append ? [...prev, ...list] : list));
        const hasMoreFlag = data.hasMore ?? list.length === PAGE_SIZE;
        setHasMore(hasMoreFlag);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.info("[catalog] Load cancelled", { page: pageNum });
          return;
        }
        logError("load products", err);
        setError(err instanceof Error ? err.message : "Failed to load catalog");
      } finally {
        setLoading(false);
      }
    },
    [category, search]
  );

  useEffect(() => {
    setPage(1);
    load(1, false);
  }, [category, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-56 flex-shrink-0 space-y-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {/* Categories can be loaded from GET /api/categories when backend provides it */}
          </select>
        </div>
      </aside>
      <div className="flex-1">
        {error && (
          <p className="text-red-600 dark:text-red-400 mb-4" role="alert">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {loading && <p className="text-gray-500 py-4">Loading…</p>}
        {!loading && products.length === 0 && !error && (
          <p className="text-gray-500 py-8">No products found.</p>
        )}
        {!loading && hasMore && products.length > 0 && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={loadMore}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
