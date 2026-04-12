"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import toast from "react-hot-toast";
import { apiFetch, unwrapList } from "@/lib/api";
import type { Product } from "@/types/models";

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: 0, name: "", price: "", stock: "" });
  const [query, setQuery] = useState("");
  const canManageProducts = user?.role === "admin" || user?.role === "vendor";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      const json = await apiFetch<unknown>(
        `/api/products${params.size ? `?${params.toString()}` : ""}`
      );
      setRows(unwrapList<Product>(json));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load products");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({ id: 0, name: "", price: "", stock: "" });
  }

  function openEdit(row: Product) {
    setForm({
      id: row.id,
      name: row.name ?? "",
      price: String(row.price ?? ""),
      stock: String(row.stock ?? ""),
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageProducts) {
      toast.error("You do not have permission to manage products");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Stock must be a non-negative integer");
      return;
    }

    const payload = { name: form.name.trim(), price, stock };

    try {
      if (form.id) {
        await apiFetch(`/api/products/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Product updated");
      } else {
        await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Product created");
      }
      openCreate();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function removeRow(id: number) {
    if (!canManageProducts) {
      toast.error("You do not have permission to delete products");
      return;
    }
    if (!confirm("Delete this product?")) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Products</h2>
          <p className="mt-1 text-sm text-slate-600">
            {canManageProducts
              ? "Price and stock with validation."
              : "Read-only product catalog for your role."}
          </p>
        </div>
        {canManageProducts ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New product
          </button>
        ) : null}
      </div>

      {authLoading ? <p className="mt-6 text-slate-600">Loading…</p> : null}
      <div
        className={`mt-6 grid gap-8 ${
          canManageProducts ? "lg:grid-cols-[1fr_minmax(260px,360px)]" : ""
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, price, or stock"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    {query.trim() ? "No products match your search." : "No products yet."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-slate-600">{String(r.price)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.stock}</td>
                    <td className="px-4 py-3 text-right">
                      {canManageProducts ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="text-slate-700 underline-offset-2 hover:underline"
                          >
                            Edit
                          </button>
                          <span className="mx-2 text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => removeRow(r.id)}
                            className="text-red-600 underline-offset-2 hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400">Read only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {canManageProducts ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">
            {form.id ? "Edit product" : "New product"}
          </h3>
          <form onSubmit={save} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Stock *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Save
            </button>
          </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
