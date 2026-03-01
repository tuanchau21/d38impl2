import Link from "next/link";
import { Suspense } from "react";
import { getPromoted, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { HomeProductList } from "@/app/HomeProductList";

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
      {/* Hero / banner — inside container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <section className="rounded-xl bg-gray-100 dark:bg-gray-800 p-8 mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bulk Shoe Shop
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Wholesale catalog — browse by category or promotions.
          </p>
          <Link
            href="/catalog"
            className="inline-block mt-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-90"
          >
            View catalog
          </Link>
        </section>
      </div>

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

      {/* Product list below promoted — grid/list, per-page, pagination (§4.1.2) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Suspense fallback={<p className="text-gray-500 py-8">Loading products…</p>}>
          <HomeProductList />
        </Suspense>

        {/* Category shortcuts (§4.1.3) */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Browse by category
          </h2>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/catalog"
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/catalog?category=${encodeURIComponent(c.slug)}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              <Link href="/catalog" className="text-blue-600 dark:text-blue-400 hover:underline">
                View full catalog
              </Link>{" "}
              to filter by category and search.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
