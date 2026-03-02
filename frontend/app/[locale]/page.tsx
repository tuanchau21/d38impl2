import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getPromoted, getCategories } from "@/lib/api";
import { PromotedCarousel } from "@/components/PromotedCarousel";
import { HomeCatalogLayout } from "@/app/HomeCatalogLayout";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
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
              {t("promotedTitle")}
            </h2>
            <Link
              href={`/${locale}/promotions`}
              className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
            >
              {t("viewAll")} →
            </Link>
          </div>
          {promoted.length > 0 ? (
            <PromotedCarousel products={promoted} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              {t("noPromoted")}
            </p>
          )}
        </div>
      </section>

      {/* Product list + left panel (category toggles); same page, no refresh */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <Suspense fallback={<p className="text-gray-500 py-8">{tCommon("loading")}</p>}>
          <HomeCatalogLayout categories={categories} />
        </Suspense>
      </div>
    </>
  );
}
