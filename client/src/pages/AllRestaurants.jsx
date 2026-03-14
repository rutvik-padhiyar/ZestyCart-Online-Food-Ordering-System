import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { resolveMediaUrl } from "../utils/media";
import LuxuryEndcap from "../components/LuxuryEndcap";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function AllRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/restaurant/all`)
      .then((res) => {
        setRestaurants(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="public-shell">
      <div className="public-section pb-16 pt-24 lg:pb-24">
        <section className="public-hero rounded-[36px] px-8 py-10 text-white lg:px-10">
          <div className="public-pill">Restaurant collection</div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-6xl">Browse every restaurant in one luxury catalog.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-emerald-100/80">
            Handpicked listings, polished cards and faster path to menus.
          </p>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="public-glass rounded-[30px] px-6 py-10 text-center text-sm text-slate-300">Loading restaurants...</div>
          ) : (
            <div className="grid gap-8 pb-6 md:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((restaurant) => (
                <article key={restaurant._id} className="public-card overflow-hidden rounded-[32px] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
                  <img
                    src={resolveMediaUrl(restaurant.restaurantImage, API_BASE)}
                    alt={restaurant.name}
                    className="h-56 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = `${API_BASE}/uploads/placeholder-restaurant.svg`;
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Featured
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        <Sparkles size={14} />
                        Signature
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-950">{restaurant.name}</h2>
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="text-emerald-700" />
                      <span>{restaurant.city || "Premium listing"}</span>
                      {restaurant.state ? <span className="text-slate-400">• {restaurant.state}</span> : null}
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Link to={`/restaurant/${restaurant._id}`} className="public-button public-button-primary w-full text-sm">
                        View Foods
                      </Link>
                      <Link
                        to={`/restaurants/${restaurant._id}/detail`}
                        target="_blank"
                        rel="noreferrer"
                        className="public-button public-button-secondary w-full text-sm text-slate-900"
                      >
                        Show More
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <LuxuryEndcap />
      </div>
    </div>
  );
}
