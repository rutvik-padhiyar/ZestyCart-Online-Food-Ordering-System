import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MapPin, Phone, User2 } from "lucide-react";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || `${API_BASE}`;

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
      <div className="public-section pt-24">
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
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((restaurant) => (
                <article key={restaurant._id} className="public-card overflow-hidden rounded-[32px]">
                  <img
                    src={`${API_BASE}/uploads/${restaurant.restaurantImage || "placeholder-restaurant.svg"}`}
                    alt={restaurant.name}
                    className="h-56 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = `${API_BASE}/uploads/placeholder-restaurant.svg`;
                    }}
                  />
                  <div className="p-6">
                    <h2 className="text-2xl font-semibold text-slate-950">{restaurant.name}</h2>
                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <InfoRow icon={<User2 size={16} />} text={restaurant.ownerName} />
                      <InfoRow icon={<Phone size={16} />} text={restaurant.mobile} />
                      <InfoRow icon={<Mail size={16} />} text={restaurant.email} />
                      <InfoRow icon={<MapPin size={16} />} text={restaurant.address || "Premium listing"} />
                    </div>
                    <Link to={`/restaurant/${restaurant._id}`} className="public-button public-button-primary mt-6 w-full text-sm">
                      View Foods
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoRow({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-emerald-700">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
