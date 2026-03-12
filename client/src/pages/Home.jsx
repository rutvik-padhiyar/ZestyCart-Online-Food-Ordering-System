import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Search, Star, User } from "lucide-react";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || `${API_BASE}`;

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("Deesa");
  const [searchInput, setSearchInput] = useState("");
  const [location, setLocation] = useState({ lat: 24.2586, lng: 72.1907 });
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    detectUserLocation();

    const handleReset = () => {
      setSearchInput("");
      detectUserLocation();
    };

    window.addEventListener("resetHome", handleReset);
    return () => window.removeEventListener("resetHome", handleReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      fetchRestaurants(24.2586, 72.1907);
      return;
    }

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
        }
      },
      () => {
        setLocation({ lat: 24.2586, lng: 72.1907 });
        setAddress("Deesa");
        fetchRestaurants(24.2586, 72.1907);
      }
    );
  };

  const fetchRestaurants = async (lat, lng) => {
    setLoading(true);
    setSearchError("");
    try {
      let url = `${API_BASE}/api/restaurant/all`;
      if (lat && lng) {
        url = `${API_BASE}/api/restaurant/nearby?lat=${lat}&lng=${lng}&distance=15`;
      }
      const res = await axios.get(url);
      setRestaurants(res.data || []);
    } catch (error) {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="public-section pt-24">
        <section className="public-hero rounded-[40px] px-8 py-10 text-white lg:px-10 lg:py-12">
          <div className="public-pill">Luxury discovery</div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:max-w-4xl lg:text-6xl">
            Discover standout restaurants in <span className="text-emerald-300">{address}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-100/80">
            Premium cards, cleaner browsing and a more intentional ordering flow.
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
            <button type="button" onClick={() => detectUserLocation()} className="public-button public-button-secondary">
              My Location
            </button>
          </div>
          {searchError && <p className="mt-4 text-sm text-amber-200">{searchError}</p>}
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="public-glass rounded-[30px] px-6 py-10 text-sm text-slate-300">Fetching restaurants...</div>
          ) : restaurants.length === 0 ? (
            <div className="public-glass rounded-[30px] px-6 py-10 text-sm text-slate-300">No restaurants match the current search.</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((restaurant) => (
                <article key={restaurant._id} className="public-card overflow-hidden rounded-[32px]">
                  <img
                    src={`${API_BASE}/uploads/${restaurant.restaurantImage || "placeholder-restaurant.svg"}`}
                    alt={restaurant.name}
                    className="h-60 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = `${API_BASE}/uploads/placeholder-restaurant.svg`;
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-2xl font-semibold text-slate-950">{restaurant.name}</h2>
                      <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Featured
                      </span>
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <Detail icon={<User size={16} />} text={restaurant.ownerName} />
                      <Detail icon={<Phone size={16} />} text={restaurant.mobile} />
                      <Detail icon={<Mail size={16} />} text={restaurant.email} />
                      <Detail icon={<MapPin size={16} />} text={`${restaurant.distanceInKm || 1.0} km away`} />
                      <Detail icon={<Star size={16} className="text-amber-500" />} text={`${restaurant.rating || 4.6} / 5`} />
                    </div>
                    <Link to={`/restaurant/${restaurant._id}`} className="public-button public-button-primary mt-6 w-full text-sm">
                      View Foods
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

function Detail({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-emerald-700">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
