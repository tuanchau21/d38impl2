"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createProduct,
  updateProduct,
  uploadProductImages,
  deleteProductImage,
  getCategories,
  createCategory,
  getAdminProducts,
} from "@/lib/api";
import type { Category, Product, ProductImage } from "@/lib/types";

function logError(context: string, err: unknown): void {
  console.error(`[admin-product-form] ${context}`, { error: err });
}

/** Restrict to digits and one decimal separator (. or ,), max 2 digits after. */
function formatPriceInput(value: string): string {
  let s = value.replace(/[^\d.,]/g, "");
  const sepIdx = s.search(/[.,]/);
  if (sepIdx === -1) {
    return s.replace(/[.,]/g, "");
  }
  const sep = s[sepIdx];
  const before = s.slice(0, sepIdx).replace(/[.,]/g, "");
  const after = s.slice(sepIdx + 1).replace(/\D/g, "").slice(0, 2);
  return before + sep + after;
}

/** Convert price string (with . or ,) to number for API, max 2 decimals. */
function priceStringToNumber(s: string): number {
  const normalized = s.trim().replace(",", ".");
  const num = parseFloat(normalized);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
}

interface AdminProductFormProps {
  product?: Product;
}

export function AdminProductForm({ product }: AdminProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">(
    product?.category_id != null && product.category_id !== 0 ? product.category_id : ""
  );
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    product?.discount_percent?.toString() ?? "0"
  );
  const [quantityPerBox, setQuantityPerBox] = useState(
    product?.quantity_per_box?.toString() ?? "1"
  );
  const [isPromoted, setIsPromoted] = useState(product?.is_promoted ?? false);
  const [pendingImages, setPendingImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product?.images ?? []);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);
  const [copySearchQuery, setCopySearchQuery] = useState("");
  const [copySearchResults, setCopySearchResults] = useState<Product[]>([]);
  const [copySearchLoading, setCopySearchLoading] = useState(false);
  const [copySelectedProduct, setCopySelectedProduct] = useState<Product | null>(null);
  const [copyDropdownVisible, setCopyDropdownVisible] = useState(false);
  const copyDropdownRef = useRef<HTMLDivElement>(null);
  const copySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingImagesRef = useRef<{ file: File; previewUrl: string }[]>([]);

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

  useEffect(() => {
    if (copySearchQuery.trim().length < 2) {
      setCopySearchResults([]);
      setCopyDropdownVisible(false);
      return;
    }
    if (copySearchDebounceRef.current) clearTimeout(copySearchDebounceRef.current);
    copySearchDebounceRef.current = setTimeout(() => {
      setCopySearchLoading(true);
      getAdminProducts({ q: copySearchQuery.trim(), limit: 10 })
        .then((res) => {
          setCopySearchResults(res.products ?? []);
          setCopyDropdownVisible(true);
        })
        .catch((err) => logError("copy-search", err))
        .finally(() => setCopySearchLoading(false));
      copySearchDebounceRef.current = null;
    }, 300);
    return () => {
      if (copySearchDebounceRef.current) clearTimeout(copySearchDebounceRef.current);
    };
  }, [copySearchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (copyDropdownRef.current && !copyDropdownRef.current.contains(event.target as Node)) {
        setCopyDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  const handleCopyFromProduct = useCallback((p: Product) => {
    setName(p.name);
    setCategoryId(p.category_id != null && p.category_id !== 0 ? p.category_id : "");
    setDescription(p.description ?? "");
    setPrice(p.price.toString());
    setDiscountPercent(p.discount_percent?.toString() ?? "0");
    setQuantityPerBox(p.quantity_per_box?.toString() ?? "1");
    setIsPromoted(p.is_promoted ?? false);
    setCopySelectedProduct(p);
    setCopyDropdownVisible(false);
  }, []);

  const addPendingImages = useCallback((files: File[]) => {
    const newEntries = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => {
      const combined = [...prev, ...newEntries];
      const next = combined.slice(0, 6);
      combined.slice(6).forEach((e) => URL.revokeObjectURL(e.previewUrl));
      return next;
    });
  }, []);

  const removePendingImage = useCallback((index: number) => {
    setPendingImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]!.previewUrl);
      return next;
    });
  }, []);

  const handleRemoveImage = async (img: ProductImage) => {
    if (!product) return;
    try {
      await deleteProductImage(product.id, img.id);
      setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err) {
      logError("remove image", err);
      setError(err instanceof Error ? err.message : "Failed to remove image");
    }
  };

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
      const created = await createCategory({ name });
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
        category_id: categoryId === "" ? null : (categoryId as number),
        description: description || undefined,
        price: priceStringToNumber(price),
        discount_percent: parseFloat(discountPercent) || 0,
        quantity_per_box: parseInt(quantityPerBox, 10) || 1,
        is_promoted: isPromoted,
      };
      const filesToUpload = pendingImages.map((p) => p.file);
      if (isEdit && product) {
        await updateProduct(product.id, payload);
        if (filesToUpload.length > 0) {
          await uploadProductImages(product.id, filesToUpload);
        }
        router.push("/admin/products");
        router.refresh();
      } else {
        const created = await createProduct(payload);
        if (filesToUpload.length > 0) {
          await uploadProductImages(created.id, filesToUpload);
        }
        router.push("/admin/products");
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
      {!isEdit && (
        <div
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 space-y-3"
          aria-label="Copy from existing product"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Copy from existing product
          </h2>
          <div className="relative" ref={copyDropdownRef}>
            <label htmlFor="copy-search" className="sr-only">
              Search products to copy from
            </label>
            <input
              id="copy-search"
              type="search"
              value={copySearchQuery}
              onChange={(e) => setCopySearchQuery(e.target.value)}
              onFocus={() => copySearchResults.length > 0 && setCopyDropdownVisible(true)}
              placeholder="Search by name or SKU…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              autoComplete="off"
            />
            {copySearchLoading && (
              <p className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                Searching…
              </p>
            )}
            {copyDropdownVisible && copySearchResults.length > 0 && (
              <ul
                className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
                role="listbox"
              >
                {copySearchResults.map((p) => (
                  <li key={p.id} role="option">
                    <button
                      type="button"
                      onClick={() => {
                        setCopySelectedProduct(p);
                        setCopyDropdownVisible(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0].url}
                          alt=""
                          className="w-8 h-8 object-cover rounded flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-600 flex-shrink-0 inline-flex items-center justify-center text-xs text-gray-400">
                          —
                        </span>
                      )}
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto text-sm text-gray-500">${p.price.toFixed(2)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {copySelectedProduct && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
              {copySelectedProduct.images?.[0] ? (
                <img
                  src={copySelectedProduct.images[0].url}
                  alt=""
                  className="w-14 h-14 object-cover rounded-lg"
                  loading="lazy"
                />
              ) : (
                <span className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-600 inline-flex items-center justify-center text-gray-400">
                  —
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {copySelectedProduct.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ${copySelectedProduct.price.toFixed(2)}
                  {copySelectedProduct.category?.name && (
                    <span> · {copySelectedProduct.category.name}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyFromProduct(copySelectedProduct)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:opacity-90"
              >
                Copy from this product
              </button>
              <button
                type="button"
                onClick={() => setCopySelectedProduct(null)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
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
          SKU
        </label>
        <input
          id="sku"
          type="text"
          readOnly
          value={isEdit && product?.sku ? product.sku : "Generated on save"}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-600 dark:text-gray-400 cursor-not-allowed"
          aria-label="SKU (system-generated, read-only)"
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
            <div className="space-y-2">
              <label htmlFor="newCategoryName" className="sr-only">
                Category name
              </label>
              <input
                id="newCategoryName"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory(e as unknown as React.FormEvent);
                  }
                }}
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
                  type="button"
                  disabled={addCategoryLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddCategory(e as unknown as React.FormEvent);
                  }}
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
            </div>
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
            type="text"
            inputMode="decimal"
            required
            value={price}
            onChange={(e) => setPrice(formatPriceInput(e.target.value))}
            placeholder="0.00"
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
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
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
        {pendingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingImages.map((entry, index) => (
              <div key={index} className="relative inline-block">
                <img
                  src={entry.previewUrl}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  role="presentation"
                />
                <button
                  type="button"
                  onClick={() => removePendingImage(index)}
                  className="absolute top-0 right-0 rounded bg-red-600 text-white text-xs px-1.5 py-0.5 hover:bg-red-700"
                  aria-label={`Remove image ${index + 1} from upload list`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        {(isEdit ? existingImages.length + pendingImages.length < 6 : pendingImages.length < 6) && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              const maxNew = 6 - (isEdit ? existingImages.length : 0) - pendingImages.length;
              if (maxNew > 0) addPendingImages(files.slice(0, maxNew));
              e.target.value = "";
            }}
            className="w-full text-sm"
            aria-label="Add images to upload (3–6 total)"
          />
        )}
        {pendingImages.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {pendingImages.length} new file(s) to upload
            {isEdit && existingImages.length > 0 && ` (${existingImages.length} existing)`}. Max 6 total.
          </p>
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
