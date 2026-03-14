import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock3, MapPin, ShieldCheck, Sparkles, Star, UtensilsCrossed, X } from "lucide-react";
import { resolveMediaUrl } from "../utils/media";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [restaurantRes, foodsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/restaurant/${id}`),
          axios.get(`${API_BASE}/api/food/restaurant/${id}/foods`),
        ]);

        setRestaurant(restaurantRes.data || null);
        setFoods(Array.isArray(foodsRes.data) ? foodsRes.data : []);
      } catch (error) {
        setRestaurant(null);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="public-shell">
        <div className="public-section pb-16 pt-24">
          <div className="public-glass rounded-[32px] px-6 py-12 text-sm text-slate-300">Loading luxury restaurant profile...</div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="public-shell">
        <div className="public-section pb-16 pt-24">
          <div className="public-glass rounded-[32px] px-6 py-12 text-sm text-slate-300">Restaurant details load nahi ho payi.</div>
        </div>
      </div>
    );
  }

  const gallery = [restaurant.restaurantImage, ...(restaurant.galleryImages || [])].filter(Boolean).slice(0, 5);
  const featuredFoods = foods.slice(0, 8);
  const currentGalleryImage = activeGalleryIndex === null ? null : gallery[activeGalleryIndex];

  const goToGallerySlide = (direction) => {
    setActiveGalleryIndex((current) => {
      if (current === null) return 0;
      return (current + direction + gallery.length) % gallery.length;
    });
  };

  return (
    <div className="public-shell">
      <div className="public-section pb-16 pt-24 lg:pb-24">
        <section className="public-hero relative overflow-hidden rounded-[40px] px-8 py-10 text-white lg:px-10 lg:py-12">
          <div className="absolute -right-10 top-8 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute -left-8 bottom-2 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="public-pill">
                <Sparkles size={14} />
                Luxury Restaurant Profile
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-6xl">{restaurant.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-emerald-100/80">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={16} />
                  {restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ""}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Star size={16} className="text-amber-300" />
                  {Number(restaurant.rating || 4.6).toFixed(1)}/5
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={16} />
                  {restaurant.deliveryTime || "30-40 mins"}
                </span>
              </div>
              <p className="mt-5 max-w-3xl text-base leading-8 text-emerald-100/85">
                {restaurant.description || restaurant.shortDescription || "A premium dining destination with signature interiors, expressive plating and elegant service."}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <InfoBox label="Cost for Two" value={`Rs ${restaurant.avgCostForTwo || 1200}`} />
                <InfoBox label="Dining Style" value={restaurant.priceRange || "Premium Casual"} />
                <InfoBox label="Open Hours" value={restaurant.openingHours || "11:00 AM - 11:30 PM"} />
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={`/restaurant/${restaurant._id}`} className="public-button public-button-primary text-sm">
                  <UtensilsCrossed size={16} />
                  View Foods
                </Link>
                <a href="#gallery" className="public-button public-button-secondary text-sm">
                  Explore Gallery
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            <div id="gallery" className="grid gap-4 sm:grid-cols-2">
              {gallery.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className={`overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl ${
                    index === 0 ? "sm:col-span-2" : ""
                  }`}
                >
                  <img
                    src={resolveMediaUrl(image, API_BASE)}
                    alt={`${restaurant.name} ${index + 1}`}
                    onClick={() => setActiveGalleryIndex(index)}
                    className={`w-full object-cover transition duration-500 hover:scale-105 ${
                      index === 0 ? "h-72" : "h-44"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="public-glass rounded-[34px] px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Signature Notes</p>
            <div className="mt-5 space-y-5">
              <DetailLine title="Address" text={restaurant.address || "Prime city-center address"} />
              <DetailLine title="Short Story" text={restaurant.shortDescription || "Designed for guests who want elevated plating, mood lighting and premium service cadence."} />
              <DetailLine title="Cuisines" text={(restaurant.cuisines || []).join(", ") || "North Indian, Continental, Asian"} />
              <DetailLine title="Highlights" text={(restaurant.features || []).join(", ") || "Chef tasting menu, rooftop seating, valet access"} />
            </div>
          </div>

          <div className="public-card rounded-[34px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Why guests pick it</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Luxury touchpoints</h2>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Premium Verified
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(restaurant.tags || ["Fine Dining", "Romantic Tables", "City Favorite", "Chef Special"]).slice(0, 6).map((tag) => (
                <div key={tag} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900">{tag}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Signature service styling aur polished guest journey ke saath curated experience.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 public-card rounded-[34px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Preview Menu</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Featured dishes</h2>
            </div>
            <Link to={`/restaurant/${restaurant._id}`} className="text-sm font-semibold text-emerald-700">
              Open full food list
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredFoods.map((food) => (
              <article key={food._id} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                <img
                  src={resolveMediaUrl(food.image, API_BASE)}
                  alt={food.name}
                  className="h-40 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{food.category}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{food.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{food.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Rs {food.price}</span>
                    <span className="text-amber-600">{food.rating || 4.7} rating</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {currentGalleryImage ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/88 px-4 py-8 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveGalleryIndex(null)}
            className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/10 p-3 text-white"
          >
            <X size={18} />
          </button>
          <button
            type="button"
            onClick={() => goToGallerySlide(-1)}
            className="absolute left-5 rounded-full border border-white/10 bg-white/10 p-3 text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-2xl">
            <img
              src={resolveMediaUrl(currentGalleryImage, API_BASE)}
              alt={`${restaurant.name} gallery`}
              className="max-h-[78vh] w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => goToGallerySlide(1)}
            className="absolute right-5 rounded-full border border-white/10 bg-white/10 p-3 text-white"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailLine({ title, text }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-200">{text}</p>
    </div>
  );
}
