import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import RestaurantAuthLayout from "./RestaurantAuthLayout";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function RestaurantSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await axios.post(`${API_URL}/api/restaurant-auth/signup`, formData);
      setMessage("Signup successful. Please login to continue.");
      window.setTimeout(() => navigate("/restaurant-login"), 900);
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <RestaurantAuthLayout
      title="Restaurant onboarding"
      subtitle="Delivery app ki tarah restaurant ke liye bhi alag branded console ready hai. Pehle account create kijiye."
      footer={
        <p className="restaurant-auth-switch">
          Already registered? <Link to="/restaurant-login">Go to login</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="restaurant-auth-form">
        <label>
          Restaurant Name
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="ZestyCart Indore" required />
        </label>
        <label>
          Owner Name
          <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Owner name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="restaurant@email.com" required />
        </label>
        <label>
          Phone
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98xxxxxx" required />
        </label>
        <label>
          Password
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create password" required />
        </label>
        <button type="submit">Create Restaurant Account</button>
      </form>
      {message ? <div className="restaurant-auth-message">{message}</div> : null}
    </RestaurantAuthLayout>
  );
}
