"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch, unwrapList } from "@/lib/api";
import type { Customer, Order, Product, Transaction } from "@/types/models";

type Stats = {
  customers: number;
  products: number;
  orders: number;
  revenue: number;
  loading: boolean;
};

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, pRes, oRes, tRes] = await Promise.all([
          apiFetch<unknown>("/api/customers").catch(() => null),
          apiFetch<unknown>("/api/products").catch(() => null),
          apiFetch<unknown>("/api/orders").catch(() => null),
          apiFetch<unknown>("/api/transactions").catch(() => null),
        ]);
        if (cancelled) return;
        const customers = unwrapList<Customer>(cRes);
        const products = unwrapList<Product>(pRes);
        const orders = unwrapList<Order>(oRes);
        unwrapList<Transaction>(tRes);

        const revenue = orders.reduce((sum, o) => {
          const n = Number(o.total_amount);
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);

        setStats({
          customers: customers.length,
          products: products.length,
          orders: orders.length,
          revenue,
          loading: false,
        });
      } catch (e) {
        if (!cancelled) {
          setStats((s) => ({ ...s, loading: false }));
          toast.error(e instanceof Error ? e.message : "Could not load dashboard");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = stats.loading ? "…" : stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
      <p className="mt-1 text-sm text-slate-600">
        Summary counts from your Echo API.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Customers"
          value={stats.loading ? "…" : String(stats.customers)}
        />
        <Card
          title="Products"
          value={stats.loading ? "…" : String(stats.products)}
        />
        <Card
          title="Orders"
          value={stats.loading ? "…" : String(stats.orders)}
        />
        <Card
          title="Revenue (orders)"
          value={stats.loading ? "…" : fmt}
          hint="Sum of order total_amount"
        />
      </div>
    </div>
  );
}
