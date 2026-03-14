import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Clock3, ShoppingBag, Sparkles, Star } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { resolveMediaUrl } from "../utils/media";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function RestaurantPage() {
  const { id } = useParams();
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/food/restaurant/${id}/foods`);
        setFoods(response.data || []);
      } catch (error) {
        toast.error("Could not load foods");
      }
    };

    fetchFoods();
  }, [id]);

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("Please login first to add items to cart.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/cart/add`,
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Product added to cart");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="public-shell">
      <div className="public-section pt-24">
        <section className="public-hero rounded-[36px] px-8 py-10 text-white lg:px-10">
          <div className="public-pill">
            <Sparkles size={14} />
            Signature menu
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-5xl">Explore premium dishes from this restaurant.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-emerald-100/80">
            Curated food cards, clear pricing aur instant cart actions.
          </p>
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {foods.map((food) => (
            <article key={food._id} className="public-card overflow-hidden rounded-[32px]">
              <img
                src={resolveMediaUrl(food.image, API_BASE)}
                alt={food.name}
                className="h-56 w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = `${API_BASE}/uploads/placeholder-restaurant.svg`;
                }}
              />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">{food.name}</h2>
                    <p className="mt-2 text-sm text-slate-500">{food.category}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700">
                    Rs {food.price}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-amber-500" />
                    {food.rating || 4.5} rating
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-emerald-600" />
                    {food.deliveryTime || 30} mins delivery
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{food.description || "Freshly prepared item from our featured menu."}</p>

                <button type="button" onClick={() => handleAddToCart(food._id)} className="public-button public-button-primary mt-6 w-full text-sm">
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
      <ToastContainer />
    </div>
  );
}
