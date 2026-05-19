import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import DeliveryLogin from "./pages/deliveryLogin";
import DeliverySignup from "./pages/deliverySignup";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("deliveryToken");
  if (!token) return <Navigate to="/delivery-login" replace />;
  return children;
}

function SplashScreen() {
  return (
    <div className="delivery-splash-screen">
      <div className="delivery-splash-card">
        <img src="/zesto.png" alt="ZestyCart" className="delivery-splash-logo" />
        <p className="delivery-auth-kicker">ZestyCart Delivery</p>
        <h1>Rider Command Center</h1>
      </div>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    document.title = "ZestyCart Delivery";
    const timer = window.setTimeout(() => setShowSplash(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/delivery-login" element={<DeliveryLogin />} />
        <Route path="/delivery-signup" element={<DeliverySignup />} />
        <Route
          path="/delivery-dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery-orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/delivery-login" replace />} />
      </Routes>
    </Router>
  );
}
