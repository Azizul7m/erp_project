"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { POSITION_OPTIONS, formatMoney, getSalaryForPosition } from "@/lib/employees";
import { apiFetch, extractToken, getApiBaseUrl, unwrapRecord } from "@/lib/api";
import { setAuthToken } from "@/lib/auth";
import type { User, UserRole } from "@/types/models";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [position, setPosition] = useState(POSITION_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      toast.error("Enter a valid email");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (role === "employee" && !position) {
      toast.error("Position is required for employee signup");
      return;
    }

    setLoading(true);
    try {
      const json = await apiFetch<unknown>("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
          position: role === "employee" ? position : undefined,
        }),
      });
      const token = extractToken(json);
      if (!token) {
        toast.error("Registration succeeded but no token was returned");
        return;
      }
      const user = unwrapRecord<User>(
        typeof json === "object" && json ? (json as { user?: unknown }).user ?? json : null
      );
      setAuthToken(token, user?.role);
      await refreshUser();
      toast.success("Account created");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign up for the ERP workspace. API:{" "}
          <span className="font-mono text-slate-700">{getApiBaseUrl()}</span>
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:text-white outline-none ring-slate-400 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 ">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:text-white outline-none ring-slate-400 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 ">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:text-white outline-none ring-slate-400 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-slate-400 focus:ring-2"
            >
              <option value="customer">Customer</option>
              <option value="employee">Employee</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          {role === "employee" ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <label htmlFor="position" className="block text-sm font-medium text-slate-700">
                Position
              </label>
              <select
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-slate-400 focus:ring-2"
              >
                {POSITION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-sm text-slate-600">
                Monthly salary is assigned automatically from the selected position.
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                Salary: {formatMoney(getSalaryForPosition(position))}
              </p>
            </div>
          ) : null}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:text-white outline-none ring-slate-400 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
