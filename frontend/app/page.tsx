import Link from "next/link";
import { Suspense } from "react";
import { getPromoted, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { HomeCatalogLayout } from "@/app/HomeCatalogLayout";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [promoted, categories] = await Promise.all([
    getPromoted().catch((err) => {
      console.error("[home] Failed to load promoted products", { error: err });
      return [];
    }),
    getCategories().catch((err) => {
      console.error("[home] Failed to load categories", { error: err });
      return [];
    }),
  ]);

  return (
    <>
      {/* Promoted products — full-width sector (frontend-technical-design §4.1.1) */}
      <section className="w-full bg-gray-50 dark:bg-gray-800/50 py-6 mb-6">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Promoted products
            </h2>
            <Link
              href="/promotions"
              className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
            >
              View all →
            </Link>
          </div>
          {promoted.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
              {promoted.map((p) => (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-[280px] sm:w-[300px]"
                >
                  <ProductCard product={p} className="h-full" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No promoted products at the moment.
            </p>
          )}
        </div>
      </section>

      {/* Product list + left panel (category toggles); same page, no refresh */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <Suspense fallback={<p className="text-gray-500 py-8">Loading…</p>}>
          <HomeCatalogLayout categories={categories} />
        </Suspense>
      </div>
    </>
  );
}
