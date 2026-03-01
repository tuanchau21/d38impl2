import Link from "next/link";
import { getPromoted } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let promoted: Awaited<ReturnType<typeof getPromoted>> = [];
  try {
    promoted = await getPromoted();
  } catch (err) {
    console.error("[home] Failed to load promoted products", { error: err });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero / banner */}
      <section className="rounded-xl bg-gray-100 dark:bg-gray-800 p-8 mb-10 text-center">
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

      {/* Promoted products block */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Promoted products
        </h2>
        {promoted.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {promoted.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No promoted products at the moment.</p>
        )}
        <Link
          href="/promotions"
          className="inline-block mt-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
        >
          View all promotions →
        </Link>
      </section>

      {/* Category shortcuts */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Browse by category
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          <Link href="/catalog" className="text-blue-600 dark:text-blue-400 hover:underline">
            View full catalog
          </Link>{" "}
          to filter by category and search.
        </p>
      </section>
    </div>
  );
}
