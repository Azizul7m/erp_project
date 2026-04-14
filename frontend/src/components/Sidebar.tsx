"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { clearAuthToken } from "@/lib/auth";
import type { UserRole } from "@/types/models";

const linksByRole: Record<
  UserRole,
  readonly { href: string; label: string; icon: string; accent: string }[]
> = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: "solar:widget-5-bold-duotone", accent: "from-cyan-500 to-sky-500" },
    { href: "/customers", label: "Customers", icon: "solar:users-group-rounded-bold-duotone", accent: "from-blue-500 to-cyan-500" },
    { href: "/vendors", label: "Vendors", icon: "solar:buildings-2-bold-duotone", accent: "from-indigo-500 to-blue-500" },
    { href: "/employees", label: "Employees", icon: "solar:user-id-bold-duotone", accent: "from-emerald-500 to-teal-500" },
    { href: "/products", label: "Products", icon: "solar:box-bold-duotone", accent: "from-amber-500 to-orange-500" },
    { href: "/orders", label: "Orders", icon: "solar:cart-5-bold-duotone", accent: "from-rose-500 to-orange-500" },
    { href: "/transactions", label: "Transactions", icon: "solar:card-transfer-bold-duotone", accent: "from-violet-500 to-fuchsia-500" },
  ],
  customer: [
    { href: "/dashboard", label: "Dashboard", icon: "solar:widget-5-bold-duotone", accent: "from-cyan-500 to-sky-500" },
    { href: "/products", label: "Products", icon: "solar:box-bold-duotone", accent: "from-amber-500 to-orange-500" },
    { href: "/orders", label: "Orders", icon: "solar:cart-5-bold-duotone", accent: "from-rose-500 to-orange-500" },
  ],
  employee: [
    { href: "/dashboard", label: "Dashboard", icon: "solar:widget-5-bold-duotone", accent: "from-cyan-500 to-sky-500" },
  ],
  vendor: [
    { href: "/dashboard", label: "Dashboard", icon: "solar:widget-5-bold-duotone", accent: "from-cyan-500 to-sky-500" },
    { href: "/products", label: "Products", icon: "solar:box-bold-duotone", accent: "from-amber-500 to-orange-500" },
    { href: "/orders", label: "Orders", icon: "solar:cart-5-bold-duotone", accent: "from-rose-500 to-orange-500" },
  ],
};

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  function logout() {
    clearAuthToken();
    window.location.href = "/login";
  }

  const links = user ? linksByRole[user.role] : [];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-80 flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-[var(--bg-sidebar)] text-[var(--text-sidebar)] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:flex`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(var(--primary-rgb),0.22),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(var(--accent-rgb),0.18),_transparent_30%)]" />
        <div className="relative flex h-full flex-col p-5">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 backdrop-blur-sm ring-1 ring-white/10">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-sky-500/25">
                <Icon icon="solar:buildings-3-bold-duotone" className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <Link href="/dashboard" className="block truncate text-base font-bold tracking-tight text-white">
                  ERP Orbit
                </Link>
                <p className="truncate text-[10px] text-[var(--text-sidebar-muted)]">Operations cockpit</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[var(--text-sidebar-muted)] ring-1 ring-white/10 lg:hidden"
            >
              <Icon icon="solar:close-circle-bold-duotone" className="h-6 w-6" />
            </button>
          </div>

          <nav className="sidebar-scrollbar relative mt-6 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {loading ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-sidebar-muted)]">
                Loading menu…
              </p>
            ) : null}
            {links.map(({ href, label, icon, accent }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                    active
                      ? "border-white/10 bg-white/10 text-white shadow-lg shadow-slate-950/20"
                      : "border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} ${
                      active ? "text-slate-950" : "text-white"
                    } shadow-lg`}
                  >
                    <Icon icon={icon} className="h-6 w-6" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-[var(--text-sidebar-muted)] group-hover:text-slate-300">
                      {href.replace("/", "") || "home"}
                    </span>
                  </span>
                  {active ? <Icon icon="solar:alt-arrow-right-linear" className="h-5 w-5 text-cyan-300" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="relative mt-auto border-t border-white/10 pt-4">
            {user ? (
              <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-2 backdrop-blur-sm">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="group flex flex-1 items-center gap-3 overflow-hidden rounded-xl px-2 py-1.5 transition-colors hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-300 ring-1 ring-white/10 group-hover:ring-cyan-500/30">
                    <Icon icon="solar:user-circle-bold-duotone" className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                    <p className="truncate text-[10px] uppercase tracking-wider text-[var(--text-sidebar-muted)]">
                      {user.role}
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  title="Log out"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/30 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-400 hover:ring-1 hover:ring-rose-500/30"
                >
                  <Icon icon="solar:logout-2-bold-duotone" className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
