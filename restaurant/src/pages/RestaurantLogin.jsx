import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import RestaurantAuthLayout from "./RestaurantAuthLayout";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function RestaurantLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(`${API_URL}/api/restaurant-auth/login`, formData);
      localStorage.setItem("restaurantToken", response.data.token);
      localStorage.setItem("restaurantProfile", JSON.stringify(response.data.restaurant));
      navigate("/restaurant-dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <RestaurantAuthLayout
      title="Restaurant login"
      subtitle="Orders manage karne, kitchen update dene aur earnings dekhne ke liye apne restaurant account se sign in karein."
      footer={
        <p className="restaurant-auth-switch">
          New restaurant? <Link to="/restaurant-signup">Create account</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="restaurant-auth-form">
        <label>
          Email
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="owner@zestycart.com" required />
        </label>
        <label>
          Password
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" required />
        </label>
        <button type="submit">Login To Restaurant App</button>
      </form>
      {message ? <div className="restaurant-auth-message">{message}</div> : null}
    </RestaurantAuthLayout>
  );
}
