"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  getAdminProducts,
  getAdminCategories,
  updateProduct,
  deleteProduct,
} from "@/lib/api";
import type { Product, Category } from "@/lib/types";

function logError(context: string, err: unknown): void {
  console.error(`[admin-products] ${context}`, { error: err });
}

export function AdminProductList() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] ?? "en";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, catList] = await Promise.all([
        getAdminProducts({ q: search || undefined }),
        getAdminCategories(),
      ]);
      setProducts(data.products ?? []);
      setCategories(catList);
    } catch (err) {
      logError("load products", err);
      setError(err instanceof Error ? err.message : t("errorLoadProducts"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePromotedToggle = async (p: Product) => {
    setUpdatingId(p.id);
    setError(null);
    try {
      const updated = await updateProduct(p.id, {
        is_promoted: !p.is_promoted,
      });
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_promoted: updated.is_promoted } : x))
      );
    } catch (err) {
      logError("update promoted", err);
      setError(err instanceof Error ? err.message : t("errorUpdate"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCategoryChange = async (p: Product, categoryId: number | null) => {
    setUpdatingId(p.id);
    setError(null);
    try {
      const updated = await updateProduct(p.id, { category_id: categoryId });
      setProducts((prev) =>
        prev.map((x) =>
          x.id === p.id ? { ...x, category_id: updated.category_id, category: updated.category } : x
        )
      );
    } catch (err) {
      logError("update category", err);
      setError(err instanceof Error ? err.message : t("errorUpdate"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(t("deleteProductConfirm", { name: p.name }))) return;
    try {
      await deleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      logError("delete product", err);
      setError(err instanceof Error ? err.message : t("errorDelete"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 w-64"
        />
      </div>
      {error && (
        <p className="text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-gray-500">{tCommon("loading")}</p>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 font-medium w-16">{t("thumb")}</th>
                <th className="px-4 py-2 font-medium">{t("name")}</th>
                <th className="px-4 py-2 font-medium">{t("sku")}</th>
                <th className="px-4 py-2 font-medium">{t("category")}</th>
                <th className="px-4 py-2 font-medium">{t("price")}</th>
                <th className="px-4 py-2 font-medium">{t("discount")}</th>
                <th className="px-4 py-2 font-medium">{t("perBox")}</th>
                <th className="px-4 py-2 font-medium">{t("promoted")}</th>
                <th className="px-4 py-2 font-medium">{t("actions")}</th>
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
                  <td className="px-4 py-2">
                    <select
                      value={p.category_id == null || p.category_id === 0 ? "" : p.category_id}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleCategoryChange(p, v === "" ? null : parseInt(v, 10));
                      }}
                      disabled={updatingId === p.id}
                      className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm min-w-[120px] disabled:opacity-50"
                      aria-label={`Category for ${p.name}`}
                    >
                      <option value="">{t("none")}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-2">{p.discount_percent ? `${p.discount_percent}%` : "—"}</td>
                  <td className="px-4 py-2">{p.quantity_per_box}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handlePromotedToggle(p)}
                      disabled={updatingId === p.id}
                      role="switch"
                      aria-checked={p.is_promoted}
                      aria-label={p.is_promoted ? t("promotedSet") : t("promotedUnset")}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        p.is_promoted
                          ? "bg-indigo-600"
                          : "bg-gray-200 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                          p.is_promoted ? "translate-x-5" : "translate-x-1"
                        }`}
                        aria-hidden
                      />
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/${locale}/admin/products/${p.id}/edit`}
                      className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                    >
                      {t("edit")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && products.length === 0 && (
        <p className="text-gray-500">{t("noProducts")}</p>
      )}
    </div>
  );
}
