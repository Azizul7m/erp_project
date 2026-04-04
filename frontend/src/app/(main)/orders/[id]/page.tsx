"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { apiFetch, unwrapRecord } from "@/lib/api";
import type { Order } from "@/types/models";

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || Array.isArray(id)) return;
    let cancelled = false;
    (async () => {
      try {
        const json = await apiFetch<unknown>(`/api/orders/${id}`);
        if (!cancelled) setOrder(unwrapRecord<Order>(json));
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Could not load order");
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-slate-600">Loading…</p>;
  }

  if (!order) {
    return (
      <div>
        <Link href="/orders" className="text-sm font-medium text-slate-700 hover:underline">
          ← Back to orders
        </Link>
        <p className="mt-4 text-slate-600">Order not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/orders" className="text-sm font-medium text-slate-700 hover:underline">
        ← Back to orders
      </Link>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">Order #{order.id}</h2>
      <dl className="mt-4 grid max-w-md gap-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
          <dt className="text-slate-500">Customer ID</dt>
          <dd className="font-medium text-slate-900">{order.customer_id ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
          <dt className="text-slate-500">Total</dt>
          <dd className="font-medium text-slate-900">{String(order.total_amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium text-slate-900">{order.status ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-slate-500">Created</dt>
          <dd className="font-medium text-slate-900">
            {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-slate-500">
        {order.items?.length
          ? `Items: ${order.items.map((item) => `${item.quantity} x product #${item.product_id}`).join(", ")}`
          : "No line items returned."}
      </p>
    </div>
  );
}
