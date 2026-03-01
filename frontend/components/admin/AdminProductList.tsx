"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdminProducts, deleteProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

function logError(context: string, err: unknown): void {
  console.error(`[admin-products] ${context}`, { error: err });
}

export function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminProducts(
        { q: search || undefined },
        { adminKey: adminKey || undefined }
      );
      const list = data.products ?? [];
      setProducts(list);
    } catch (err) {
      logError("load products", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(p.id, { adminKey: adminKey || undefined });
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      logError("delete product", err);
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 w-64"
        />
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="Admin API key (optional for dev)"
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 w-48"
        />
      </div>
      {error && (
        <p className="text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 font-medium w-16">Thumb</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium">Discount</th>
                <th className="px-4 py-2 font-medium">Per box</th>
                <th className="px-4 py-2 font-medium">Promoted</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">
                    {p.images?.length ? (
                      <img
                        src={p.images[0]!.url}
                        alt=""
                        className="w-12 h-12 object-cover rounded"
                        loading="lazy"
                      />
                    ) : (
                      <span className="inline-block w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 text-gray-400 text-xs flex items-center justify-center">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.sku}</td>
                  <td className="px-4 py-2">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-2">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-2">{p.discount_percent ? `${p.discount_percent}%` : "—"}</td>
                  <td className="px-4 py-2">{p.quantity_per_box}</td>
                  <td className="px-4 py-2">{p.is_promoted ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && products.length === 0 && (
        <p className="text-gray-500">No products found.</p>
      )}
    </div>
  );
}
