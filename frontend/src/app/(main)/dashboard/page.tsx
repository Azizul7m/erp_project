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
  income: number;
  expense: number;
  lowStock: number;
  outOfStock: number;
  orderMix: { label: string; value: number; color: string }[];
  stockMix: { label: string; value: number; color: string }[];
  activity: { label: string; orders: number; transactions: number }[];
  loading: boolean;
};

function Card({
  title,
  value,
  hint,
  tone = "slate",
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "slate" | "blue" | "emerald" | "amber";
}) {
  const toneClasses = {
    slate: "border-slate-200 bg-white",
    blue: "border-sky-200 bg-sky-50/80",
    emerald: "border-emerald-200 bg-emerald-50/80",
    amber: "border-amber-200 bg-amber-50/80",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function parseMoney(value: number | string | undefined | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildLastSevenDays() {
  const days: { key: string; label: string }[] = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);

    days.push({
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
    });
  }

  return days;
}

function getDateKey(input?: string): string | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function InfoPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function ProgressList({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${width}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    income: 0,
    expense: 0,
    lowStock: 0,
    outOfStock: 0,
    orderMix: [],
    stockMix: [],
    activity: [],
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
        const transactions = unwrapList<Transaction>(tRes);

        const revenue = orders.reduce(
          (sum, order) => sum + parseMoney(order.total_amount),
          0
        );
        const income = transactions
          .filter((transaction) => transaction.type === "income")
          .reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);
        const expense = transactions
          .filter((transaction) => transaction.type === "expense")
          .reduce((sum, transaction) => sum + parseMoney(transaction.amount), 0);

        const outOfStock = products.filter((product) => product.stock <= 0).length;
        const lowStock = products.filter(
          (product) => product.stock > 0 && product.stock <= 10
        ).length;
        const healthyStock = Math.max(products.length - lowStock - outOfStock, 0);

        const statusMap = new Map<string, number>();
        for (const order of orders) {
          const label = order.status?.trim() || "Pending";
          statusMap.set(label, (statusMap.get(label) ?? 0) + 1);
        }

        const activitySeed = buildLastSevenDays();
        const activityMap = new Map(
          activitySeed.map((entry) => [
            entry.key,
            { label: entry.label, orders: 0, transactions: 0 },
          ])
        );

        for (const order of orders) {
          const key = getDateKey(order.created_at);
          if (!key || !activityMap.has(key)) continue;
          activityMap.get(key)!.orders += 1;
        }

        for (const transaction of transactions) {
          const key = getDateKey(transaction.created_at);
          if (!key || !activityMap.has(key)) continue;
          activityMap.get(key)!.transactions += 1;
        }

        setStats({
          customers: customers.length,
          products: products.length,
          orders: orders.length,
          revenue,
          income,
          expense,
          lowStock,
          outOfStock,
          orderMix: Array.from(statusMap.entries()).map(([label, value], index) => ({
            label,
            value,
            color: ["#0f766e", "#0284c7", "#f59e0b", "#7c3aed", "#ef4444"][index % 5],
          })),
          stockMix: [
            { label: "Healthy stock", value: healthyStock, color: "#16a34a" },
            { label: "Low stock", value: lowStock, color: "#f59e0b" },
            { label: "Out of stock", value: outOfStock, color: "#dc2626" },
          ],
          activity: activitySeed.map((entry) => ({
            label: entry.label,
            orders: activityMap.get(entry.key)?.orders ?? 0,
            transactions: activityMap.get(entry.key)?.transactions ?? 0,
          })),
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

  const netCash = stats.income - stats.expense;
  const financeTotal = stats.income + stats.expense;
  const incomeShare = financeTotal > 0 ? (stats.income / financeTotal) * 100 : 0;
  const activityMax = Math.max(
    1,
    ...stats.activity.map((day) => Math.max(day.orders, day.transactions))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
      <p className="mt-1 text-sm text-slate-600">
        Summary counts and visual snapshots from your ERP data.
      </p>

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 p-6 text-white shadow-lg">
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200/80">
              ERP infographic
            </p>
            <h3 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
              Business pulse at a glance
            </h3>
            <p className="mt-3 max-w-xl text-sm text-slate-200">
              Revenue, cash movement, order activity, and inventory pressure are
              combined into one dashboard view for a faster project demo.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">
                  Revenue
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {stats.loading ? "…" : formatCurrency(stats.revenue)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">
                  Net cash
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {stats.loading ? "…" : formatCurrency(netCash)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">
                  Low stock items
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {stats.loading ? "…" : stats.lowStock + stats.outOfStock}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div>
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>Income vs expense</span>
                <span>{stats.loading ? "…" : `${incomeShare.toFixed(0)}% income`}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${incomeShare}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-950/20 p-4">
                <p className="text-slate-300">Income</p>
                <p className="mt-2 text-xl font-semibold">
                  {stats.loading ? "…" : formatCurrency(stats.income)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/20 p-4">
                <p className="text-slate-300">Expense</p>
                <p className="mt-2 text-xl font-semibold">
                  {stats.loading ? "…" : formatCurrency(stats.expense)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Customers"
          value={stats.loading ? "…" : String(stats.customers)}
          tone="blue"
        />
        <Card
          title="Products"
          value={stats.loading ? "…" : String(stats.products)}
          tone="slate"
        />
        <Card
          title="Orders"
          value={stats.loading ? "…" : String(stats.orders)}
          tone="emerald"
        />
        <Card
          title="Revenue (orders)"
          value={stats.loading ? "…" : formatCurrency(stats.revenue)}
          hint="Sum of order total_amount"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <InfoPanel
            title="7-day activity"
            subtitle="Orders and transactions captured over the last seven days."
          >
            <div className="grid h-72 grid-cols-7 items-end gap-3">
              {stats.activity.map((day) => (
                <div key={day.label} className="flex h-full flex-col items-center justify-end gap-2">
                  <div className="flex h-full w-full items-end justify-center gap-1">
                    <div
                      className="w-4 rounded-t-full bg-sky-500/85"
                      style={{ height: `${(day.orders / activityMax) * 100}%` }}
                      title={`${day.orders} orders`}
                    />
                    <div
                      className="w-4 rounded-t-full bg-emerald-500/85"
                      style={{ height: `${(day.transactions / activityMax) * 100}%` }}
                      title={`${day.transactions} transactions`}
                    />
                  </div>
                  <div className="text-center text-xs text-slate-500">
                    <p>{day.label}</p>
                    <p>{day.orders + day.transactions}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-sky-500/85" />
                Orders
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500/85" />
                Transactions
              </span>
            </div>
          </InfoPanel>
        </div>

        <InfoPanel
          title="Cash split"
          subtitle="Breakdown of recorded income and expense transactions."
        >
          <div className="flex flex-col items-center justify-center">
            <div
              className="flex h-48 w-48 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#10b981 0% ${incomeShare}%, #f59e0b ${incomeShare}% 100%)`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white text-center">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Net
                </span>
                <span className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.loading ? "…" : formatCurrency(netCash)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
              <span className="font-medium text-emerald-800">Income</span>
              <span className="text-emerald-700">
                {stats.loading ? "…" : formatCurrency(stats.income)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
              <span className="font-medium text-amber-800">Expense</span>
              <span className="text-amber-700">
                {stats.loading ? "…" : formatCurrency(stats.expense)}
              </span>
            </div>
          </div>
        </InfoPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoPanel
          title="Order status"
          subtitle="Distribution of order workflow states based on saved records."
        >
          <ProgressList items={stats.orderMix} />
        </InfoPanel>

        <InfoPanel
          title="Inventory health"
          subtitle="Quick stock visibility for product availability and risk."
        >
          <ProgressList items={stats.stockMix} />
        </InfoPanel>
      </div>
    </div>
  );
}
