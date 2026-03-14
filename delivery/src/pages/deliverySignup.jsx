import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function DeliverySignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    vehicleType: "",
    vehicleNumber: "",
    address: "",
    aadhaarNumber: "",
    drivingLicenseNumber: "",
    aadhaarImage: "",
    drivingLicenseImage: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post(`${API_URL}/api/delivery-auth/signup`, formData);
      setMessage("Signup complete. Use OTP login on mobile number.");
      window.setTimeout(() => navigate("/delivery-login"), 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delivery-auth-shell">
      <div className="delivery-auth-card delivery-auth-card-wide">
        <p className="delivery-auth-kicker">Rider Onboarding</p>
        <h1>Create delivery partner profile</h1>
        <p className="delivery-auth-copy">
          Signup, KYC details, vehicle info and pickup-ready delivery profile in one place.
        </p>

        <form className="delivery-grid-form" onSubmit={handleSubmit}>
          {[
            ["name", "Full Name"],
            ["email", "Email"],
            ["mobile", "Mobile"],
            ["password", "Password"],
            ["vehicleType", "Vehicle Type"],
            ["vehicleNumber", "Vehicle Number"],
            ["address", "Current Address"],
            ["aadhaarNumber", "Aadhaar Number"],
            ["drivingLicenseNumber", "Driving License"],
            ["aadhaarImage", "Aadhaar Image URL"],
            ["drivingLicenseImage", "License Image URL"],
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <input
                type={name === "password" ? "password" : "text"}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={["name", "email", "mobile", "vehicleType", "address"].includes(name)}
              />
            </label>
          ))}
          <button type="submit" disabled={loading} className="delivery-grid-submit">
            {loading ? "Creating profile..." : "Create Profile"}
          </button>
        </form>

        {message ? <p className="delivery-auth-message">{message}</p> : null}

        <p className="delivery-auth-switch">
          Already registered? <Link to="/delivery-login">Login with OTP</Link>
        </p>
      </div>
    </div>
  );
}
