"use client";

import { usePathname } from "next/navigation";
import { AdminAuthGuard } from "./AdminAuthGuard";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  if (pathname?.endsWith("/admin/login")) {
    return <>{children}</>;
  }
  return (
    <AdminAuthGuard>
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <AdminSidebar />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </AdminAuthGuard>
  );
}
