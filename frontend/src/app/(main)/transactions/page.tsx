"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RoleGuard } from "@/components/RoleGuard";
import toast from "react-hot-toast";
import { apiFetch, unwrapList } from "@/lib/api";
import type { Transaction } from "@/types/models";

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      const json = await apiFetch<unknown>(
        `/api/transactions${params.size ? `?${params.toString()}` : ""}`
      );
      setRows(unwrapList<Transaction>(json));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load transactions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== "admin") {
      setLoading(false);
      setRows([]);
      return;
    }
    void load();
  }, [authLoading, load, user?.role]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }

    try {
      await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          type,
          amount: n,
          description: description.trim() || null,
        }),
      });
      toast.success("Transaction recorded");
      setAmount("");
      setDescription("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div>
      {authLoading ? <p className="mb-4 text-[var(--text-muted)]">Loading…</p> : null}
      <h2 className="text-xl font-semibold text-[var(--text-main)]">Transactions</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Income and expense ledger.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(260px,360px)]">
        <div className="overflow-hidden rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-main)] px-4 py-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by type, amount, description, or order ID"
              className="w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
            />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-card)] text-xs font-semibold uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    {query.trim() ? "No transactions match your search." : "No transactions yet."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-card)]/80">
                    <td className="px-4 py-3 capitalize text-[var(--text-main)]">{r.type}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                      {String(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{r.description ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {r.order_id ? (
                        <Link href={`/orders/${r.order_id}`} className="text-slate-800 underline hover:text-[var(--text-muted)]">
                          #{r.order_id}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="h-fit rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--text-main)]">Add entry</h3>
          <form onSubmit={add} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Type</label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "income" | "expense")
                }
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="mt-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Save
            </button>
          </form>
        </div>
      </div>
      </div>
    </RoleGuard>
  );
}
