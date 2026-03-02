import { Suspense } from "react";
import { CatalogClient } from "./CatalogClient";

export const dynamic = "force-dynamic";

export default function CatalogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Catalog
      </h1>
      <Suspense fallback={<p className="text-gray-500 py-8">Loading catalog…</p>}>
        <CatalogClient />
      </Suspense>
    </div>
  );
}
