import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProduct } from "@/lib/api";
import { ImageGallery } from "@/components/ImageGallery";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations("product");
  let product;
  try {
    product = await getProduct(slug);
  } catch (err) {
    console.error("[product] Failed to load product", { slug, error: err });
    notFound();
  }

  if (!product) {
    notFound();
  }

  const priceDisplay = product.discount_percent
    ? (product.price * (1 - product.discount_percent / 100)).toFixed(2)
    : product.price.toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageGallery
          images={product.images ?? []}
          productName={product.name}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {product.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{product.sku}</p>
          {product.is_promoted && (
            <span className="inline-block mt-2 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded">
              {t("promotedBadge")}
            </span>
          )}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">
              ${priceDisplay}
            </span>
            {product.discount_percent > 0 && (
              <span className="text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {product.quantity_per_box} {t("perBox")}
          </p>
          {product.description && (
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              {product.description}
            </p>
          )}
          {/* CTA: placeholder only — Contact or disabled Add to cart until orders exist */}
          <div className="mt-6">
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
              title={t("cartNotAvailable")}
            >
              {t("addToCartLater")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
