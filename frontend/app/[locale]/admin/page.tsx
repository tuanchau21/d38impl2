import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {t("title")}
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {t("manageDescription")}
      </p>
      <div className="flex gap-3">
        <Link
          href={`/${locale}/admin/products`}
          className="inline-block px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 shadow-sm"
        >
          {t("manageProducts")}
        </Link>
        <Link
          href={`/${locale}/admin/products/new`}
          className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:opacity-90 shadow-sm"
        >
          {t("addProduct")}
        </Link>
      </div>
    </div>
  );
}
