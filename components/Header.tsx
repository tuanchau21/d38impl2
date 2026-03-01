"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="font-semibold text-lg text-gray-900 dark:text-white">
          Bulk Shoe Shop
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/catalog"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Catalog
          </Link>
          <Link
            href="/promotions"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Promotions
          </Link>
          <Link
            href="/admin"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Admin
          </Link>
          {/* Placeholders for future: Account, Cart — disabled/hidden in v1 */}
        </nav>
      </div>
    </header>
  );
}
