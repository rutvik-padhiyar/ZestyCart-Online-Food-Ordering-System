import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowRight, LoaderCircle, MapPin, Search, Sparkles, Tag } from "lucide-react";
import { resolveMediaUrl } from "../utils/media";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";
const heroOffers = [
  { title: "Flat 30% Off", subtitle: "Save on selected combos after 7 PM" },
  { title: "Dessert Offer", subtitle: "Buy 2 desserts and get 1 free on selected items" },
  { title: "Weekend Delivery", subtitle: "Free delivery on selected restaurants this weekend" },
];

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("Deesa");
  const [searchInput, setSearchInput] = useState("");
  const [location, setLocation] = useState({ lat: 24.2586, lng: 72.1907 });
  const [searchError, setSearchError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [offerIndex, setOfferIndex] = useState(0);

  const fetchRestaurants = useCallback(async (lat, lng) => {
    setLoading(true);
    setSearchError("");
    try {
      let url = `${API_BASE}/api/restaurant/all`;
      if (lat && lng) {
        url = `${API_BASE}/api/restaurant/nearby?lat=${lat}&lng=${lng}&distance=15`;
      }
      const res = await axios.get(url);
      // API se response ek object ho sakta hai (jaise { restaurants: [...] }) ya seedha array.
      // Isliye, hum check karte hain ki data array hai ya nahi, taaki .map() error na de.
      const restaurantData = res.data?.restaurants || res.data;
      setRestaurants(Array.isArray(restaurantData) ? restaurantData : []);
    } catch (error) {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      fetchRestaurants(24.2586, 72.1907);
      return;
    }
    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setLocation({ lat: latitude, lng: longitude });
        fetchRestaurants(latitude, longitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.state_district ||
            data.address?.county ||
            "Your City";
          setAddress(city);
        } catch (error) {
          setAddress("Your City");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setLocation({ lat: 24.2586, lng: 72.1907 });
        setAddress("Deesa");
        fetchRestaurants(24.2586, 72.1907);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchRestaurants]);

  useEffect(() => {
    detectUserLocation();

    const handleReset = () => {
      setSearchInput("");
      detectUserLocation();
    };

    window.addEventListener("resetHome", handleReset);
    return () => window.removeEventListener("resetHome", handleReset);
  }, [detectUserLocation]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOfferIndex((current) => (current + 1) % heroOffers.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  const handleSearch = async () => {
    const query = searchInput.trim();
    if (!query) {
      fetchRestaurants(location.lat, location.lng);
      return;
    }

    try {
      setLoading(true);
      setSearchError("");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!data?.length) {
        setRestaurants([]);
        setSearchError("Location nahi mila. Please city ya area ka sahi naam search karo.");
        setLoading(false);
        return;
      }

      const result = data[0];
      const lat = Number(result.lat);
      const lng = Number(result.lon);
      setLocation({ lat, lng });
      setAddress(result.display_name?.split(",")[0] || query);
      await fetchRestaurants(lat, lng);
    } catch (error) {
      setSearchError("Search abhi work nahi kar raha. Thodi der baad try karo.");
      setLoading(false);
    }
  };

  return (
    <div className="public-shell">
      <div className="public-section pb-16 pt-24 lg:pb-24">
        <section className="public-hero rounded-[40px] px-8 py-10 text-white lg:px-10 lg:py-12">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
            <div>
              <div className="public-pill">Restaurant Discovery</div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:max-w-4xl lg:text-6xl">
                Discover restaurants in <span className="text-emerald-300">{address}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-100/80">
                Search nearby restaurants, check offers and start your order.
              </p>

              <div className="mt-8 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/70" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Search by restaurant, owner or address"
                    className="w-full rounded-[22px] border border-white/10 bg-white/10 px-12 py-4 text-white placeholder:text-emerald-100/50 outline-none"
                  />
                </div>
                <button type="button" onClick={handleSearch} className="public-button public-button-primary">
                  Search
                </button>
                <button type="button" onClick={() => detectUserLocation()} className="public-button public-button-secondary min-w-[190px]">
                  {detectingLocation ? <LoaderCircle size={16} className="animate-spin" /> : null}
                  Current Location
                </button>
              </div>
              {searchError && <p className="mt-4 text-sm text-amber-200">{searchError}</p>}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-300/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                <Tag size={14} />
                Live offers
              </div>
              <div className="mt-5 min-h-[210px] rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
                  Offer {offerIndex + 1}
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-white">{heroOffers[offerIndex].title}</h3>
                <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                  {heroOffers[offerIndex].subtitle}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {heroOffers.map((offer, index) => (
                    <button
                      key={offer.title}
                      type="button"
                      onClick={() => setOfferIndex(index)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                        index === offerIndex
                          ? "bg-white text-slate-950"
                          : "border border-white/10 bg-white/5 text-slate-200"
                      }`}
                    >
                      {offer.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="public-glass rounded-[30px] px-6 py-10 text-sm text-slate-300">Fetching restaurants...</div>
          ) : restaurants.length === 0 ? (
            <div className="public-glass rounded-[30px] px-6 py-10 text-sm text-slate-300">No restaurants match the current search.</div>
          ) : (
            <div className="grid gap-8 pb-6 md:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((restaurant) => (
                <article key={restaurant._id} className="public-card overflow-hidden rounded-[32px] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
                  <img
                    src={resolveMediaUrl(restaurant.restaurantImage, API_BASE)}
                    alt={restaurant.name}
                    className="h-60 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = `${API_BASE}/uploads/placeholder-restaurant.svg`;
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Popular
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        <Sparkles size={14} />
                        Featured
                      </span>
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold text-slate-950">{restaurant.name}</h2>
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="text-emerald-700" />
                      <span>{restaurant.city || address}</span>
                      {restaurant.state ? <span className="text-slate-400">• {restaurant.state}</span> : null}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Link
                        to={`/restaurant/${restaurant._id}`}
                        className="public-button public-button-primary w-full text-sm"
                      >
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
      </div>
    </div>
  );
}
