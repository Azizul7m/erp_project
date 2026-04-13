"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RoleGuard } from "@/components/RoleGuard";
import toast from "react-hot-toast";
import { apiFetch, unwrapList } from "@/lib/api";
import { POSITION_OPTIONS, formatMoney, getSalaryForPosition } from "@/lib/employees";
import type { Employee } from "@/types/models";

type EmployeeForm = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  position: string;
};

const emptyForm: EmployeeForm = {
  name: "",
  email: "",
  phone: "",
  position: POSITION_OPTIONS[0],
};

export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      const json = await apiFetch<unknown>(
        `/api/employees${params.size ? `?${params.toString()}` : ""}`
      );
      setRows(unwrapList<Employee>(json));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load employees");
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

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
  }

  function openEdit(row: Employee) {
    setEditing(row);
    setForm({
      id: row.id,
      name: row.name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      position: row.position ?? POSITION_OPTIONS[0],
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.position.trim()) {
      toast.error("Name, email, and position are required");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone || null,
      position: form.position.trim(),
    };

    try {
      if (form.id) {
        await apiFetch(`/api/employees/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Employee updated");
      } else {
        await apiFetch("/api/employees", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Employee created");
      }
      setEditing(null);
      setForm({ ...emptyForm });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function removeRow(id: number) {
    if (!confirm("Delete this employee?")) return;
    try {
      await apiFetch(`/api/employees/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div>
      {authLoading ? <p className="mb-4 text-[var(--text-muted)]">Loading…</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-main)]">Employees</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your workforce, positions, and salaries.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          New employee
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(260px,360px)]">
        <div className="overflow-hidden rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-sm">
          <div className="border-b border-[var(--border-main)] px-4 py-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or position"
              className="w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
            />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-card)] text-xs font-semibold uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    {query.trim() ? "No employees match your search." : "No employees yet."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-card)]/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-main)]">{r.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{r.position}</td>
                    <td className="px-4 py-3 font-mono text-[var(--text-muted)]">${formatMoney(Number(r.salary))}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="text-[var(--text-main)] opacity-80 underline-offset-2 hover:underline"
                      >
                        Edit
                      </button>
                      <span className="mx-2 text-[var(--border-main)]">|</span>
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

        <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--text-main)]">
            {form.id ? "Edit employee" : "New employee"}
          </h3>
          <form onSubmit={save} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Position *</label>
              <select
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border-main)] px-3 py-2 text-sm"
              >
                {POSITION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <label className="text-xs font-medium text-emerald-700">Auto salary</label>
              <p className="mt-1 text-lg font-semibold text-emerald-900">
                ${formatMoney(getSalaryForPosition(form.position))}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Salary is assigned automatically from the selected position.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
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
                  className="rounded-lg border border-[var(--border-main)] px-4 py-2 text-sm font-medium text-[var(--text-main)] opacity-80"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
      </div>
    </RoleGuard>
  );
}
