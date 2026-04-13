"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { UserRole } from "@/types/models";

const mobileLinks: Record<
  UserRole,
  readonly { href: string; label: string; icon: string }[]
> = {
  admin: [
    { href: "/dashboard", label: "Home", icon: "solar:widget-5-bold-duotone" },
    { href: "/customers", label: "Users", icon: "solar:users-group-rounded-bold-duotone" },
    { href: "/products", label: "Stock", icon: "solar:box-bold-duotone" },
    { href: "/orders", label: "Orders", icon: "solar:cart-5-bold-duotone" },
    { href: "/transactions", label: "Bills", icon: "solar:card-transfer-bold-duotone" },
  ],
  customer: [
    { href: "/dashboard", label: "Home", icon: "solar:widget-5-bold-duotone" },
    { href: "/products", label: "Products", icon: "solar:box-bold-duotone" },
    { href: "/orders", label: "Orders", icon: "solar:cart-5-bold-duotone" },
  ],
  employee: [
    { href: "/dashboard", label: "Home", icon: "solar:widget-5-bold-duotone" },
  ],
  vendor: [
    { href: "/dashboard", label: "Home", icon: "solar:widget-5-bold-duotone" },
    { href: "/products", label: "Products", icon: "solar:box-bold-duotone" },
    { href: "/orders", label: "Orders", icon: "solar:cart-5-bold-duotone" },
  ],
};

export function MobileNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = user ? mobileLinks[user.role] : [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-main)] bg-[var(--bg-header)] px-4 py-2 backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-1 transition-colors ${
                active ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <Icon icon={icon} className="h-6 w-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center gap-1 rounded-2xl px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          <Icon icon="solar:hamburger-menu-bold-duotone" className="h-6 w-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Menu</span>
        </button>
      </div>
    </nav>
  );
}
