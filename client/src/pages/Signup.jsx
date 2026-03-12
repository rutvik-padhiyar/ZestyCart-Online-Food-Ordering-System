import React, { useState } from "react";
import { LocateFixed, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    address: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          setFormData((prev) => ({ ...prev, address: data.display_name || "Address not found" }));
        } catch (error) {
          alert("Failed to fetch address");
        }
        setLoading(false);
      },
      () => {
        alert("Unable to fetch location");
        setLoading(false);
      }
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    localStorage.setItem("signupData", JSON.stringify(formData));
    navigate(`/verify-email?email=${formData.email}`);
  };

  return (
    <div className="public-shell">
      <div className="public-section flex min-h-[calc(100vh-120px)] items-center justify-center pt-20">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="public-card rounded-[36px] p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Create account</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">Join Zesto</h1>
            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <Input placeholder="Name" value={formData.name} onChange={(value) => setFormData((current) => ({ ...current, name: value }))} />
              <Input type="email" placeholder="Email" value={formData.email} onChange={(value) => setFormData((current) => ({ ...current, email: value }))} />
              <Input placeholder="Mobile Number" value={formData.mobile} onChange={(value) => setFormData((current) => ({ ...current, mobile: value }))} />
              <Input type="password" placeholder="Password" value={formData.password} onChange={(value) => setFormData((current) => ({ ...current, password: value }))} />
              <div className="md:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))}
                    placeholder="Address"
                    className="public-input pr-14"
                    required
                  />
                  <button type="button" onClick={fetchLocation} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-50 p-2 text-emerald-700">
                    <LocateFixed size={18} />
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="public-button public-button-primary w-full">
                  {loading ? "Fetching Location..." : "Continue to Verification"}
                  <UserPlus size={16} />
                </button>
              </div>
            </form>
          </section>

          <section className="public-hero rounded-[36px] px-8 py-10 text-white lg:px-10">
            <div className="public-pill">Luxury onboarding</div>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight lg:text-5xl">
              Your food profile starts with a cleaner, premium setup.
            </h2>
            <div className="mt-8 space-y-4">
              <LuxuryBullet text="Location-assisted signup for faster checkout." />
              <LuxuryBullet text="User account ready for orders, tracking and support." />
              <LuxuryBullet text="Unified experience that matches the new premium admin style." />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Input({ type = "text", placeholder, value, onChange }) {
  return <input type={type} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} required className="public-input" />;
}

function LuxuryBullet({ text }) {
  return <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-emerald-100/75">{text}</div>;
}
