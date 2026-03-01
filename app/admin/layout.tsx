import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="w-56 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
        <nav className="p-4 space-y-1">
          <Link
            href="/admin"
            className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="block px-3 py-2 rounded-lg font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700"
          >
            Products
          </Link>
          {/* Placeholders for future: Orders, Users */}
          <span className="block px-3 py-2 text-gray-400 dark:text-gray-500 text-sm">
            Orders (later)
          </span>
          <span className="block px-3 py-2 text-gray-400 dark:text-gray-500 text-sm">
            Users (later)
          </span>
        </nav>
      </aside>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
