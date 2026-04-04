"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { apiFetch, extractToken, getApiBaseUrl } from "@/lib/api";
import { setAuthToken } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      toast.error("Enter a valid email");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);
    try {
      const json = await apiFetch<unknown>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const token = extractToken(json);
      if (!token) {
        toast.error("Login succeeded but no token was returned");
        return;
      }
      setAuthToken(token);
      toast.success("Signed in");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Use your ERP API credentials. API:{" "}
          <span className="font-mono text-slate-700">{getApiBaseUrl()}</span>
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
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
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:text-white px-3 py-2 text-slate-900 outline-none ring-slate-400 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-slate-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
