"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { UserRole } from "@/types/models";

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [allowedRoles, loading, router, user]);

  if (loading) {
    return <p className="text-slate-600">Loading…</p>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <p className="text-sm text-slate-600">Checking access…</p>;
  }

  return <>{children}</>;
}
