import React, { useEffect, useState } from "react";
import axios from "axios";
import { Headset, MessageCircleMore } from "lucide-react";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function HelpCenter() {
  const [supportInfo, setSupportInfo] = useState({ phone: "", appName: "" });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/user/support-info`).then((res) => setSupportInfo(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (error) {}
    };
    fetchProfile();
  }, []);

  const message = encodeURIComponent(
    [`Hi, I need help with ${supportInfo.appName || "Zesto"}.`, profile?.name ? `My name is ${profile.name}.` : "", profile?.email ? `Email: ${profile.email}.` : ""]
      .filter(Boolean)
      .join(" ")
  );

  return (
    <div className="public-shell">
      <div className="public-section flex min-h-[calc(100vh-120px)] items-center justify-center pt-24">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.95fr]">
          <section className="public-hero rounded-[36px] px-8 py-10 text-white">
            <div className="public-pill">Priority support</div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-5xl">Need help? Start a premium support chat in one tap.</h1>
            <div className="mt-8 space-y-4">
              <SupportNote text="Fast WhatsApp-based help flow for customers." />
              <SupportNote text="Profile information can be attached for quicker issue resolution." />
            </div>
          </section>

          <section className="public-card rounded-[36px] p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Headset size={34} />
            </div>
            <h2 className="mt-6 text-3xl font-semibold text-slate-950">{supportInfo.appName || "Zesto Help"}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Need help? Chat with our support team on WhatsApp.</p>
            {supportInfo.phone ? (
              <a
                href={`https://wa.me/${supportInfo.phone}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                className="public-button public-button-primary mt-8 w-full"
              >
                <MessageCircleMore size={16} />
                Continue to Chat
              </a>
            ) : (
              <p className="mt-8 text-sm text-slate-500">Loading support details...</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SupportNote({ text }) {
  return <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-emerald-100/75">{text}</div>;
}
