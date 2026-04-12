"use client";

import type { ReactNode } from "react";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";

export default function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { user } = useAuth();

  const title = pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/-/g, " ");

  return (
    <div className="min-h-screen bg-[#eef5ff]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_52%,_#e8f0ff_100%)]" />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 px-5 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                  ERP workspace
                </p>
                <h1 className="mt-1 text-xl font-semibold capitalize text-slate-900">
                  {title ?? "dashboard"}
                </h1>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Icon icon="solar:shield-user-bold-duotone" className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Workspace"}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {user?.role ?? "guest"}
                  </p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-5 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
