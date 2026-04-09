"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch, unwrapList } from "@/lib/api";
import type { Vendor } from "@/types/models";

type VendorForm = {
  id?: number;
  name: string;
  phone: string;
  email: string;
  address: string;
};

const emptyForm: VendorForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

export default function VendorsPage() {
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<unknown>("/api/vendors");
      setRows(unwrapList<Vendor>(json));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load vendors");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
  }

  function openEdit(row: Vendor) {
    setEditing(row);
    setForm({
      id: row.id,
      name: row.name ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    };

    try {
      if (form.id) {
        await apiFetch(`/api/vendors/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Vendor updated");
      } else {
        await apiFetch("/api/vendors", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Vendor created");
      }
      setEditing(null);
      setForm({ ...emptyForm });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function removeRow(id: number) {
    if (!confirm("Delete this vendor?")) return;
    try {
      await apiFetch(`/api/vendors/${id}`, { method: "DELETE" });
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
          <h2 className="text-xl font-semibold text-slate-900">Vendors</h2>
          <p className="mt-1 text-sm text-slate-600">Manage supplier/vendor contacts.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          New vendor
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(260px,360px)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
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
                    No vendors yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.email ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">
            {form.id ? "Edit vendor" : "New vendor"}
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
              <label className="text-xs font-medium text-slate-600">Phone</label>
              <input
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Email</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Address</label>
              <textarea
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Save
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm({ ...emptyForm });
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

