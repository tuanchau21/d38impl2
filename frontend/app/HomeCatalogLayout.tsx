"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { HomeProductList } from "@/app/HomeProductList";
import type { Category } from "@/lib/types";

interface HomeCatalogLayoutProps {
  categories: Category[];
}

/** Categories sorted alphabetically by name. */
function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function HomeCatalogLayout({ categories }: HomeCatalogLayoutProps) {
  const t = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "";

  const setCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
      params.set("page", "1");
    } else {
      params.delete("category");
      params.delete("page");
    }
    if (!params.has("page")) params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const sorted = sortCategories(categories);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left panel — Browse by category (toggles) */}
      <aside className="w-full md:w-56 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t("browseByCategory")}
        </h2>
        <nav aria-label="Filter by category" className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !currentCategory
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {t("all")}
          </button>
          {sorted.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentCategory === c.slug
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Right — Product list (reacts to category via URL) */}
      <div className="flex-1 min-w-0">
        <HomeProductList />
      </div>
    </div>
  );
}
