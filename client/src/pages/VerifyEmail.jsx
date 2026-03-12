// Filename: VerifyEmail.jsx

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);

  // 🔥 Important Fix — Make sure OTP is sent only once
  const sentOnce = useRef(false);

  // ✅ Send OTP on load (but only once)
  useEffect(() => {
    if (sentOnce.current) return; // prevent double execution
    sentOnce.current = true;

    const sendOtp = async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/send-signup-otp`, { email });
        setMessage("✅ OTP sent to your email.");
        setOtpSent(true);
      } catch (err) {
        setMessage(err.response?.data?.message || "Failed to send OTP.");
      }
    };

    if (email) sendOtp();
  }, [email]);

  //  Handle OTP Verification
  const handleVerify = async () => {
    setVerifying(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/verify-signup-otp`, { email, otp });

      //  Get saved signup data
      const savedData = JSON.parse(localStorage.getItem("signupData"));

      // If no saved data found (user refreshed page)
      if (!savedData) {
        setMessage("❌ Signup data missing. Please signup again.");
        return;
      }

      //  Final signup API
      await axios.post(`${BACKEND_URL}/api/auth/signup`, savedData);

      setMessage("🎉 Email verified and signup completed!");
      localStorage.removeItem("signupData");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP verification failed");
    }
    setVerifying(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-20">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
          Email Verification
        </h2>
        <p className="text-gray-700 text-center mb-6">
          OTP will be sent to <strong>{email}</strong>
        </p>

        {message && (
          <div className="text-center text-sm text-blue-700 font-semibold mb-4">
            {message}
          </div>
        )}

        {otpSent && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition duration-300"
            >
              {verifying ? "Verifying..." : "Verify OTP & Signup"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
