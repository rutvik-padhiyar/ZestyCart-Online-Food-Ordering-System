import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCart = async () => {
    if (token) {
      try {
        const response = await axios.get(`${API_BASE}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCart(response.data.cart);
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
    setCart({ items: guestCart });
    setLoading(false);
  };

  const updateQuantity = async (productId, change) => {
    if (!token) return;

    try {
      const updatedItems = cart.items.map((item) => {
        if (item.product._id === productId) {
          return { ...item, quantity: Math.max(1, item.quantity + change) };
        }
        return item;
      });

      setCart({ ...cart, items: updatedItems });

      await axios.put(
        `${API_BASE}/api/cart/update`,
        {
          productId,
          quantity: updatedItems.find((item) => item.product._id === productId).quantity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`${API_BASE}/api/cart/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Failed to remove item:", error.response?.data || error.message);
    }
  };

  const getTotalPrice = () =>
    cart?.items?.reduce((total, item) => total + Number(item.product?.price || 0) * Number(item.quantity || 0), 0) || 0;

  if (loading) {
    return <div className="public-shell flex min-h-screen items-center justify-center text-slate-200">Loading your cart...</div>;
  }

  return (
    <div className="public-shell">
      <ToastContainer />
      <div className="public-section pt-24">
        <section className="public-hero rounded-[36px] px-8 py-10 text-white lg:px-10">
          <div className="public-pill">Cart review</div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-5xl">Review your premium food selection before checkout.</h1>
        </section>

        {!cart?.items?.length ? (
          <section className="mt-8 public-glass rounded-[32px] px-6 py-12 text-center text-slate-300">
            Your cart is empty.
          </section>
        ) : (
          <section className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              {cart.items.map((item) => (
                <article key={item._id || item.product?._id} className="public-card rounded-[32px] p-5">
                  <div className="flex flex-col gap-5 md:flex-row">
                    <img
                      src={`${API_BASE}/uploads/${item.product?.image || "placeholder-restaurant.svg"}`}
                      alt={item.product?.name}
                      className="h-36 w-full rounded-[24px] object-cover md:w-44"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold text-slate-950">{item.product?.name}</h2>
                          <p className="mt-2 text-sm text-slate-500">{item.product?.address || "Restaurant item"}</p>
                        </div>
                        <button type="button" onClick={() => removeItem(item._id)} className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => updateQuantity(item.product._id, -1)} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <Minus size={16} />
                          </button>
                          <span className="min-w-[42px] text-center text-lg font-semibold text-slate-950">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.product._id, 1)} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Item total</p>
                          <p className="mt-1 text-2xl font-semibold text-emerald-700">
                            Rs {(item.product?.price || 0) * item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="public-card rounded-[32px] p-6">
              <div className="rounded-[26px] bg-slate-950 px-5 py-5 text-white">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={18} />
                  <p className="text-lg font-semibold">Order Summary</p>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
                  <span>Items</span>
                  <span>{cart.items.length}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                  <span>Subtotal</span>
                  <span>Rs {getTotalPrice()}</span>
                </div>
                <div className="mt-4 border-t border-white/10 pt-4 text-2xl font-semibold text-emerald-300">
                  Total Rs {getTotalPrice()}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="public-button public-button-primary mt-6 w-full"
              >
                Proceed to Checkout
              </button>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
