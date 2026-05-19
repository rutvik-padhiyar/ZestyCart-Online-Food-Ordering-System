import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const tabs = ["overview", "requests", "history", "kyc"];

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("deliveryToken");
  const [tab, setTab] = useState("overview");
  const [partner, setPartner] = useState(null);
  const [nearbyOrders, setNearbyOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [earnings, setEarnings] = useState({ summary: { totalEarnings: 0, completedDeliveries: 0, dailyIncome: 0 } });
  const [kycForm, setKycForm] = useState({
    aadhaarNumber: "",
    drivingLicenseNumber: "",
    vehicleNumber: "",
    aadhaarImage: "",
    drivingLicenseImage: "",
  });
  const [deliveryOtp, setDeliveryOtp] = useState({});
  const [deliveryPhoto, setDeliveryPhoto] = useState({});
  const [statusMessage, setStatusMessage] = useState("");

  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadDashboard = async () => {
    try {
      const [meRes, nearbyRes, assignedRes, historyRes, earningsRes] = await Promise.all([
        axios.get(`${API_URL}/api/delivery-auth/me`, authConfig),
        axios.get(`${API_URL}/api/delivery-auth/orders/nearby`, authConfig),
        axios.get(`${API_URL}/api/delivery-auth/orders/assigned`, authConfig),
        axios.get(`${API_URL}/api/delivery-auth/orders/history`, authConfig),
        axios.get(`${API_URL}/api/delivery-auth/earnings`, authConfig),
      ]);
      const me = meRes.data.partner;
      setPartner(me);
      setKycForm({
        aadhaarNumber: me.aadhaarNumber || "",
        drivingLicenseNumber: me.drivingLicenseNumber || "",
        vehicleNumber: me.vehicleNumber || "",
        aadhaarImage: me.kycDocuments?.aadhaarImage || "",
        drivingLicenseImage: me.kycDocuments?.drivingLicenseImage || "",
      });
      setNearbyOrders(nearbyRes.data.orders || []);
      setAssignedOrders(assignedRes.data.orders || []);
      setHistory(historyRes.data.orders || []);
      setEarnings(earningsRes.data || earnings);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("deliveryToken");
        localStorage.removeItem("deliveryPartner");
        navigate("/delivery-login");
      }
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(loadDashboard, 15000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(API_URL, { transports: ["websocket"] });
    const handlePlatformUpdate = () => {
      loadDashboard();
    };
    socket.on("platform:order-updated", handlePlatformUpdate);
    return () => {
      socket.off("platform:order-updated", handlePlatformUpdate);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateAvailability = async (isAvailable) => {
    await axios.patch(`${API_URL}/api/delivery-auth/availability`, { isAvailable }, authConfig);
    loadDashboard();
  };

  const syncCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage("Geolocation supported nahi hai.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        await axios.patch(
          `${API_URL}/api/delivery-auth/location`,
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            label: "Live rider location",
          },
          authConfig
        );
        setStatusMessage("Current location synced.");
        loadDashboard();
      },
      () => setStatusMessage("Location fetch nahi ho payi."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const respondToOrder = async (orderId, action) => {
    await axios.post(`${API_URL}/api/delivery-auth/orders/${orderId}/respond`, { action }, authConfig);
    loadDashboard();
  };

  const updateStage = async (orderId, stage) => {
    await axios.post(`${API_URL}/api/delivery-auth/orders/${orderId}/stage`, { stage }, authConfig);
    loadDashboard();
  };

  const confirmDelivery = async (orderId) => {
    await axios.post(
      `${API_URL}/api/delivery-auth/orders/${orderId}/confirm-delivery`,
      {
        otp: deliveryOtp[orderId],
        photo: deliveryPhoto[orderId] || "",
      },
      authConfig
    );
    loadDashboard();
  };

  const submitKyc = async (event) => {
    event.preventDefault();
    await axios.patch(`${API_URL}/api/delivery-auth/kyc`, kycForm, authConfig);
    setStatusMessage("KYC details updated.");
    loadDashboard();
  };

  const logout = () => {
    localStorage.removeItem("deliveryToken");
    localStorage.removeItem("deliveryPartner");
    navigate("/delivery-login");
  };

  return (
    <div className="delivery-console-shell">
      <aside className="delivery-console-sidebar">
        <div>
          <p className="delivery-auth-kicker">ZestyCart Rider</p>
          <h1>Delivery Console</h1>
          <p className="delivery-sidebar-copy">OTP login, KYC, live nearby requests, navigation and earnings in one console.</p>
        </div>

        <div className="delivery-sidebar-stats">
          <div className="delivery-sidebar-pill">{partner?.isAvailable ? "Online" : "Offline"}</div>
          <div className="delivery-sidebar-pill">{partner?.kycStatus || "pending"} KYC</div>
        </div>

        <nav className="delivery-console-nav">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={tab === item ? "active" : ""}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="delivery-sidebar-actions">
          <button type="button" onClick={() => updateAvailability(!(partner?.isAvailable))}>
            {partner?.isAvailable ? "Go Offline" : "Go Online"}
          </button>
          <button type="button" onClick={syncCurrentLocation}>Sync Current Location</button>
          <button type="button" onClick={logout} className="delivery-ghost-button">Logout</button>
        </div>

        <Link to="/delivery-orders" className="delivery-sidebar-link">
          Open live orders board
        </Link>
      </aside>

      <main className="delivery-console-main">
        <section className="delivery-hero-card">
          <div>
            <p className="delivery-auth-kicker">Live Command Center</p>
            <h2>{partner?.name || "Delivery Partner"}</h2>
            <p>{partner?.address || "Rider location unavailable"}</p>
          </div>
          <div className="delivery-hero-metrics">
            <MetricCard label="Today Income" value={`Rs ${earnings.summary.dailyIncome || 0}`} />
            <MetricCard label="Total Earnings" value={`Rs ${earnings.summary.totalEarnings || 0}`} />
            <MetricCard label="Completed" value={String(earnings.summary.completedDeliveries || 0)} />
          </div>
        </section>

        {statusMessage ? <div className="delivery-status-banner">{statusMessage}</div> : null}

        {tab === "overview" ? (
          <section className="delivery-grid two">
            <Panel title="Nearby Requests">
              {nearbyOrders.slice(0, 4).map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  compact
                  onAccept={() => respondToOrder(order._id, "accept")}
                  onReject={() => respondToOrder(order._id, "reject")}
                />
              ))}
              {!nearbyOrders.length ? <EmptyState text="No nearby requests right now." /> : null}
            </Panel>
            <Panel title="Assigned Deliveries">
              {assignedOrders.slice(0, 4).map((order) => (
                <AssignedCard
                  key={order._id}
                  order={order}
                  deliveryOtp={deliveryOtp[order._id] || ""}
                  deliveryPhoto={deliveryPhoto[order._id] || ""}
                  onOtpChange={(value) => setDeliveryOtp((current) => ({ ...current, [order._id]: value }))}
                  onPhotoChange={(value) => setDeliveryPhoto((current) => ({ ...current, [order._id]: value }))}
                  onStageChange={updateStage}
                  onConfirmDelivery={confirmDelivery}
                />
              ))}
              {!assignedOrders.length ? <EmptyState text="No active delivery assigned." /> : null}
            </Panel>
          </section>
        ) : null}

        {tab === "requests" ? (
          <Panel title="Nearby Order Notification Queue">
            <div className="delivery-grid">
              {nearbyOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onAccept={() => respondToOrder(order._id, "accept")}
                  onReject={() => respondToOrder(order._id, "reject")}
                />
              ))}
            </div>
            {!nearbyOrders.length ? <EmptyState text="No nearby order notifications." /> : null}
          </Panel>
        ) : null}

        {tab === "history" ? (
          <Panel title="Delivery History">
            <div className="delivery-grid">
              {history.map((order) => (
                <article key={order._id} className="delivery-history-card">
                  <h3>{order.restaurant?.name || "Restaurant"}</h3>
                  <p>{order.restaurant?.city || "City"} • {new Date(order.deliveredAt || order.updatedAt).toLocaleString()}</p>
                  <strong>Rs {order.deliveryEarnings || 0}</strong>
                </article>
              ))}
            </div>
            {!history.length ? <EmptyState text="No completed deliveries yet." /> : null}
          </Panel>
        ) : null}

        {tab === "kyc" ? (
          <Panel title="KYC Verification">
            <form className="delivery-grid-form" onSubmit={submitKyc}>
              {[
                ["aadhaarNumber", "Aadhaar Number"],
                ["drivingLicenseNumber", "Driving License"],
                ["vehicleNumber", "Vehicle Number"],
                ["aadhaarImage", "Aadhaar Image URL"],
                ["drivingLicenseImage", "License Image URL"],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    type="text"
                    value={kycForm[name]}
                    onChange={(event) => setKycForm((current) => ({ ...current, [name]: event.target.value }))}
                  />
                </label>
              ))}
              <button type="submit" className="delivery-grid-submit">Update KYC</button>
            </form>
          </Panel>
        ) : null}
      </main>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="delivery-panel">
      <div className="delivery-panel-header">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="delivery-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OrderCard({ order, onAccept, onReject, compact = false }) {
  const restaurantCoordinates = order.restaurant?.location?.coordinates || [];
  const userCoordinates = order.location?.coordinates || [];
  const navigationLink =
    restaurantCoordinates.length === 2 && userCoordinates.length === 2
      ? `https://www.google.com/maps/dir/${restaurantCoordinates[1]},${restaurantCoordinates[0]}/${userCoordinates[1]},${userCoordinates[0]}`
      : null;

  return (
    <article className={`delivery-order-card ${compact ? "compact" : ""}`}>
      <div className="delivery-order-top">
        <h4>{order.restaurant?.name || "Restaurant"}</h4>
        <span>Rs {order.earningsPreview || 0}</span>
      </div>
      <p>{order.address}</p>
      <p>{(order.foodItems || []).map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
      <div className="delivery-order-actions">
        <button type="button" onClick={onAccept}>Accept</button>
        <button type="button" onClick={onReject} className="delivery-ghost-button">Reject</button>
        {navigationLink ? (
          <a href={navigationLink} target="_blank" rel="noreferrer" className="delivery-link-button">
            Navigate
          </a>
        ) : null}
      </div>
    </article>
  );
}

