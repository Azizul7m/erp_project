"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

    setLoading(true);
    try {
      await apiFetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      toast.success("Reset link sent if account exists");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Forgot Password</h1>
        {submitted ? (
          <div className="mt-6">
            <p className="text-sm text-slate-600">
              If an account with <strong>{email}</strong> exists, we have sent a password reset link to it. 
              Please check your inbox.
            </p>
            <Link
              href="/login"
              className="mt-6 block text-center text-sm font-semibold text-slate-900 hover:underline"
            >
              Back to Sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Enter your email address and we&apos;ll send you a link to reset your password.
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
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
              Remembered your password?{" "}
              <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
