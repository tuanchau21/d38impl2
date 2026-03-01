"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createProduct,
  updateProduct,
  uploadProductImages,
  deleteProductImage,
  getCategories,
  createCategory,
} from "@/lib/api";
import type { Category, Product, ProductImage } from "@/lib/types";

function logError(context: string, err: unknown): void {
  console.error(`[admin-product-form] ${context}`, { error: err });
}

interface AdminProductFormProps {
  product?: Product;
}

export function AdminProductForm({ product }: AdminProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">(
    product?.category_id != null && product.category_id !== 0 ? product.category_id : ""
  );
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    product?.discount_percent?.toString() ?? "0"
  );
  const [quantityPerBox, setQuantityPerBox] = useState(
    product?.quantity_per_box?.toString() ?? "1"
  );
  const [isPromoted, setIsPromoted] = useState(product?.is_promoted ?? false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product?.images ?? []);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);

  const loadCategories = () => {
    getCategories()
      .then(setCategories)
      .catch((err) => logError("load categories", err));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (product?.images) setExistingImages(product.images);
  }, [product?.images]);

  const handleRemoveImage = async (img: ProductImage) => {
    if (!product) return;
    try {
      await deleteProductImage(product.id, img.id, opts);
      setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err) {
      logError("remove image", err);
      setError(err instanceof Error ? err.message : "Failed to remove image");
    }
  };

  const opts = { adminKey: adminKey || undefined };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      setAddCategoryError("Name is required");
      return;
    }
    setAddCategoryError(null);
    setAddCategoryLoading(true);
    try {
      const created = await createCategory({ name }, opts);
      loadCategories();
      setCategoryId(created.id);
      setNewCategoryName("");
      setShowAddCategory(false);
    } catch (err) {
      logError("create category", err);
      setAddCategoryError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setAddCategoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name,
        sku,
        category_id: categoryId === "" ? null : (categoryId as number),
        description: description || undefined,
        price: parseFloat(price) || 0,
        discount_percent: parseFloat(discountPercent) || 0,
        quantity_per_box: parseInt(quantityPerBox, 10) || 1,
        is_promoted: isPromoted,
      };
      if (isEdit && product) {
        await updateProduct(product.id, payload, opts);
        if (imageFiles.length > 0) {
          await uploadProductImages(product.id, imageFiles, opts);
        }
        router.push("/admin/products");
        router.refresh();
      } else {
        const created = await createProduct(payload, opts);
        if (imageFiles.length > 0) {
          await uploadProductImages(created.id, imageFiles, opts);
        }
        router.push(`/admin/products/${created.id}/edit`);
        router.refresh();
      }
    } catch (err) {
      logError("save product", err);
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="adminKey" className="block text-sm font-medium mb-1">
          Admin API key (optional for dev)
        </label>
        <input
          id="adminKey"
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name *
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="sku" className="block text-sm font-medium mb-1">
          SKU *
        </label>
        <input
          id="sku"
          required
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <div className="flex gap-2 items-center">
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
            className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            aria-label="Product category"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddCategory(true)}
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm whitespace-nowrap"
          >
            Add category
          </button>
        </div>
        {showAddCategory && (
          <div
            className="mt-3 p-3 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
            role="dialog"
            aria-labelledby="add-category-title"
          >
            <h3 id="add-category-title" className="text-sm font-medium mb-2">
              New category
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-2">
              <label htmlFor="newCategoryName" className="sr-only">
                Category name
              </label>
              <input
                id="newCategoryName"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                autoFocus
              />
              {addCategoryError && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {addCategoryError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addCategoryLoading}
                  className="px-3 py-1.5 rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium disabled:opacity-50"
                >
                  {addCategoryLoading ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryName("");
                    setAddCategoryError(null);
                  }}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Price *
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="discount" className="block text-sm font-medium mb-1">
            Discount %
          </label>
          <input
            id="discount"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="qty" className="block text-sm font-medium mb-1">
            Quantity per box *
          </label>
          <input
            id="qty"
            type="number"
            min="1"
            required
            value={quantityPerBox}
            onChange={(e) => setQuantityPerBox(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="promoted"
          type="checkbox"
          checked={isPromoted}
          onChange={(e) => setIsPromoted(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="promoted">Promoted</label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Images (3–6)</label>
        {isEdit && existingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative inline-block">
                <img
                  src={img.url}
                  alt=""
                  className="w-20 h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img)}
                  className="absolute top-0 right-0 rounded bg-red-600 text-white text-xs px-1.5 py-0.5 hover:bg-red-700"
                  aria-label={`Remove image ${img.id}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
          className="w-full text-sm"
        />
        {imageFiles.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">{imageFiles.length} file(s) selected to upload</p>
        )}
      </div>
      {error && (
        <p className="text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium disabled:opacity-50"
        >
          {loading ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
        <Link
          href="/admin/products"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
