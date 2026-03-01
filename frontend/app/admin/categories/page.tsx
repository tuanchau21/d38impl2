"use client";

import { useState, useEffect } from "react";
import {
  getAdminCategories,
  createCategory,
  deleteCategory,
} from "@/lib/api";
import type { Category } from "@/lib/types";

function logError(context: string, err: unknown): void {
  console.error(`[admin-categories] ${context}`, { error: err });
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [addParentId, setAddParentId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAdminCategories();
      setCategories(list);
    } catch (err) {
      logError("load categories", err);
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addName.trim();
    if (!name) {
      setAddError("Name is required");
      return;
    }
    setSubmitting(true);
    setAddError(null);
    try {
      await createCategory({
        name,
        slug: addSlug.trim() || undefined,
        parent_id: addParentId ? parseInt(addParentId, 10) : undefined,
      });
      setAddName("");
      setAddSlug("");
      setAddParentId("");
      setShowAddForm(false);
      await load();
    } catch (err) {
      logError("create category", err);
      setAddError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (
      !confirm(
        `Delete category "${cat.name}"? Products using it must be updated first.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      logError("delete category", err);
      const message =
        err instanceof Error ? err.message : "Delete failed";
      setError(message);
    }
  };

  const parentName = (parentId: number | null) => {
    if (parentId == null) return "—";
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name ?? String(parentId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Categories
        </h1>
        <button
          type="button"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setAddError(null);
          }}
          className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90"
        >
          Add category
        </button>
      </div>

      {error && (
        <p className="mb-4 text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <h2 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
            New category
          </h2>
          {addError && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-2" role="alert">
              {addError}
            </p>
          )}
          <div className="flex flex-wrap gap-4 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Name (required)
              </span>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 w-48"
                placeholder="Category name"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Slug (optional)
              </span>
              <input
                type="text"
                value={addSlug}
                onChange={(e) => setAddSlug(e.target.value)}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 w-40"
                placeholder="url-slug"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Parent (optional)
              </span>
              <select
                value={addParentId}
                onChange={(e) => setAddParentId(e.target.value)}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 w-40"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddError(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Slug</th>
                <th className="px-4 py-2 font-medium">Parent</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-4 py-2 text-gray-900 dark:text-white">
                    {cat.name}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {parentName(cat.parent_id)}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
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

      {!loading && categories.length === 0 && (
        <p className="text-gray-500 mt-4">No categories yet. Add one above.</p>
      )}
    </div>
  );
}
