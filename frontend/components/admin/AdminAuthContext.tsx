"use client";

import { createContext, useContext, useMemo } from "react";
import type { AdminUser } from "@/lib/types";

const AdminAuthContext = createContext<AdminUser | null>(null);

export function useAdminUser(): AdminUser | null {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({
  user,
  children,
}: {
  user: AdminUser | null;
  children: React.ReactNode;
}) {
  const value = useMemo(() => user, [user]);
  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
