// 📁 src/context/CartContext.jsx
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";


export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const res = await axios.get(`${process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000"}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // ✅ agar cart nahi hai to empty array handle karo
        setCartCount(res.data?.cart?.items?.length || 0);
      } catch (error) {
        // ✅ agar 404 (empty cart) ya koi aur error aaye to 0 set karo
        if (error.response?.status === 404) {
          setCartCount(0);
        } else {
          console.error("❌ Failed to fetch cart count:", error.message);
        }
      }
    } else {
      // ✅ Guest cart
      const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      setCartCount(guestCart.length);
    }
  };

  useEffect(() => {
    fetchCartCount();

    // ✅ Global listener for cart updates
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};
