"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch, unwrapRecord } from "@/lib/api";
import { formatMoney } from "@/lib/employees";
import type { Employee } from "@/types/models";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const loadProfile = async () => {
      try {
        if (user?.role === "employee") {
          const json = await apiFetch<unknown>("/api/employees/me");
          setEmployee(unwrapRecord<Employee>(json));
        }
      } catch (err) {
        console.error("Failed to load employee profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, user?.role]);

  if (authLoading || (loading && user?.role === "employee")) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="relative overflow-hidden rounded-[32px] border border-[var(--border-main)] bg-[var(--bg-hero)] p-8 text-[var(--hero-fg)] shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(var(--primary-rgb),0.15),_transparent_40%)]" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-white/10 text-[var(--primary)] backdrop-blur-md shadow-inner">
            <Icon icon="solar:user-circle-bold-duotone" className="h-16 w-16" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight">{user?.name}</h1>
            <p className="mt-2 inline-flex rounded-full bg-[var(--primary)]/20 px-4 py-1 text-sm font-semibold uppercase tracking-wider text-[var(--primary)] brightness-125">
              {user?.role} Account
            </p>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm opacity-80 sm:justify-start">
              <Icon icon="solar:letter-bold-duotone" className="h-4 w-4" />
              {user?.email}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[32px] border border-[var(--border-main)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
              <Icon icon="solar:shield-user-bold-duotone" className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Account Security</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-[var(--bg-app)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">User ID</p>
              <p className="mt-1 font-mono text-[var(--text-main)]">#{user?.id}</p>
            </div>
            <div className="rounded-2xl bg-[var(--bg-app)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Member Since</p>
              <p className="mt-1 text-[var(--text-main)]">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}
              </p>
            </div>
          </div>
        </section>

        {user?.role === "employee" && employee && (
          <section className="rounded-[32px] border border-[var(--border-main)] bg-[var(--bg-card)] p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Icon icon="solar:case-round-bold-duotone" className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Professional Details</h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-[var(--bg-app)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Position</p>
                <p className="mt-1 text-[var(--text-main)] font-semibold">{employee.position}</p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-app)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Monthly Salary</p>
                <p className="mt-1 text-[var(--text-main)] font-semibold">{formatMoney(employee.salary)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-app)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Hire Date</p>
                <p className="mt-1 text-[var(--text-main)]">
                  {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="rounded-[32px] border border-[var(--border-main)] bg-[var(--bg-card)] p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--text-main)]">Need to update your info?</h3>
        <p className="mt-2 text-[var(--text-muted)]">
          Contact your administrator to change your role, position, or salary details.
        </p>
      </div>
    </div>
  );
}
