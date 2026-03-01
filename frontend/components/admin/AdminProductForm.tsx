"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProduct, updateProduct, uploadProductImages } from "@/lib/api";
import type { Product } from "@/lib/types";

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

  const opts = { adminKey: adminKey || undefined };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name,
        sku,
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
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
          className="w-full text-sm"
        />
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
