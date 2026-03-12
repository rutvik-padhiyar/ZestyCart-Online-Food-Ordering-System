import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import * as XLSX from "xlsx";
import { CalendarRange, Download, RefreshCcw, Search, SlidersHorizontal } from "lucide-react";
import SidebarLayout from "../../layouts/SidebarLayout";
import "../../styles/admin.css";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || `${BACKEND_URL}`;
const socket = io(BACKEND_URL);

const orderStatuses = ["placed", "confirmed", "assigned", "picked", "on-the-way", "delivered", "rejected"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];
const paymentMethods = ["COD", "Online"];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const todayString = () => new Date().toISOString().slice(0, 10);

const normalizeOrder = (order) => ({
  ...order,
  foodItems:
    order.foodItems?.length
      ? order.foodItems
      : (order.items || []).map((item) => ({
          name: item.food?.name || "Food Item",
          price: item.food?.price || 0,
          quantity: item.quantity || 0,
        })),
  paymentStatus:
    order.paymentStatus || (order.paymentMethod === "Online" ? "paid" : "pending"),
});

const applyClientFilters = (orders, currentFilters) => {
  return orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    const orderDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());

    if (currentFilters.from) {
      const fromDate = new Date(currentFilters.from);
      if (orderDate < fromDate) return false;
    }

    if (currentFilters.to) {
      const toDate = new Date(currentFilters.to);
      if (orderDate > toDate) return false;
    }

    if (currentFilters.status && order.status !== currentFilters.status) return false;
    if (currentFilters.paymentStatus && order.paymentStatus !== currentFilters.paymentStatus) return false;
    if (currentFilters.paymentMethod && order.paymentMethod !== currentFilters.paymentMethod) return false;

    if (currentFilters.search) {
      const needle = currentFilters.search.toLowerCase();
      const haystack = [
        order.user?.name || "",
        order.user?.email || "",
        ...(order.foodItems || []).map((item) => item.name || ""),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: todayString(),
    to: todayString(),
    status: "",
    paymentStatus: "",
    paymentMethod: "",
    search: "",
  });
  const [draftFilters, setDraftFilters] = useState({
    from: todayString(),
    to: todayString(),
    status: "",
    paymentStatus: "",
    paymentMethod: "",
    search: "",
  });
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    fetchOrders();
    const refreshOrders = () => fetchOrders(false, filtersRef.current);
    socket.on("newOrder", refreshOrders);
    return () => socket.off("newOrder", refreshOrders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async (showLoader = true, currentFilters = filters) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      if (showLoader) setLoading(true);
      const { data } = await axios.get(`${BACKEND_URL}/api/order/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: currentFilters,
      });
      const normalized = (data.orders || []).map(normalizeOrder);
      setOrders(applyClientFilters(normalized, currentFilters));
    } catch (error) {
      console.error("Failed to fetch admin orders", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const applyQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const nextFilters = {
      ...draftFilters,
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };

    setDraftFilters(nextFilters);
    setFilters(nextFilters);
    fetchOrders(true, nextFilters);
  };

  const handleFilterChange = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    fetchOrders(true, draftFilters);
  };

  const handleUpdate = async (orderId, payload) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.patch(`${BACKEND_URL}/api/order/update-status/${orderId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders(false);
    } catch (error) {
      console.error("Failed to update order", error);
    }
  };

  const downloadOrders = () => {
    const exportRows = orders.map((order) => ({
      Customer: order.user?.name || "Guest",
      Email: order.user?.email || "",
      Restaurant: order.restaurant?.name || "",
      Items: (order.foodItems || []).map((item) => `${item.name} x${item.quantity}`).join(", "),
      Quantity: (order.foodItems || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      Amount: order.totalPrice || 0,
      PaymentMethod: order.paymentMethod || "COD",
      PaymentStatus: order.paymentStatus || "pending",
      Status: order.status,
      OrderedAt: new Date(order.createdAt).toLocaleString("en-IN"),
      Address: order.address,
      Mobile: order.mobile,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, `admin-orders-${filters.from}-to-${filters.to}.xlsx`);
  };

  const summary = useMemo(() => {
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    return {
      totalOrders: orders.length,
      totalAmount,
      paid: orders.filter((order) => order.paymentStatus === "paid").length,
      pending: orders.filter((order) => order.paymentStatus === "pending").length,
    };
  }, [orders]);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <section className="admin-glass rounded-[32px] px-6 py-6 text-white lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="admin-badge bg-white/10 text-amber-200">
                <SlidersHorizontal size={14} />
                All Orders Workspace
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">
                Date-wise order control room
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Default view aaj ke orders dikhata hai. Quick range choose karke last 7 ya 20 din ke orders export aur manage kiye ja sakte hain.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:min-w-[430px]">
              <SummaryPill label="Orders" value={summary.totalOrders} />
              <SummaryPill label="Revenue" value={formatCurrency(summary.totalAmount)} />
              <SummaryPill label="Paid" value={summary.paid} />
              <SummaryPill label="Pending" value={summary.pending} />
            </div>
          </div>
        </section>

        <section className="admin-panel rounded-[30px] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6 xl:flex-1">
              <FilterField
                label="From"
                value={draftFilters.from}
                onChange={(value) => handleFilterChange("from", value)}
                type="date"
              />
              <FilterField
                label="To"
                value={draftFilters.to}
                onChange={(value) => handleFilterChange("to", value)}
                type="date"
              />
              <SelectField
                label="Status"
                value={draftFilters.status}
                options={orderStatuses}
                onChange={(value) => handleFilterChange("status", value)}
              />
              <SelectField
                label="Payment Status"
                value={draftFilters.paymentStatus}
                options={paymentStatuses}
                onChange={(value) => handleFilterChange("paymentStatus", value)}
              />
              <SelectField
                label="Method"
                value={draftFilters.paymentMethod}
                options={paymentMethods}
                onChange={(value) => handleFilterChange("paymentMethod", value)}
              />
              <FilterField
                label="Search"
                value={draftFilters.search}
                onChange={(value) => handleFilterChange("search", value)}
                placeholder="Customer or item"
                icon={<Search size={16} />}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <QuickButton onClick={() => applyQuickRange(1)} label="Today" />
              <QuickButton onClick={() => applyQuickRange(7)} label="Last 7 Days" />
              <QuickButton onClick={() => applyQuickRange(20)} label="Last 20 Days" />
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              >
                <RefreshCcw size={16} />
                Apply
              </button>
              <button
                type="button"
                onClick={downloadOrders}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </section>

        <section className="admin-panel admin-scrollbar overflow-hidden rounded-[30px]">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Filtered results
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Orders table
              </h2>
            </div>
            <div className="admin-badge bg-slate-100 text-slate-700">
              <CalendarRange size={14} />
              {filters.from} to {filters.to}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1300px] w-full">
              <thead className="bg-slate-950 text-left text-xs uppercase tracking-[0.2em] text-slate-300">
                <tr>
                  {[
                    "Customer",
                    "Restaurant",
                    "Items",
                    "Amount",
                    "Payment",
                    "Payment Status",
                    "Order Status",
                    "Date",
                    "Action",
                  ].map((heading) => (
                    <th key={heading} className="px-6 py-4 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {orders.map((order) => (
                  <tr key={order._id} className="align-top hover:bg-amber-50/35">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">{order.user?.name || "Guest"}</p>
                      <p className="mt-1 text-sm text-slate-500">{order.user?.email || "No email"}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {order.mobile}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-700">
                      {order.restaurant?.name || "Restaurant"}
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        {(order.foodItems || []).map((item, index) => (
                          <div key={`${order._id}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {item.name} x{item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="px-6 py-5">
                      <select
                        value={order.paymentMethod || "COD"}
                        onChange={(event) => handleUpdate(order._id, { paymentMethod: event.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                      >
                        {paymentMethods.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <select
                        value={order.paymentStatus || "pending"}
                        onChange={(event) => handleUpdate(order._id, { paymentStatus: event.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <select
                        value={order.status}
                        onChange={(event) => handleUpdate(order._id, { status: event.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-5">
                      <div className="rounded-[22px] bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">Delivery address</p>
                        <p className="mt-2 line-clamp-3">{order.address}</p>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-sm text-slate-500">
                      Selected date range ke liye koi order nahi mila.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SidebarLayout>
  );
}

function FilterField({ label, value, onChange, placeholder, type = "text", icon }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-400 ${
            icon ? "pl-10" : ""
          }`}
        />
      </div>
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-400"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuickButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
    >
      {label}
    </button>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
