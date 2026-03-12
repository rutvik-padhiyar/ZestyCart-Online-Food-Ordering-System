// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const mobile = localStorage.getItem("resetMobile"); // ✅ Mobile get
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!newPassword) {
      alert("⚠️ Please enter new password");
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
        mobile,
        newPassword,
      });

      localStorage.removeItem("resetMobile");
      alert("✅ Password reset successful! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "❌ Password reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-20">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">
          Reset Password
        </h2>

        {/* New Password Input */}
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleReset}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold transition duration-300"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}
