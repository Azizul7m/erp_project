"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import toast from "react-hot-toast";
import Link from "next/link";
import { apiFetch, unwrapList } from "@/lib/api";
import type { Customer, Order, Product } from "@/types/models";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([{ product_id: "", quantity: "1" }]);
  const [query, setQuery] = useState("");
  const canCreateOrders = user?.role === "admin" || user?.role === "customer";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const orderParams = new URLSearchParams();
      if (query.trim()) {
        orderParams.set("q", query.trim());
      }
      const [ordersJson, customersJson, productsJson] = await Promise.all([
        apiFetch<unknown>(`/api/orders${orderParams.size ? `?${orderParams.toString()}` : ""}`),
        canCreateOrders ? apiFetch<unknown>("/api/customers") : Promise.resolve([]),
        apiFetch<unknown>("/api/products"),
      ]);
      setRows(unwrapList<Order>(ordersJson));
      setCustomers(unwrapList<Customer>(customersJson));
      setProducts(unwrapList<Product>(productsJson));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders screen");
      setRows([]);
      setCustomers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [canCreateOrders, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreateOrders) {
      toast.error("You do not have permission to create orders");
      return;
    }
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }

    const normalizedItems = items
      .map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      }))
      .filter((item) => item.product_id > 0 && item.quantity > 0);

    if (normalizedItems.length === 0) {
      toast.error("Add at least one valid order item");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_id: Number(customerId),
          status,
          items: normalizedItems,
        }),
      });
      toast.success("Order created");
      setCustomerId("");
      setStatus("pending");
      setItems([{ product_id: "", quantity: "1" }]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  }

  function updateItem(index: number, key: "product_id" | "quantity", value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [...current, { product_id: "", quantity: "1" }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-main)]">Orders</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            Create orders from customers and products, then inspect the saved order detail.
          </p>
        </div>
      </div>

      {authLoading ? <p className="mt-6 text-[var(--text-muted)]">Loading…</p> : null}
      <div
        className={`mt-6 grid gap-8 ${
          canCreateOrders ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-main)] px-4 py-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order ID, customer, status, or total"
              className="w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
            />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-card)] text-xs font-semibold uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    {query.trim() ? "No orders match your search." : "No orders yet."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-card)]/80">
                    <td className="px-4 py-3 font-mono text-slate-800">{r.id}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {r.customer_id ? customerNameById.get(r.customer_id) ?? `#${r.customer_id}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-main)]">{String(r.total_amount)}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{r.status ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/orders/${r.id}`}
                        className="text-slate-800 underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {canCreateOrders ? (
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--text-main)]">Create order</h3>
          <form onSubmit={createOrder} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="rounded-lg border border-[var(--border-main)] p-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)]">Product *</label>
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(index, "product_id", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} | stock {product.stock} | price {product.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
                    />
                  </div>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-3 text-sm font-medium text-red-600 hover:underline"
                    >
                      Remove item
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="rounded-lg border border-[var(--border-main)] px-4 py-2 text-sm font-medium text-[var(--text-main)] opacity-80"
            >
              Add another item
            </button>

            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create order"}
            </button>
          </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
