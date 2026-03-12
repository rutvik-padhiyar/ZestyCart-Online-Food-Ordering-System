import React, { useState } from "react";
import { Search } from "lucide-react";

export default function NearbyRestaurants({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSearch) onSearch(query.trim());
  };

  const handleReset = () => {
    setQuery("");
    if (onSearch) onSearch("");
  };

  return (
    <section className="mx-auto mb-8 max-w-5xl rounded-[32px] border border-emerald-200/10 bg-gradient-to-r from-emerald-950 via-green-950 to-teal-950 px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/70">
          Discover
        </p>
        <h2 className="mt-3 text-3xl font-bold text-white md:text-5xl">
          Restaurants near your location
        </h2>
        <p className="mt-3 text-sm text-emerald-100/80 md:text-base">
          Name, owner ya address se restaurants filter karke jaldi discover karo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-200/70" size={18} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by restaurant, owner or address"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-12 py-4 text-white placeholder:text-emerald-100/50 outline-none focus:border-emerald-300"
          />
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-2xl border border-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/5"
        >
          Reset
        </button>
      </form>
    </section>
  );
}
