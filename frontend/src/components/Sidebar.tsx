"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearAuthToken } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/vendors", label: "Vendors" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/transactions", label: "Transactions" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  function logout() {
    clearAuthToken();
    window.location.href = "/login";
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-700 px-4 py-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          ERP
        </Link>
        <p className="mt-1 text-xs text-slate-400">Defense project</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-700 p-3">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
