"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthMe } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { AdminAuthProvider } from "./AdminAuthContext";

function logError(context: string, err: unknown): void {
  console.error(`[AdminAuthGuard] ${context}`, { error: err });
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAuthMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((err) => {
        if (!cancelled) {
          logError("auth check failed", err);
          const redirect = `/admin/login?redirect=${encodeURIComponent(pathname || "/admin")}`;
          router.replace(redirect);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  return (
    <AdminAuthProvider user={user}>
      {children}
    </AdminAuthProvider>
  );
}
