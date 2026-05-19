import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

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
      const res = await axios.post(`${BACKEND_URL}/api/admin/login`, formData);

      if (res.data.message === '2FA required') {
        navigate('/admin/verify-2fa', { state: { userId: res.data.user.id } });
        return;
      }

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
            <div className="public-pill">Account Login</div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-6xl">
              Sign in to continue.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-emerald-100/80">
              Access your orders, cart and account details.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <InfoCard title="Order access" text="View your recent orders and account activity." />
              <InfoCard title="Saved details" text="Use your saved account information during checkout." />
            </div>
          </section>

          <section className="public-card rounded-[36px] p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Account access</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Login</h2>
            {successMessage && <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Field
              
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(value) => setFormData((current) => ({ ...current, email: value }))}
              />
              <Field
               
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
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-500">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="public-input min-h-[56px] pl-14 pr-4 leading-normal"
        />
      </div>
    </label>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 px-5 py-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-emerald-100/70">{text}</p>
    </div>
  );
}
