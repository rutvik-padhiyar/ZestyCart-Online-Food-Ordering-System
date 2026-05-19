import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import RestaurantLogin from "./pages/RestaurantLogin";
import RestaurantSignup from "./pages/RestaurantSignup";
import RestaurantConsole from "./pages/RestaurantConsole";
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("restaurantToken");
  if (!token) {
    return <Navigate to="/restaurant-login" replace />;
  }
  return children;
}

function SplashScreen() {
  return (
    <div className="zesto-splash-screen">
      <div className="zesto-splash-card">
        <img src="/zesto.png" alt="ZestyCart" className="zesto-splash-logo" />
        <p className="zesto-splash-kicker">ZestyCart Restaurant</p>
        <h1>Restaurant Control Room</h1>
      </div>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    document.title = "ZestyCart Restaurant";
    const timer = window.setTimeout(() => setShowSplash(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/restaurant-login" replace />} />
        <Route path="/restaurant-login" element={<RestaurantLogin />} />
        <Route path="/restaurant-signup" element={<RestaurantSignup />} />
        <Route
          path="/restaurant-dashboard"
          element={
            <ProtectedRoute>
              <RestaurantConsole initialTab="overview" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurant-orders"
          element={
            <ProtectedRoute>
              <RestaurantConsole initialTab="incoming" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurant-kitchen"
          element={
            <ProtectedRoute>
              <RestaurantConsole initialTab="kitchen" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurant-pickup"
          element={
            <ProtectedRoute>
              <RestaurantConsole initialTab="pickup" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurant-history"
          element={
            <ProtectedRoute>
              <RestaurantConsole initialTab="history" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurant-earnings"
          element={
            <ProtectedRoute>
              <RestaurantConsole initialTab="earnings" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/restaurant-login" replace />} />
      </Routes>
    </Router>
  );
}
