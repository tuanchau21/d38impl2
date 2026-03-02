"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { useAdminUser } from "./AdminAuthContext";

function navLink(path: string, label: string, active: boolean) {
  return (
    <Link
      href={path}
      className={`block px-3 py-2 rounded-lg ${
        active
          ? "font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAdminUser();
  const locale = pathname?.split("/")[1] ?? "en";
  const base = `/${locale}/admin`;
  const isDashboard = pathname === base;
  const isProducts =
    pathname === `${base}/products` ||
    pathname?.startsWith(`${base}/products/new`) ||
    new RegExp(`^\\/${locale}\\/admin\\/products\\/\\d+\\/edit$`).test(pathname ?? "");
  const isCategories = pathname === `${base}/categories`;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace(`${base}/login`);
      router.refresh();
    } catch (err) {
      console.error("[AdminSidebar] logout failed", err);
      router.replace(`${base}/login`);
    }
  };

  return (
    <aside className="w-56 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0 flex flex-col">
      <nav className="p-4 space-y-1 flex-1">
        {navLink(base, "Dashboard", isDashboard)}
        {navLink(`${base}/products`, "Products", isProducts)}
        {navLink(`${base}/categories`, "Categories", isCategories)}
        {/* Placeholders for future: Orders, Users (admin-high-level-design.md §3) */}
        <span className="block px-3 py-2 text-gray-400 dark:text-gray-500 text-sm">
          Orders (later)
        </span>
        <span className="block px-3 py-2 text-gray-400 dark:text-gray-500 text-sm">
          Users (later)
        </span>
      </nav>
      {user && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={user.email}>
            {user.name || user.email}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
