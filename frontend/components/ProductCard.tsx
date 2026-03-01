import Link from "next/link";
import type { Product } from "@/lib/types";

export type ProductCardView = "grid" | "list";

interface ProductCardProps {
  product: Product;
  view?: ProductCardView;
  /** Larger card for promoted strip (e.g. min-w-[280px]) */
  className?: string;
}

export function ProductCard({ product, view = "grid", className }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.url ?? null;
  const priceDisplay = product.discount_percent
    ? (
        product.price *
        (1 - product.discount_percent / 100)
      ).toFixed(2)
    : product.price.toFixed(2);

  const href = `/products/${product.slug || product.id}`;

  if (view === "list") {
    return (
      <Link
        href={href}
        className={`flex gap-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow ${className ?? ""}`}
      >
        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              sizes="96px"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-gray-400 text-xs">
              No image
            </span>
          )}
        </div>
        <div className="p-3 flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{product.sku}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">${priceDisplay}</span>
            {product.discount_percent > 0 && (
              <span className="text-xs text-gray-500 line-through">${product.price.toFixed(2)}</span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {product.quantity_per_box} per box
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`block rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow ${className ?? ""}`}
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
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{product.sku}</p>
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
