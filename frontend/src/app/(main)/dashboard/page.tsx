"use client";

import { Icon } from "@iconify/react";
import { useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch, unwrapList, unwrapRecord } from "@/lib/api";
import { formatMoney } from "@/lib/employees";
import type { Customer, Employee, Order, Product, Transaction } from "@/types/models";

type Stats = {
  customers: number;
  employees: number;
  products: number;
  orders: number;
  revenue: number;
  income: number;
  expense: number;
  payroll: number;
  lowStock: number;
  orderStatus: { label: string; value: number }[];
  employeesByPosition: { label: string; value: number }[];
  recentTransactions: Transaction[];
  currentEmployee: Employee | null;
  loading: boolean;
};

const initialStats: Stats = {
  customers: 0,
  employees: 0,
  products: 0,
  orders: 0,
  revenue: 0,
  income: 0,
  expense: 0,
  payroll: 0,
  lowStock: 0,
  orderStatus: [],
  employeesByPosition: [],
  recentTransactions: [],
  currentEmployee: null,
  loading: true,
};

function parseMoney(value: number | string | undefined | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: string;
}) {
  return (
    <article className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.25)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}>
          <Icon icon={icon} className="h-7 w-7" />
        </div>
      </div>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.22)] backdrop-blur">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [customersJson, productsJson, ordersJson, transactionsJson, employeesJson, meJson] =
          await Promise.all([
            user?.role === "admin" ? apiFetch<unknown>("/api/customers").catch(() => []) : Promise.resolve([]),
            apiFetch<unknown>("/api/products").catch(() => []),
            apiFetch<unknown>("/api/orders").catch(() => []),
            user?.role === "admin" ? apiFetch<unknown>("/api/transactions").catch(() => []) : Promise.resolve([]),
            user?.role === "admin" ? apiFetch<unknown>("/api/employees").catch(() => []) : Promise.resolve([]),
            user?.role === "employee"
              ? apiFetch<unknown>("/api/employees/me").catch(() => null)
              : Promise.resolve(null),
          ]);

        if (cancelled) {
          return;
        }

        const customers = unwrapList<Customer>(customersJson);
        const products = unwrapList<Product>(productsJson);
        const orders = unwrapList<Order>(ordersJson);
        const transactions = unwrapList<Transaction>(transactionsJson);
        const employees = unwrapList<Employee>(employeesJson);
        const currentEmployee = unwrapRecord<Employee>(meJson);

        const revenue = orders.reduce((sum, order) => sum + parseMoney(order.total_amount), 0);
        const income = transactions
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + parseMoney(item.amount), 0);
        const expense = transactions
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + parseMoney(item.amount), 0);
        const payroll = employees.reduce((sum, item) => sum + parseMoney(item.salary), 0);

        const orderStatusMap = new Map<string, number>();
        for (const order of orders) {
          const label = order.status?.trim() || "Pending";
          orderStatusMap.set(label, (orderStatusMap.get(label) ?? 0) + 1);
        }

        const positionMap = new Map<string, number>();
        for (const employee of employees) {
          const label = employee.position || "Unassigned";
          positionMap.set(label, (positionMap.get(label) ?? 0) + 1);
        }

        setStats({
          customers: customers.length,
          employees: employees.length,
          products: products.length,
          orders: orders.length,
          revenue,
          income,
          expense,
          payroll,
          lowStock: products.filter((product) => product.stock <= 10).length,
          orderStatus: Array.from(orderStatusMap.entries()).map(([label, value]) => ({
            label,
            value,
          })),
          employeesByPosition: Array.from(positionMap.entries()).map(([label, value]) => ({
            label,
            value,
          })),
          recentTransactions: transactions.slice(0, 5),
          currentEmployee,
          loading: false,
        });
      } catch (error) {
        if (!cancelled) {
          setStats((value) => ({ ...value, loading: false }));
          toast.error(error instanceof Error ? error.message : "Could not load dashboard");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const net = stats.income - stats.expense;
  const employeeSalary = parseMoney(stats.currentEmployee?.salary);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[36px] border border-slate-900/5 bg-[#0f172a] px-6 py-7 text-white shadow-[0_28px_100px_-36px_rgba(2,12,27,0.85)] lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
              Modern command center
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight lg:text-4xl">
              {user?.role === "employee"
                ? "Your salary profile and daily ERP access"
                : "Operations, revenue, and payroll in one sharp dashboard"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              {user?.role === "employee"
                ? "Your account is linked to the employee system. Salary is assigned automatically from your registered position."
                : "This layout highlights customers, orders, products, inventory pressure, and the employee salary system from one screen."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Orders value</p>
                <p className="mt-2 text-2xl font-semibold">
                  {stats.loading ? "..." : formatMoney(stats.revenue)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Payroll</p>
                <p className="mt-2 text-2xl font-semibold">
                  {user?.role === "employee"
                    ? stats.loading
                      ? "..."
                      : formatMoney(employeeSalary)
                    : stats.loading
                      ? "..."
                      : formatMoney(stats.payroll)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Inventory alerts</p>
                <p className="mt-2 text-2xl font-semibold">{stats.loading ? "..." : stats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">
                {user?.role === "employee" ? "Employee profile" : "Financial pulse"}
              </p>
              <Icon icon="solar:pulse-2-bold-duotone" className="h-6 w-6 text-cyan-300" />
            </div>
            {user?.role === "employee" ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-950/25 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Position</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {stats.currentEmployee?.position ?? "Pending setup"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/25 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Monthly salary</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {stats.loading ? "..." : formatMoney(employeeSalary)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/25 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hire date</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {stats.currentEmployee?.hire_date
                      ? new Date(stats.currentEmployee.hire_date).toLocaleDateString()
                      : "Pending setup"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-emerald-400/10 px-4 py-3">
                  <span className="text-sm text-emerald-100">Income</span>
                  <span className="font-semibold text-white">{stats.loading ? "..." : formatMoney(stats.income)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-amber-400/10 px-4 py-3">
                  <span className="text-sm text-amber-100">Expense</span>
                  <span className="font-semibold text-white">{stats.loading ? "..." : formatMoney(stats.expense)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-cyan-400/10 px-4 py-3">
                  <span className="text-sm text-cyan-100">Net cash</span>
                  <span className="font-semibold text-white">{stats.loading ? "..." : formatMoney(net)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Customers"
          value={stats.loading ? "..." : String(stats.customers)}
          hint="Registered customer accounts"
          icon="solar:users-group-rounded-bold-duotone"
          tone="from-cyan-500 to-blue-500"
        />
        <MetricCard
          label="Employees"
          value={user?.role === "employee" ? "1" : stats.loading ? "..." : String(stats.employees)}
          hint={user?.role === "employee" ? "Your active employee account" : "Staff records in payroll"}
          icon="solar:user-id-bold-duotone"
          tone="from-emerald-500 to-teal-500"
        />
        <MetricCard
          label="Products"
          value={stats.loading ? "..." : String(stats.products)}
          hint="Items available in catalog"
          icon="solar:box-bold-duotone"
          tone="from-amber-500 to-orange-500"
        />
        <MetricCard
          label="Orders"
          value={stats.loading ? "..." : String(stats.orders)}
          hint="Orders captured in the system"
          icon="solar:cart-5-bold-duotone"
          tone="from-violet-500 to-indigo-500"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title={user?.role === "employee" ? "Salary rules" : "Order distribution"}
          subtitle={
            user?.role === "employee"
              ? "The employee system computes salary from position on signup and admin edits."
              : "Saved order states across the current dataset."
          }
        >
          <div className="space-y-3">
            {(user?.role === "employee" ? [stats.currentEmployee?.position ?? "Pending setup"] : stats.orderStatus.map((item) => item.label)).map(
              (label, index) => {
                const current =
                  user?.role === "employee"
                    ? employeeSalary
                    : stats.orderStatus[index]?.value ?? 0;
                const max =
                  user?.role === "employee"
                    ? Math.max(employeeSalary, 1)
                    : Math.max(...stats.orderStatus.map((item) => item.value), 1);

                return (
                  <div key={label} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="text-slate-500">
                        {user?.role === "employee" ? formatMoney(current) : current}
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-slate-200">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                        style={{ width: `${Math.max((current / max) * 100, 10)}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
            {!stats.loading && user?.role !== "employee" && stats.orderStatus.length === 0 ? (
              <p className="text-sm text-slate-500">No orders are available yet.</p>
            ) : null}
          </div>
        </Panel>

        <Panel
          title={user?.role === "employee" ? "Account summary" : "Employee positions"}
          subtitle={
            user?.role === "employee"
              ? "A quick summary of your registered employee record."
              : "Headcount breakdown generated from employee records."
          }
        >
          {user?.role === "employee" ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Name</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{user?.name}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{user?.email}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Automation</p>
                <p className="mt-2 text-sm text-slate-600">
                  Change the position from admin employee management and the salary updates automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.employeesByPosition.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <Icon icon="solar:case-round-bold-duotone" className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-950">{item.value}</span>
                </div>
              ))}
              {!stats.loading && stats.employeesByPosition.length === 0 ? (
                <p className="text-sm text-slate-500">No employee records are available yet.</p>
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      {user?.role === "admin" ? (
        <Panel
          title="Recent transactions"
          subtitle="Latest recorded money movement from the transactions module."
        >
          <div className="space-y-3">
            {stats.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{transaction.description || "Manual transaction"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(transaction.created_at ?? "").toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{transaction.type}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {formatMoney(parseMoney(transaction.amount))}
                  </p>
                </div>
              </div>
            ))}
            {!stats.loading && stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500">No transactions have been recorded yet.</p>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
