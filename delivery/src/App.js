import React from "react";
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

export default function App() {
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
