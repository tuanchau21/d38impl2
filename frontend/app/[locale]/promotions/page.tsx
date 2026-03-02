import { getPromoted } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  let promoted: Awaited<ReturnType<typeof getPromoted>> = [];
  try {
    promoted = await getPromoted();
  } catch (err) {
    console.error("[promotions] Failed to load promoted products", { error: err });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Promoted products
      </h1>
      {promoted.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {promoted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No promoted products at the moment.</p>
      )}
    </div>
  );
}
