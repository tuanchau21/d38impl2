import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CatalogClient } from "./CatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const t = await getTranslations("catalog");
  const tCommon = await getTranslations("common");
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t("title")}
      </h1>
      <Suspense fallback={<p className="text-gray-500 py-8">{tCommon("loading")}</p>}>
        <CatalogClient />
      </Suspense>
    </div>
  );
}
