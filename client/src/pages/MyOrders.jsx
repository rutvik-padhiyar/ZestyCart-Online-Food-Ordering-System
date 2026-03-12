import React, { useEffect, useState } from "react";
import axios from "axios";
import { Clock3, Package2 } from "lucide-react";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || `${API_BASE}`;

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/order/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-shell">
      <div className="public-section pt-24">
        <section className="public-hero rounded-[36px] px-8 py-10 text-white lg:px-10">
          <div className="public-pill">Order timeline</div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-5xl">Track every order in a polished customer dashboard.</h1>
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
                    const imageUrl = product?.image ? `${API_BASE}/uploads/${product.image}` : `${API_BASE}/uploads/placeholder-restaurant.svg`;

                    return (
                      <div key={item._id} className="rounded-[26px] border border-slate-200 bg-white p-4">
                        <div className="flex gap-4">
                          <img src={imageUrl} alt={product?.name || "Food"} className="h-24 w-24 rounded-2xl object-cover" />
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
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
