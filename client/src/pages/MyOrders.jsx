import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Clock3, Package2 } from "lucide-react";
import { io } from "socket.io-client";
import { resolveMediaUrl } from "../utils/media";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/order/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders || []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(API_BASE, { transports: ["websocket"] });
    const handlePlatformUpdate = () => fetchOrders();

    socket.on("platform:order-updated", handlePlatformUpdate);

    return () => {
      socket.off("platform:order-updated", handlePlatformUpdate);
      socket.disconnect();
    };
  }, [token, fetchOrders]);

  return (
    <div className="public-shell">
      <div className="public-section pt-24">
        <section className="public-hero rounded-[36px] px-8 py-10 text-white lg:px-10">
          <div className="public-pill">Order timeline</div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-5xl">Track every order from one place.</h1>
        </section>

        <section className="mt-8 space-y-6">
          {loading ? (
            <div className="public-glass rounded-[28px] px-6 py-10 text-sm text-slate-300">Loading your orders...</div>
          ) : !orders.length ? (
            <div className="public-glass rounded-[28px] px-6 py-10 text-sm text-slate-300">You have no orders yet.</div>
          ) : (
            orders.map((order) => (
              <article key={order._id} className="public-card rounded-[32px] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Order</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">#{order._id.slice(-8)}</h2>
                    <p className="mt-2 text-sm text-slate-500 capitalize">Status: {order.status}</p>
                    <p className="mt-1 text-sm text-slate-500 capitalize">Kitchen: {order.restaurantStatus || "new"}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock3 size={16} />
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </div>
                    <div className="font-semibold text-emerald-700">Total Rs {order.totalPrice || 0}</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {(order.items || []).map((item) => {
                    const product = item.food || item.product;
                    const imageUrl = resolveMediaUrl(product?.image, API_BASE);

                    return (
                      <div key={item._id} className="rounded-[26px] border border-slate-200 bg-white p-4">
                        <div className="flex gap-4">
                          <img
                            src={imageUrl}
                            alt={product?.name || "Food"}
                            className="h-24 w-24 rounded-2xl object-cover"
                            onError={(event) => {
                              event.currentTarget.src = `${API_BASE}/uploads/placeholder-restaurant.svg`;
                            }}
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">{product?.name || "Unknown Item"}</h3>
                            <p className="mt-2 text-sm text-slate-500">Qty: {item.quantity}</p>
                            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                              <Package2 size={15} />
                              Rs {(product?.price || 0) * item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {Array.isArray(order.trackingTimeline) && order.trackingTimeline.length ? (
                  <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Live Tracking</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      {order.trackingTimeline.slice().reverse().map((event) => (
                        <div key={`${order._id}-${event.stage}-${event.at}`} className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                          <span className="capitalize">{event.stage.replace(/_/g, " ")}</span>
                          <span>{new Date(event.at).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
