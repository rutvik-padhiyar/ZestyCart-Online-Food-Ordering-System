import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function AddFood() {
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

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/restaurant/all`);
        setRestaurants(res.data);
      } catch (err) {
        console.error("❌ Failed to load restaurants:", err);
      }
    };
    fetchRestaurants();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.restaurantId) {
      alert("⚠️ Please select a restaurant.");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      // ✅ fix: backend 'restaurant' field ko expect karta hai, na ki 'restaurantId'
      if (key === "restaurantId") {
        data.append("restaurant", value); // 👈 Yahi important fix hai!
      } else {
        data.append(key, value);
      }
    });

    try {
      await axios.post(`${BACKEND_URL}/api/food/add`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Food added successfully!");
      setFormData({
        name: "",
        price: "",
        rating: "",
        address: "",
        category: "",
        deliveryTime: "",
        image: null,
        restaurantId: "",
      });
    } catch (err) {
      console.error("❌ Error adding food:", err.response?.data || err.message);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0f172a] to-[#1f2937] flex justify-center items-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-2xl space-y-6 text-white"
      >
        <h2 className="text-3xl font-bold text-center">🍔 Add New Food Item</h2>

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
          required
        />

        <div className="text-center">
          <button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-3 rounded-full shadow-md hover:scale-105 transition-transform"
          >
            ➕ Add Food
          </button>
        </div>

        {/* Custom input styles */}
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
