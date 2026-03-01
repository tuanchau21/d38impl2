import Link from "next/link";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.url ?? null;
  const priceDisplay = product.discount_percent
    ? (
        product.price *
        (1 - product.discount_percent / 100)
      ).toFixed(2)
    : product.price.toFixed(2);

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="block rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            No image
          </span>
        )}
        {product.is_promoted && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded">
            Promoted
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
          {product.sku}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">${priceDisplay}</span>
          {product.discount_percent > 0 && (
            <span className="text-xs text-gray-500 line-through">${product.price.toFixed(2)}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {product.quantity_per_box} per box
        </p>
      </div>
    </Link>
  );
}
