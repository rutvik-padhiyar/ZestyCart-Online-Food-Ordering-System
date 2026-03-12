// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const [mobile, setMobile] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!mobile) {
      alert("⚠️ Please enter your mobile number");
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { mobile });
      localStorage.setItem("resetMobile", mobile); // ✅ Store mobile number
      alert("✅ OTP sent to your mobile number");
      navigate("/verify-otp");
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to send OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-20">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">
          Forgot Password
        </h2>
        <input
          type="text"
          placeholder="Enter your registered mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSendOtp}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-semibold transition duration-300"
        >
          Get OTP
        </button>
      </div>
    </div>
  );
}
