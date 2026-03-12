import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || `${BACKEND_URL}`;

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("autoLoginEmail");
    const password = localStorage.getItem("autoLoginPassword");
    if (email && password) {
      setFormData({ email, password });
      localStorage.removeItem("autoLoginEmail");
      localStorage.removeItem("autoLoginPassword");
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("currentUser", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("loginSuccess"));
      setSuccessMessage("Login Successful");

      setTimeout(() => {
        window.location.href = res.data.user.role === "admin" ? "/admin/dashboard" : "/";
      }, 700);
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="public-shell">
      <div className="public-section flex min-h-[calc(100vh-120px)] items-center justify-center pt-20">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="public-hero rounded-[36px] px-8 py-10 text-white lg:px-10">
            <div className="public-pill">Welcome back</div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-6xl">
              Sign in to continue your premium food experience.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-emerald-100/80">
              Orders, cart, recommendations aur account tools ek polished flow mein aapke liye ready hain.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <LuxuryInfo title="Fast checkout" text="Saved account state ke saath smooth ordering." />
              <LuxuryInfo title="Live order access" text="Track recent orders and account activity instantly." />
            </div>
          </section>

          <section className="public-card rounded-[36px] p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Account access</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Login</h2>
            {successMessage && <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Field
                icon={<Mail size={16} />}
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(value) => setFormData((current) => ({ ...current, email: value }))}
              />
              <Field
                icon={<LockKeyhole size={16} />}
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(value) => setFormData((current) => ({ ...current, password: value }))}
              />

              <div className="flex justify-end">
                <a href="/forgot-password" className="text-sm font-medium text-emerald-700 hover:text-emerald-600">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="public-button public-button-primary w-full">
                Continue
                <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, type, placeholder, value, onChange }) {
  return (
    <label className="block">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="public-input pl-11"
        />
      </div>
    </label>
  );
}

function LuxuryInfo({ title, text }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 px-5 py-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-emerald-100/70">{text}</p>
    </div>
  );
}
