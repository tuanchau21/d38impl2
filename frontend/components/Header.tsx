"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/catalog?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/catalog");
    }
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
        <Link href="/" className="font-semibold text-lg text-gray-900 dark:text-white shrink-0">
          Bulk Shoe Shop
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6 flex-1 justify-end flex-wrap">
          <Link
            href="/catalog"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Categories
          </Link>
          <Link
            href="/promotions"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Promotions
          </Link>
          <form onSubmit={handleSearch} role="search" className="flex gap-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search products"
              className="w-28 sm:w-36 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Search
            </button>
          </form>
          <Link
            href="/admin"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Admin
          </Link>
          {/* Placeholders for future: Account, Cart — disabled in v1 (frontend-technical-design §4) */}
          <span className="text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed" title="Coming later">
            Account
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed" title="Coming later">
            Cart
          </span>
        </nav>
      </div>
    </header>
  );
}
