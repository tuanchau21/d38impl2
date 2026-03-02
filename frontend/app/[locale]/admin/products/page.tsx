import Link from "next/link";
import { AdminProductList } from "@/components/admin/AdminProductList";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Products
        </h1>
        <Link
          href={`/${locale}/admin/products/new`}
          className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90"
        >
          New product
        </Link>
      </div>
      <AdminProductList />
    </div>
  );
}
