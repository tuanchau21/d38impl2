import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>© Bulk Shoe Shop. Catalog only — no orders or payments in this version.</span>
        <Link
          href="/admin"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}
