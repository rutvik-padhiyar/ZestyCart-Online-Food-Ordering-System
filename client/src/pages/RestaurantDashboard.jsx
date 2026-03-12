// 📄 src/pages/RestaurantDashboard.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import MonthlyChart from "../components/MonthlyChart";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function RestaurantDashboard() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    rating: "",
    address: "",
    category: "",
    deliveryTime: "",
    image: null,
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get(`${BACKEND_URL}/api/restaurant/products`);
    setProducts(res.data);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("rating", formData.rating);
    data.append("address", formData.address);
    data.append("category", formData.category);
    data.append("deliveryTime", formData.deliveryTime);
    data.append("image", formData.image);

    try {
      if (editId) {
        await axios.put(`${BACKEND_URL}/api/restaurant/products/${editId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/restaurant/products`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setFormData({
        name: "",
        price: "",
        rating: "",
        address: "",
        category: "",
        deliveryTime: "",
        image: null,
      });
      setEditId(null);
      fetchProducts();
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Something went wrong.");
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      rating: product.rating,
      address: product.address,
      category: product.category || "",
      deliveryTime: product.deliveryTime || "",
      image: null,
    });
    setEditId(product._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${BACKEND_URL}/api/restaurant/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete product.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#ffecd2] via-[#fcb69f] to-[#ffecd2] relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/white-carbon.png')] opacity-20 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-10 text-center drop-shadow-lg">
          🍽️ Partner With Us – Restaurant Dashboard
        </h1>

        {/* 🧾 Product Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl bg-white/60 shadow-2xl backdrop-blur-xl border border-white/20 mb-16"
          encType="multipart/form-data"
        >
          <input name="name" placeholder="Product Name" className="p-4 rounded-lg bg-white border border-gray-300 shadow-inner" value={formData.name} onChange={handleChange} required />
          <input name="price" placeholder="Price" className="p-4 rounded-lg bg-white border border-gray-300 shadow-inner" value={formData.price} onChange={handleChange} required />
          <input name="rating" placeholder="Rating" className="p-4 rounded-lg bg-white border border-gray-300 shadow-inner" value={formData.rating} onChange={handleChange} required />
          <input name="address" placeholder="Address" className="p-4 rounded-lg bg-white border border-gray-300 shadow-inner" value={formData.address} onChange={handleChange} required />
          <input name="category" placeholder="Category (e.g., Pizza, Burger)" className="p-4 rounded-lg bg-white border border-gray-300 shadow-inner" value={formData.category} onChange={handleChange} required />
          <input name="deliveryTime" placeholder="Delivery Time (e.g., 20 min)" className="p-4 rounded-lg bg-white border border-gray-300 shadow-inner" value={formData.deliveryTime} onChange={handleChange} required />
          <input type="file" name="image" accept="image/*" onChange={handleChange} className="p-4 rounded-lg bg-white border border-gray-300 shadow-inner" />

          <button
            type="submit"
            className="col-span-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-lg font-semibold px-6 py-3 rounded-xl shadow-md hover:scale-105 hover:shadow-xl transition-transform"
          >
            {editId ? "Update Product" : "Add Product"}
          </button>
        </form>

        {/* 🍔 Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {products.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl shadow-xl p-3 transition-transform hover:scale-105 hover:shadow-2xl"
            >
              {/* Image */}
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={`${BACKEND_URL}/uploads/${p.image}`}
                  alt={p.name}
                  className="w-full h-52 object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
                <span className="absolute top-2 left-2 bg-white text-gray-700 text-xs px-2 py-1 rounded shadow">
                  Promoted
                </span>
              </div>

              {/* Info */}
              <div className="mt-3 px-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    ⭐ {p.rating}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{p.category}</p>
                <div className="flex justify-between items-center text-sm mt-1 text-gray-700">
                  <span>₹{p.price} for one</span>
                  <span>{p.deliveryTime || "N/A"}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-3 px-1">
                <button
                  className="flex-1 bg-yellow-400 text-black text-sm px-3 py-1 rounded hover:bg-yellow-500 transition"
                  onClick={() => handleEdit(p)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="flex-1 bg-red-600 text-white text-sm px-3 py-1 rounded hover:bg-red-700 transition"
                  onClick={() => handleDelete(p._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>




      </div>
    </div>
  );
}
