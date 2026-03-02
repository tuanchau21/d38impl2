import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Admin
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Manage products and content. No user management in this version.
      </p>
      <div className="flex gap-3">
        <Link
          href="/admin/products"
          className="inline-block px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 shadow-sm"
        >
          Manage products
        </Link>
        <Link
          href="/admin/products/new"
          className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:opacity-90 shadow-sm"
        >
          Add product
        </Link>
      </div>
    </div>
  );
}
