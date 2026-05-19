import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SidebarLayout from "../../layouts/SidebarLayout";
import "../../styles/admin.css";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";
const socket = io(BACKEND_URL);

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat("en-IN");

const statusTone = {
  paid: "bg-emerald-500/15 text-emerald-700",
  pending: "bg-amber-400/20 text-amber-700",
  failed: "bg-rose-500/15 text-rose-700",
  refunded: "bg-slate-200 text-slate-600",
};

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

const buildFallbackOverview = (summaryData, monthlySeries, ordersData) => {
  const orders = (ordersData || []).map(normalizeOrder);
  const topProductsMap = new Map();

  orders.forEach((order) => {
    order.foodItems.forEach((item) => {
      const current = topProductsMap.get(item.name) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += Number(item.quantity || 0);
      current.revenue += Number(item.price || 0) * Number(item.quantity || 0);
      topProductsMap.set(item.name, current);
    });
  });

  return {
    summary: {
      totalCustomers: summaryData?.totalCustomers || 0,
      totalPartners: summaryData?.totalPartners || 0,
      totalRestaurants: summaryData?.totalRestaurants || 0,
      totalOrders: summaryData?.totalOrders || orders.length,
      todayOrders: orders.filter((order) => {
        const now = new Date();
        const createdAt = new Date(order.createdAt);
        return createdAt.toDateString() === now.toDateString();
      }).length,
      todayRevenue: orders
        .filter((order) => {
          const now = new Date();
          const createdAt = new Date(order.createdAt);
          return createdAt.toDateString() === now.toDateString();
        })
        .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
      weekRevenue: monthlySeries?.slice(-1)?.[0]?.revenue || 0,
      averageOrderValue: orders.length
        ? Number(
            (
              orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0) /
              orders.length
            ).toFixed(2)
          )
        : 0,
      growthRevenue: Number(summaryData?.growthRevenue || 0),
    },
    paymentBreakdown: {
      paid: orders.filter((order) => order.paymentStatus === "paid").length,
      pending: orders.filter((order) => order.paymentStatus === "pending").length,
      failed: orders.filter((order) => order.paymentStatus === "failed").length,
      refunded: orders.filter((order) => order.paymentStatus === "refunded").length,
    },
    statusBreakdown: {
      placed: orders.filter((order) => order.status === "placed").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      assigned: orders.filter((order) => order.status === "assigned").length,
      onTheWay: orders.filter((order) => order.status === "on-the-way").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
    },
    topProducts: Array.from(topProductsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    recentOrders: orders.slice(0, 10).map((order) => ({
      _id: order._id,
      customerName: order.user?.name || "Guest",
      customerEmail: order.user?.email || "",
      amount: order.totalPrice || 0,
      paymentMethod: order.paymentMethod || "COD",
      paymentStatus: order.paymentStatus,
      status: order.status,
      createdAt: order.createdAt,
    })),
    salesSeries:
      monthlySeries?.map((item) => ({
        label: item.month,
        revenue: item.revenue,
        orders: 0,
      })) || [],
  };
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchOverview();

    const handleRefresh = () => fetchOverview(false);
    socket.on("newOrder", handleRefresh);
    return () => socket.off("newOrder", handleRefresh);
  }, []);

  const fetchOverview = async (showLoader = true) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      if (showLoader) setLoading(true);
      setErrorMessage("");

      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/admin/dashboard-overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOverview(data);
        return;
      } catch (overviewError) {
        const [summaryRes, monthlyRes, ordersRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/admin/dashboard-summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/order/monthly-sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/order/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setOverview(
          buildFallbackOverview(summaryRes.data, monthlyRes.data, ordersRes.data.orders)
        );
      }
    } catch (error) {
      console.error("Failed to fetch dashboard overview", error);
      setErrorMessage(
        error.response?.data?.message || "Dashboard data load nahi ho pa raha. Backend login/session check karo."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const paymentChart = useMemo(() => {
    if (!overview?.paymentBreakdown) return [];
    return [
      { name: "Paid", value: overview.paymentBreakdown.paid, color: "#10b981" },
      { name: "Pending", value: overview.paymentBreakdown.pending, color: "#f59e0b" },
      { name: "Failed", value: overview.paymentBreakdown.failed, color: "#f43f5e" },
      { name: "Refunded", value: overview.paymentBreakdown.refunded, color: "#94a3b8" },
    ].filter((item) => item.value > 0);
  }, [overview]);

  const summary = overview?.summary;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {errorMessage && (
          <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {errorMessage}
          </section>
        )}
        <section className="admin-glass rounded-[32px] px-6 py-6 text-white lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="admin-badge bg-white/10 text-amber-200">
                <Sparkles size={14} />
                Operations Overview
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">
                Admin dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Live orders, top selling products, payment status aur revenue details ek hi view mein.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniMetric label="Today Orders" value={numberFormat.format(summary?.todayOrders || 0)} />
              <MiniMetric label="Today Revenue" value={currency.format(summary?.todayRevenue || 0)} />
              <MiniMetric label="Customers" value={numberFormat.format(summary?.totalCustomers || 0)} />
              <MiniMetric label="AOV" value={currency.format(summary?.averageOrderValue || 0)} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<CircleDollarSign size={20} />}
            title="Weekly Revenue"
            value={currency.format(summary?.weekRevenue || 0)}
            helper={`${summary?.growthRevenue || 0}% vs previous week`}
          />
          <StatCard
            icon={<ShoppingBag size={20} />}
            title="Total Orders"
            value={numberFormat.format(summary?.totalOrders || 0)}
            helper={`${numberFormat.format(summary?.todayOrders || 0)} orders today`}
          />
          <StatCard
            icon={<Users size={20} />}
            title="Restaurants"
            value={numberFormat.format(summary?.totalRestaurants || 0)}
            helper={`${numberFormat.format(summary?.totalPartners || 0)} partners onboard`}
          />
          <StatCard
            icon={<CreditCard size={20} />}
            title="Payments Cleared"
            value={numberFormat.format(overview?.paymentBreakdown?.paid || 0)}
            helper={`${numberFormat.format(overview?.paymentBreakdown?.pending || 0)} pending settlements`}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="admin-panel rounded-[30px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Revenue trend
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Last 7 days performance
                </h2>
              </div>
              <div className="admin-badge bg-emerald-500/10 text-emerald-700">
                <TrendingUp size={14} />
                Live refresh enabled
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview?.salesSeries || []}>
                  <defs>
                    <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip formatter={(value) => currency.format(value)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#b45309"
                    strokeWidth={3}
                    fill="url(#adminRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-panel rounded-[30px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Payments
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Payment health
            </h2>
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {paymentChart.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {paymentChart.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {numberFormat.format(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <div className="admin-panel rounded-[30px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Best sellers
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Top selling products
                </h2>
              </div>
              <ArrowUpRight className="text-amber-600" size={18} />
            </div>
            <div className="mt-5 space-y-4">
              {(overview?.topProducts || []).map((product, index) => (
                <div key={product.name} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        #{index + 1} ranked dish
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {product.name}
                      </h3>
                    </div>
                    <div className="rounded-full bg-amber-400/15 px-3 py-2 text-xs font-semibold text-amber-700">
                      {numberFormat.format(product.quantity)} sold
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400"
                      style={{
                        width: `${Math.max(
                          18,
                          ((product.quantity || 0) / (overview?.topProducts?.[0]?.quantity || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Revenue {currency.format(product.revenue || 0)}
                  </p>
                </div>
              ))}

              {!loading && !(overview?.topProducts || []).length && (
                <p className="text-sm text-slate-500">Abhi tak enough sales data available nahi hai.</p>
              )}
            </div>
          </div>

          <div className="admin-panel rounded-[30px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Live feed
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Recent customer orders
                </h2>
              </div>
              <div className="admin-badge bg-slate-100 text-slate-700">
                Auto updates on new order
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(overview?.recentOrders || []).map((order) => (
                <div
                  key={order._id}
                  className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-900">
                        {order.customerName}
                      </h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[order.paymentStatus] || "bg-slate-100 text-slate-700"}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{order.customerEmail}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 lg:min-w-[330px]">
                    <MetricPair label="Amount" value={currency.format(order.amount || 0)} />
                    <MetricPair label="Method" value={order.paymentMethod} />
                    <MetricPair label="Order Status" value={order.status} />
                    <MetricPair label="Customer" value="Live queue" />
                  </div>
                </div>
              ))}

              {!loading && !(overview?.recentOrders || []).length && (
                <p className="text-sm text-slate-500">Recent orders aate hi yahan dikhenge.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </SidebarLayout>
  );
}

function StatCard({ icon, title, value, helper }) {
  return (
    <div className="admin-panel admin-stat-card rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-slate-950 p-3 text-amber-300">{icon}</div>
        <div className="admin-badge bg-emerald-500/10 text-emerald-700">Live</div>
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-semibold text-slate-950">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MetricPair({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
