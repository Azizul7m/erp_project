"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiFetch, unwrapRecord } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import type { Order } from "@/types/models";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadOrder = async (orderId: string, cancelledRef: { current: boolean }) => {
    try {
      const json = await apiFetch<unknown>(`/api/orders/${orderId}`);
      if (!cancelledRef.current) setOrder(unwrapRecord<Order>(json));
    } catch (e) {
      if (!cancelledRef.current) {
        toast.error(e instanceof Error ? e.message : "Could not load order");
        setOrder(null);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || Array.isArray(id)) return;
    const cancelledRef = { current: false };
    loadOrder(id, cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, [id]);

  async function updateStatus(status: "completed" | "cancelled") {
    if (!id || Array.isArray(id)) return;
    setUpdating(true);
    try {
      await apiFetch(`/api/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast.success(`Order ${status}`);
      // Reload order data
      const cancelledRef = { current: false };
      await loadOrder(id, cancelledRef);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${status} order`);
    } finally {
      setUpdating(false);
    }
  }

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

  const canUpdate = (user?.role === "admin" || user?.role === "customer") && order.status === "pending";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/orders" className="text-sm font-medium text-slate-700 hover:underline">
            ← Back to orders
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Order #{order.id}</h2>
        </div>
        {canUpdate && (
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus("cancelled")}
              disabled={updating}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Cancel Order
            </button>
            <button
              onClick={() => updateStatus("completed")}
              disabled={updating}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Confirm Order
            </button>
          </div>
        )}
      </div>

      <dl className="mt-6 grid max-w-md gap-2 text-sm">
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