function AssignedCard({ order, onStageChange, onConfirmDelivery, deliveryOtp, deliveryPhoto, onOtpChange, onPhotoChange }) {
  const restaurantCoordinates = order.restaurant?.location?.coordinates || [];
  const userCoordinates = order.location?.coordinates || [];
  const navigationLink =
    restaurantCoordinates.length === 2 && userCoordinates.length === 2
      ? `https://www.google.com/maps/dir/${restaurantCoordinates[1]},${restaurantCoordinates[0]}/${userCoordinates[1]},${userCoordinates[0]}`
      : null;

  return (
    <article className="delivery-order-card assigned">
      <div className="delivery-order-top">
        <h4>{order.restaurant?.name || "Assigned order"}</h4>
        <span>{order.deliveryStatus}</span>
      </div>
      <p>Pickup: {order.restaurant?.address || "Restaurant location"}</p>
      <p>Drop: {order.address}</p>
      <p>Customer: {order.user?.name || "Guest"}</p>
      <p className="delivery-order-meta">Customer OTP: {order.deliveryConfirmationOtp || "Pending"}</p>
      <div className="delivery-order-actions">
        {order.deliveryStatus === "accepted" ? <button type="button" onClick={() => onStageChange(order._id, "picked")}>Mark Picked</button> : null}
        {order.deliveryStatus === "picked" ? <button type="button" onClick={() => onStageChange(order._id, "on-the-way")}>Start Navigation</button> : null}
        {navigationLink ? (
          <a href={navigationLink} target="_blank" rel="noreferrer" className="delivery-link-button">
            Open Route
          </a>
        ) : null}
      </div>
      {order.deliveryStatus === "on-the-way" ? (
        <div className="delivery-confirm-grid">
          <input type="text" value={deliveryOtp} onChange={(event) => onOtpChange(event.target.value)} placeholder="Enter customer OTP" />
          <input type="text" value={deliveryPhoto} onChange={(event) => onPhotoChange(event.target.value)} placeholder="Photo URL (optional)" />
          <button type="button" onClick={() => onConfirmDelivery(order._id)}>Confirm Delivery</button>
        </div>
      ) : null}
    </article>
  );
}

function EmptyState({ text }) {
  return <div className="delivery-empty-state">{text}</div>;
}
