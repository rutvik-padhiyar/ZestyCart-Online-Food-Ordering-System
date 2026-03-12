// src/pages/EditFood.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function EditFood() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    rating: "",
    address: "",
    category: "",
    deliveryTime: "",
    image: null,
    restaurantId: "",
  });

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/restaurant/all`);
        setRestaurants(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRestaurants();
  }, []);

  // Fetch single food
  useEffect(() => {
    const fetchFood = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BACKEND_URL}/api/admin/foods/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const food = res.data;
        setFormData({
          name: food.name || "",
          price: food.price || "",
          rating: food.rating || "",
          address: food.address || "",
          category: food.category || "",
          deliveryTime: food.deliveryTime || "",
          image: null,
          restaurantId: food.restaurant?._id || "",
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchFood();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.restaurantId) {
      alert("⚠️ Please select a restaurant.");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "restaurantId") data.append("restaurant", value);
      else data.append(key, value);
    });

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BACKEND_URL}/api/admin/foods/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("✅ Food updated successfully!");
      navigate("/admin/foods");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("❌ Something went wrong while updating food.");
    }
  };

  if (loading) return <p className="text-center mt-10 text-white">Loading food details...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0f172a] to-[#1f2937] flex justify-center items-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-2xl space-y-6 text-white"
      >
        <h2 className="text-3xl font-bold text-center">✏️ Edit Food Item</h2>

        <select
          name="restaurantId"
          value={formData.restaurantId}
          onChange={handleChange}
          required
          className="input-field"
        >
          <option value="">🍽️ Select Restaurant</option>
          {restaurants.map((r) => (
            <option value={r._id} key={r._id} className="text-black">
              {r.restaurantName || r.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Food Name"
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            required
          />
          <input
            type="text"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            className="input-field"
            required
          />
          <input
            type="text"
            name="rating"
            placeholder="Rating"
            value={formData.rating}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="text"
            name="deliveryTime"
            placeholder="Delivery Time"
            value={formData.deliveryTime}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="input-file"
        />

        <div className="text-center">
          <button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-3 rounded-full shadow-md hover:scale-105 transition-transform"
          >
            ✏️ Update Food
          </button>
        </div>

        <style>
          {`
            .input-field {
              background: rgba(255, 255, 255, 0.1);
              padding: 0.75rem 1rem;
              border-radius: 1rem;
              border: 1px solid rgba(255, 255, 255, 0.2);
              width: 100%;
              outline: none;
              color: white;
              transition: all 0.3s ease;
            }
            .input-field:focus {
              background: rgba(255,255,255,0.2);
              border-color: #00FFAA;
              box-shadow: 0 0 0 3px rgba(0,255,170,0.3);
            }
            .input-file {
              background-color: white;
              color: black;
              padding: 0.75rem;
              border-radius: 0.75rem;
              width: 100%;
              font-size: 0.875rem;
              border: 1px solid #ccc;
            }
          `}
        </style>
      </form>
    </div>
  );
}
