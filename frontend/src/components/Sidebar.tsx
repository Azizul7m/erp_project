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

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  function logout() {
    clearAuthToken();
    window.location.href = "/login";
  }

  const links = user ? linksByRole[user.role] : [];

  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col overflow-hidden border-r border-white/60 bg-[#0f172a] text-slate-100 lg:flex">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),_transparent_30%)]" />
      <div className="relative flex h-full flex-col p-5">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25">
              <Icon icon="solar:buildings-3-bold-duotone" className="h-7 w-7" />
            </div>
            <div>
              <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-white">
                ERP Orbit
              </Link>
              <p className="mt-1 text-xs text-slate-400">Operations and payroll cockpit</p>
            </div>
          </div>
        </div>

        <nav className="relative mt-6 flex flex-1 flex-col gap-2">
          {loading ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
              Loading menu…
            </p>
          ) : null}
          {links.map(({ href, label, icon, accent }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
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
                  <span className="block text-xs text-slate-400 group-hover:text-slate-300">
                    {href.replace("/", "") || "home"}
                  </span>
                </span>
                {active ? <Icon icon="solar:alt-arrow-right-linear" className="h-5 w-5 text-cyan-300" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="relative rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
          {user ? (
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                <Icon icon="solar:user-circle-bold-duotone" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{user.role}</p>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-950/60"
          >
            <Icon icon="solar:logout-2-bold-duotone" className="h-5 w-5" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
