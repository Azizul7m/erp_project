"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { MobileNavbar } from "@/components/MobileNavbar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const title = pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/-/g, " ");

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(var(--primary-rgb),0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(var(--accent-rgb),0.08),_transparent_24%)]" />
      <div className="flex min-h-screen pb-20 lg:pb-0">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col lg:pl-80">
          <header className="sticky top-0 z-20 border-b border-[var(--border-main)] bg-[var(--bg-header)] px-5 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 lg:gap-0">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm border border-[var(--border-main)] lg:hidden"
                >
                  <Icon icon="solar:hamburger-menu-bold-duotone" className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400">
                    ERP workspace
                  </p>
                  <h1 className="mt-1 text-xl font-semibold capitalize">
                    {title ?? "dashboard"}
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2 shadow-sm">
                  <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400">
                    <Icon icon="solar:shield-user-bold-duotone" className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{user?.name ?? "Workspace"}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {user?.role ?? "guest"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-5 lg:p-8">{children}</main>
        </div>
      </div>
      <MobileNavbar onMenuClick={() => setIsMobileMenuOpen(true)} />
    </div>
  );
}
