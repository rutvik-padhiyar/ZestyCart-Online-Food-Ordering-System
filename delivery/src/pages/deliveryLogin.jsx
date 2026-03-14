import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function DeliveryLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data } = await axios.post(`${API_URL}/api/delivery-auth/send-otp`, { mobile });
      setMessage(`OTP sent. Demo OTP: ${data.otp}`);
      setStep("otp");
    } catch (error) {
      setMessage(error.response?.data?.message || "OTP send failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data } = await axios.post(`${API_URL}/api/delivery-auth/verify-otp`, { mobile, otp });
      localStorage.setItem("deliveryToken", data.token);
      localStorage.setItem("deliveryPartner", JSON.stringify(data.partner));
      navigate("/delivery-dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delivery-auth-shell">
      <div className="delivery-auth-panel">
        <div className="delivery-phone-preview">
          <div className="delivery-phone-stack delivery-phone-left">
            <div className="delivery-phone-header">Live Orders</div>
            <div className="delivery-phone-chip">OTP Login</div>
            <div className="delivery-phone-stat">Nearby order alerts</div>
          </div>
          <div className="delivery-phone-stack delivery-phone-center">
            <div className="delivery-phone-header">Zesto Rider</div>
            <div className="delivery-phone-map">Current route ready</div>
            <div className="delivery-phone-cta">Go Online</div>
          </div>
          <div className="delivery-phone-stack delivery-phone-right">
            <div className="delivery-phone-header">Earnings</div>
            <div className="delivery-phone-stat">History and payouts</div>
            <div className="delivery-phone-chip">KYC access</div>
          </div>
        </div>

        <div className="delivery-auth-card">
          <p className="delivery-auth-kicker">Zesto Delivery</p>
          <h1>{step === "mobile" ? "Login with mobile OTP" : "Enter verification code"}</h1>
          <p className="delivery-auth-copy">
            Separate rider app on its own port with live orders, earnings, KYC and delivery actions.
          </p>

          {step === "mobile" ? (
            <form onSubmit={handleSendOtp} className="delivery-auth-form">
              <label>
                Mobile Number
                <input
                  type="tel"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  placeholder="10 digit mobile"
                  pattern="[0-9]{10}"
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="delivery-auth-form">
              <label>
                Mobile Number
                <input type="tel" value={mobile} readOnly />
              </label>
              <label>
                OTP Code
                <input
                  type="text"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter OTP"
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {message ? <p className="delivery-auth-message">{message}</p> : null}

          <p className="delivery-auth-switch">
            New partner? <Link to="/delivery-signup">Create delivery account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
