import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const tabConfig = [
  { id: "overview", label: "Dashboard", route: "/restaurant-dashboard" },
  { id: "incoming", label: "Incoming Orders", route: "/restaurant-orders" },
  { id: "kitchen", label: "Kitchen Screen", route: "/restaurant-kitchen" },
  { id: "pickup", label: "Ready for Pickup", route: "/restaurant-pickup" },
  { id: "history", label: "Order History", route: "/restaurant-history" },
  { id: "earnings", label: "Earnings Dashboard", route: "/restaurant-earnings" },
];

export default function RestaurantConsole({ initialTab = "overview" }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("restaurantToken");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [restaurant, setRestaurant] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [earnings, setEarnings] = useState({ summary: { totalSales: 0, completedOrders: 0, readyOrders: 0, activeOrders: 0 } });
  const [insights, setInsights] = useState({
    demandPrediction: [],
    inventoryAlerts: [],
    heatmap: [],
    performanceScore: 0,
    avgOrderValue: 0,
    avgDeliveryMinutes: 0,
    projectedWeeklyRevenue: 0,
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [partnerOrderId, setPartnerOrderId] = useState(null);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [assigningPartnerId, setAssigningPartnerId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const previousLiveOrderIdsRef = useRef(new Set());
  const hasLoadedDashboardRef = useRef(false);

  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!token) {
      navigate("/restaurant-login");
      return undefined;
    }

    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [profileRes, liveRes, historyRes, earningsRes, insightsRes] = await Promise.all([
          axios.get(`${API_URL}/api/restaurant-auth/me`, authConfig),
          axios.get(`${API_URL}/api/restaurant-auth/orders/live`, authConfig),
          axios.get(`${API_URL}/api/restaurant-auth/orders/history`, authConfig),
          axios.get(`${API_URL}/api/restaurant-auth/earnings`, authConfig),
          axios.get(`${API_URL}/api/restaurant-auth/insights`, authConfig),
        ]);

        if (!mounted) return;

        const live = liveRes.data.orders || [];
        const nextLiveIds = new Set(live.map((order) => order._id));
        const newOrders = hasLoadedDashboardRef.current
          ? live.filter((order) => !previousLiveOrderIdsRef.current.has(order._id))
          : [];

        setRestaurant(profileRes.data.restaurant || profileRes.data.account || null);
        setLiveOrders(live);
        setHistoryOrders(historyRes.data.orders || []);
        setEarnings(earningsRes.data || earnings);
        setInsights(insightsRes.data || insights);
        setSelectedOrderId((current) => {
          if (current && live.some((order) => order._id === current)) return current;
          return live[0]?._id || null;
        });

        previousLiveOrderIdsRef.current = nextLiveIds;
        hasLoadedDashboardRef.current = true;

        if (newOrders.length) {
          playOrderAlertTone();
          showOrderAlert("New order received", `${newOrders.length} new order(s) arrived.`);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("restaurantToken");
          localStorage.removeItem("restaurantProfile");
          navigate("/restaurant-login");
        } else if (mounted) {
          setStatusMessage(error.response?.data?.message || "Failed to load restaurant dashboard.");
        }
      }
    };

    loadDashboard();
    const interval = window.setInterval(loadDashboard, 15000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [API_URL, authConfig, navigate, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedOrder = liveOrders.find((order) => order._id === selectedOrderId) || liveOrders[0] || null;

  const metrics = useMemo(() => {
    const incoming = liveOrders.filter((order) => order.restaurantStatus === "new");
    const kitchen = liveOrders.filter((order) => ["accepted", "preparing"].includes(order.restaurantStatus));
    const pickup = liveOrders.filter((order) => order.restaurantStatus === "ready");

    return {
      incoming,
      kitchen,
      pickup,
      active: liveOrders,
    };
  }, [liveOrders]);

  const refreshOrders = async () => {
    const [liveRes, historyRes, earningsRes, insightsRes] = await Promise.all([
      axios.get(`${API_URL}/api/restaurant-auth/orders/live`, authConfig),
      axios.get(`${API_URL}/api/restaurant-auth/orders/history`, authConfig),
      axios.get(`${API_URL}/api/restaurant-auth/earnings`, authConfig),
      axios.get(`${API_URL}/api/restaurant-auth/insights`, authConfig),
    ]);
    const live = liveRes.data.orders || [];
    const nextLiveIds = new Set(live.map((order) => order._id));
    const newOrders = hasLoadedDashboardRef.current
      ? live.filter((order) => !previousLiveOrderIdsRef.current.has(order._id))
      : [];

    setLiveOrders(live);
    setHistoryOrders(historyRes.data.orders || []);
    setEarnings(earningsRes.data || earnings);
    setInsights(insightsRes.data || insights);
    setSelectedOrderId((current) => {
      if (current && live.some((order) => order._id === current)) return current;
      return live[0]?._id || null;
    });

    previousLiveOrderIdsRef.current = nextLiveIds;
    hasLoadedDashboardRef.current = true;

    if (newOrders.length) {
      playOrderAlertTone();
      showOrderAlert("New order received", `${newOrders.length} new order(s) arrived.`);
    }
  };

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(API_URL, { transports: ["websocket"] });
    const handlePlatformUpdate = () => {
      refreshOrders().catch(() => {});
    };
    socket.on("platform:order-updated", handlePlatformUpdate);
    socket.on("newOrder", handlePlatformUpdate);
    return () => {
      socket.off("platform:order-updated", handlePlatformUpdate);
      socket.off("newOrder", handlePlatformUpdate);
      socket.disconnect();
    };
  }, [API_URL, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (orderId) => {
    try {
      await axios.post(`${API_URL}/api/restaurant-auth/orders/${orderId}/action`, { action: "accept" }, authConfig);
      setStatusMessage("Order accepted.");
      await refreshOrders();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to accept order.");
    }
  };

  const handleReject = async (orderId) => {
    try {
      await axios.post(`${API_URL}/api/restaurant-auth/orders/${orderId}/action`, { action: "reject" }, authConfig);
      setStatusMessage("Order rejected.");
      await refreshOrders();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to reject order.");
    }
  };

  const handlePrepare = async (orderId) => {
    try {
      await axios.post(`${API_URL}/api/restaurant-auth/orders/${orderId}/prepare`, {}, authConfig);
      setStatusMessage("Preparation started.");
      await refreshOrders();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to start preparation.");
    }
  };

  const handleReady = async (orderId) => {
    try {
      await axios.post(`${API_URL}/api/restaurant-auth/orders/${orderId}/ready`, {}, authConfig);
      setStatusMessage("Order marked ready for pickup.");
      await refreshOrders();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to mark order ready.");
    }
  };

  const loadPartners = async (orderId) => {
    setLoadingPartners(true);
    setPartnerOrderId(orderId);
    try {
      const response = await axios.get(`${API_URL}/api/restaurant-auth/orders/${orderId}/delivery-partners`, authConfig);
      setDeliveryPartners(response.data.partners || []);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to load nearby delivery partners.");
      setDeliveryPartners([]);
    } finally {
      setLoadingPartners(false);
    }
  };

  const assignPartner = async (orderId, partnerId) => {
    setAssigningPartnerId(partnerId);
    try {
      await axios.post(`${API_URL}/api/restaurant-auth/orders/${orderId}/assign-delivery`, { partnerId }, authConfig);
      setStatusMessage("Delivery boy assigned successfully.");
      setPartnerOrderId(null);
      setDeliveryPartners([]);
      await refreshOrders();
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Failed to assign delivery boy.");
    } finally {
      setAssigningPartnerId("");
    }
  };

  const logout = () => {
    localStorage.removeItem("restaurantToken");
    localStorage.removeItem("restaurantProfile");
    navigate("/restaurant-login");
  };

  function playOrderAlertTone() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startTime = audioContext.currentTime;
      gainNode.gain.exponentialRampToValueAtTime(0.24, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
      oscillator.onended = () => audioContext.close();
    } catch (error) {
      // Silent fallback if audio is blocked
    }
  }

  function showOrderAlert(title, body) {
    setStatusMessage(body);

    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      new Notification(title, {
        body,
        icon: "/zesto.png",
      });
    } catch (error) {
      // Silent fallback if notification is blocked
    }
  }

  return (
    <div className="restaurant-console-shell">
      <aside className="restaurant-console-sidebar">
        <div>
          <img src="/zesto.png" alt="ZestyCart" className="restaurant-brand-logo" />
          <p className="restaurant-auth-kicker">ZestyCart Restaurant</p>
          <h1>{restaurant?.name || "Restaurant Console"}</h1>
          <p className="restaurant-sidebar-copy">
            Client app se aane wale live orders yahin dikh rahe hain. Yahin se accept, prepare, ready aur nearby delivery boy assign hoga.
          </p>
        </div>

        <div className="restaurant-sidebar-stats">
          <div className="restaurant-sidebar-pill">{metrics.incoming.length} New Orders</div>
          <div className="restaurant-sidebar-pill">{metrics.pickup.length} Ready For Pickup</div>
        </div>

        <nav className="restaurant-console-nav">
          {tabConfig.map((tab) => (
            <Link
              key={tab.id}
              to={tab.route}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="restaurant-sidebar-actions">
          <button type="button" onClick={() => selectedOrder && handleAccept(selectedOrder._id)} disabled={!selectedOrder}>
            Quick Accept
          </button>
          <button type="button" onClick={() => selectedOrder && handleReady(selectedOrder._id)} disabled={!selectedOrder}>
            Mark Pickup Ready
          </button>
          <button type="button" className="restaurant-ghost-button" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="restaurant-console-main">
        <section className="restaurant-hero-card">
          <div>
            <p className="restaurant-auth-kicker">Restaurant Application</p>
            <h2>Client orders to kitchen to rider assignment</h2>
            <p>Ready-for-pickup order par nearby available delivery boys ki list milegi, aur restaurant directly best rider choose kar sakta hai.</p>
          </div>
          <div className="restaurant-hero-metrics">
            <MetricCard label="Active Orders" value={String(earnings.summary.activeOrders || metrics.active.length)} />
            <MetricCard label="Kitchen Queue" value={String(metrics.kitchen.length)} />
            <MetricCard label="Total Sales" value={`Rs ${earnings.summary.totalSales || 0}`} />
          </div>
        </section>

        {statusMessage ? <div className="restaurant-auth-message">{statusMessage}</div> : null}

        {activeTab === "overview" ? (
          <section className="restaurant-grid two">
            <Panel title="New Orders Overview">
              {metrics.active.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onSelect={() => setSelectedOrderId(order._id)}
                  onAccept={() => handleAccept(order._id)}
                  onReject={() => handleReject(order._id)}
                />
              ))}
              {!metrics.active.length ? <EmptyState text="Client app se abhi koi active order nahi aaya." /> : null}
            </Panel>
            <Panel title="Order Details">
              {selectedOrder ? (
                <OrderDetailsCard
                  order={selectedOrder}
                  onPrepare={() => handlePrepare(selectedOrder._id)}
                  onReady={() => handleReady(selectedOrder._id)}
                  onPartners={() => loadPartners(selectedOrder._id)}
                />
              ) : (
                <EmptyState text="No order selected." />
              )}
            </Panel>
          </section>
        ) : null}

        {activeTab === "incoming" ? (
          <Panel title="Incoming Order Notifications">
            <div className="restaurant-grid">
              {metrics.incoming.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onSelect={() => setSelectedOrderId(order._id)}
                  onAccept={() => handleAccept(order._id)}
                  onReject={() => handleReject(order._id)}
                />
              ))}
            </div>
            {!metrics.incoming.length ? <EmptyState text="No fresh incoming orders right now." /> : null}
          </Panel>
        ) : null}

        {activeTab === "kitchen" ? (
          <Panel title="Kitchen Preparation Status">
            <div className="restaurant-grid">
              {metrics.kitchen.map((order) => (
                <KitchenCard
                  key={order._id}
                  order={order}
                  onStart={() => handlePrepare(order._id)}
                  onReady={() => handleReady(order._id)}
                />
              ))}
            </div>
            {!metrics.kitchen.length ? <EmptyState text="Kitchen queue clear hai." /> : null}
          </Panel>
        ) : null}

        {activeTab === "pickup" ? (
          <Panel title="Ready for Pickup and Delivery Assignment">
            <div className="restaurant-grid">
              {metrics.pickup.map((order) => (
                <PickupCard
                  key={order._id}
                  order={order}
                  onLoadPartners={() => loadPartners(order._id)}
                />
              ))}
            </div>
            {!metrics.pickup.length ? <EmptyState text="No orders ready for pickup." /> : null}

            {partnerOrderId ? (
              <div className="restaurant-sales-list">
                <div className="restaurant-panel-header">
                  <h3>Available Delivery Boys</h3>
                </div>
                {loadingPartners ? <EmptyState text="Finding nearby delivery boys..." /> : null}
                {!loadingPartners && !deliveryPartners.length ? <EmptyState text="No available nearby delivery boys found." /> : null}
                {deliveryPartners.map((partner) => (
                  <div key={partner._id} className="restaurant-sales-row">
                    <div>
                      <strong>{partner.name}</strong>
                      <p>{partner.vehicleType || "Rider"} • {partner.distanceInKm || 0} km • {partner.completedDeliveries || 0} deliveries</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => assignPartner(partnerOrderId, partner._id)}
                      disabled={assigningPartnerId === partner._id}
                    >
                      {assigningPartnerId === partner._id ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>
        ) : null}

        {activeTab === "history" ? (
          <Panel title="Past Orders">
            <div className="restaurant-grid">
              {historyOrders.map((order) => (
                <HistoryCard key={order._id} order={order} />
              ))}
            </div>
            {!historyOrders.length ? <EmptyState text="No past orders yet." /> : null}
          </Panel>
        ) : null}

        {activeTab === "earnings" ? (
          <Panel title="Sales Report">
            <div className="restaurant-earnings-grid">
              <div className="restaurant-earnings-card">
                <span>Total Sales</span>
                <strong>Rs {earnings.summary.totalSales || 0}</strong>
              </div>
              <div className="restaurant-earnings-card">
                <span>Completed Orders</span>
                <strong>{earnings.summary.completedOrders || 0}</strong>
              </div>
              <div className="restaurant-earnings-card">
                <span>Ready Orders</span>
                <strong>{earnings.summary.readyOrders || 0}</strong>
              </div>
              <div className="restaurant-earnings-card">
                <span>Performance Score</span>
                <strong>{insights.performanceScore || 0}/100</strong>
              </div>
              <div className="restaurant-earnings-card">
                <span>Avg Delivery Time</span>
                <strong>{insights.avgDeliveryMinutes || 0} mins</strong>
              </div>
              <div className="restaurant-earnings-card">
                <span>Projected Revenue</span>
                <strong>Rs {insights.projectedWeeklyRevenue || 0}</strong>
              </div>
            </div>
            <div className="restaurant-sales-list">
              <div className="restaurant-sales-row">
                <div>
                  <strong>AI Demand Prediction</strong>
                  <p>{(insights.demandPrediction || []).map((item) => `${item.name} (${item.demand})`).join(", ") || "No prediction yet"}</p>
                </div>
              </div>
              <div className="restaurant-sales-row">
                <div>
                  <strong>Low Stock Alerts</strong>
                  <p>{(insights.inventoryAlerts || []).map((item) => `${item.name}: ${item.stockQuantity}`).join(", ") || "Inventory healthy"}</p>
                </div>
              </div>
              <div className="restaurant-sales-row">
                <div>
                  <strong>Sales Heatmap</strong>
                  <p>{(insights.heatmap || []).map((item) => `${item.area} (${item.ordersCount})`).join(", ") || "No area data yet"}</p>
                </div>
              </div>
            </div>
            <div className="restaurant-sales-list">
              {historyOrders.map((order) => (
                <div key={order._id} className="restaurant-sales-row">
                  <div>
                    <strong>#{order._id.slice(-8)}</strong>
                    <p>{order.user?.name || "Customer"} • {order.restaurantStatus || order.status}</p>
                  </div>
                  <span>{new Date(order.updatedAt || order.createdAt).toLocaleString("en-IN")}</span>
                  <strong>Rs {order.totalPrice || 0}</strong>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}
      </main>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="restaurant-panel">
      <div className="restaurant-panel-header">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="restaurant-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OrderCard({ order, onAccept, onReject, onSelect }) {
  return (
    <article className="restaurant-order-card">
      <div className="restaurant-order-top">
        <h4>#{order._id.slice(-8)}</h4>
        <span className={`restaurant-status-chip ${order.restaurantStatus}`}>{order.restaurantStatus}</span>
      </div>
      <p>{order.user?.name || "Customer"}</p>
      <p>{(order.foodItems || []).map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
      <p>{order.address}</p>
      <div className="restaurant-order-actions">
        <button type="button" onClick={onSelect} className="restaurant-ghost-button">View Details</button>
        <button type="button" onClick={onAccept}>Accept</button>
        <button type="button" onClick={onReject} className="restaurant-danger-button">Reject</button>
      </div>
    </article>
  );
}

function OrderDetailsCard({ order, onPrepare, onReady, onPartners }) {
  return (
    <article className="restaurant-detail-card">
      <div className="restaurant-order-top">
        <h4>{order.user?.name || "Customer"}</h4>
        <span className={`restaurant-status-chip ${order.restaurantStatus}`}>{order.restaurantStatus}</span>
      </div>
      <p><strong>Order ID:</strong> #{order._id.slice(-8)}</p>
      <p><strong>Address:</strong> {order.address}</p>
      <p><strong>Phone:</strong> {order.mobile}</p>
      <p><strong>Payment:</strong> {order.paymentMethod} / {order.paymentStatus}</p>
      <p><strong>Delivery Boy:</strong> {order.deliveryBoy?.name || "Not assigned yet"}</p>
      <ul className="restaurant-items-list">
        {(order.foodItems || []).map((item) => (
          <li key={`${order._id}-${item.name}`}>{item.name} x {item.quantity}</li>
        ))}
      </ul>
      <div className="restaurant-order-actions">
        {["new", "accepted"].includes(order.restaurantStatus) ? <button type="button" onClick={onPrepare}>Start Preparation</button> : null}
        {["accepted", "preparing"].includes(order.restaurantStatus) ? (
          <button type="button" onClick={onReady} className="restaurant-ghost-button">Ready for Pickup</button>
        ) : null}
        {order.restaurantStatus === "ready" ? (
          <button type="button" onClick={onPartners}>Available Delivery Boy</button>
        ) : null}
      </div>
    </article>
  );
}

function KitchenCard({ order, onStart, onReady }) {
  return (
    <article className="restaurant-order-card">
      <div className="restaurant-order-top">
        <h4>#{order._id.slice(-8)}</h4>
        <span>{order.restaurantStatus}</span>
      </div>
      <p>{(order.foodItems || []).map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
      <p>Customer: {order.user?.name || "Customer"}</p>
      <div className="restaurant-order-actions">
        {order.restaurantStatus === "accepted" ? <button type="button" onClick={onStart}>Move to Kitchen</button> : null}
        <button type="button" onClick={onReady} className="restaurant-ghost-button">Mark Ready</button>
      </div>
    </article>
  );
}

function PickupCard({ order, onLoadPartners }) {
  return (
    <article className="restaurant-order-card">
      <div className="restaurant-order-top">
        <h4>#{order._id.slice(-8)}</h4>
        <span>{order.deliveryBoy?.name ? "Assigned" : "Awaiting Rider"}</span>
      </div>
      <p>{order.user?.name || "Customer"}</p>
      <p>{(order.foodItems || []).length} packed items ready for pickup.</p>
      <p>{order.deliveryBoy?.name ? `Assigned to ${order.deliveryBoy.name}` : "Choose nearest available delivery boy."}</p>
      {!order.deliveryBoy ? (
        <div className="restaurant-order-actions">
          <button type="button" onClick={onLoadPartners}>Available Delivery Boy</button>
        </div>
      ) : null}
    </article>
  );
}

function HistoryCard({ order }) {
  return (
    <article className="restaurant-history-card">
      <h4>#{order._id.slice(-8)}</h4>
      <p>{order.user?.name || "Customer"}</p>
      <p>{order.status === "delivered" ? "Delivered to customer" : "Rejected by restaurant"}</p>
      <strong>Rs {order.totalPrice || 0}</strong>
    </article>
  );
}

function EmptyState({ text }) {
  return <div className="restaurant-empty-state">{text}</div>;
}
