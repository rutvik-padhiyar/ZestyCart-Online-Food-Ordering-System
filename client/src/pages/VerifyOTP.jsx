// src/pages/VerifyOTP.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const mobile = localStorage.getItem("resetMobile"); // ✅ Mobile get
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!otp) {
      alert("⚠️ Please enter the OTP");
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, { mobile, otp });
      alert("✅ OTP Verified Successfully!");
      navigate("/reset-password");
    } catch (err) {
      alert(err.response?.data?.message || "❌ OTP verification failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-20">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">
          Verify OTP
        </h2>
        <input
          type="text"
          placeholder="Enter OTP sent to your mobile"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleVerify}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition duration-300"
        >
          Verify OTP
        </button>
      </div>
    </div>
  );
}
