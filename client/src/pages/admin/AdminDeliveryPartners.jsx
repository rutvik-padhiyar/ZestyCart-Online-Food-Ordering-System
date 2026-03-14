import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarLayout from "../../layouts/SidebarLayout";
import "../../styles/admin.css";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function AdminDeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_BASE}/api/delivery-auth/admin/partners`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPartners(data.partners || []);
      } catch (error) {
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <section className="admin-glass rounded-[32px] px-6 py-6 text-white lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="admin-badge bg-white/10 text-amber-200">Delivery Console</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">Delivery partners control room</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Rider availability, KYC status, earnings pulse and completed deliveries ko admin side se watch karo.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Partners</p>
              <p className="mt-2 text-lg font-semibold text-white">{partners.length}</p>
            </div>
          </div>
        </section>

        <section className="admin-panel rounded-[30px] overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-semibold text-slate-950">Rider roster</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-sm text-slate-500">Loading delivery partners...</div>
          ) : (
            <div className="grid gap-4 p-6 lg:grid-cols-2">
              {partners.map((partner) => (
                <article key={partner._id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950">{partner.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{partner.email}</p>
                    </div>
                    <span className={`admin-badge ${partner.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {partner.isAvailable ? "Online" : "Offline"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600">
                    <div>Mobile: {partner.phone}</div>
                    <div>Vehicle: {partner.vehicleType} {partner.vehicleNumber ? `• ${partner.vehicleNumber}` : ""}</div>
                    <div>KYC: {partner.kycStatus}</div>
                    <div>Completed Deliveries: {partner.completedDeliveries || 0}</div>
                    <div>Total Earnings: Rs {partner.totalEarnings || 0}</div>
                    <div>Location: {partner.lastKnownLocationLabel || partner.address || "Unavailable"}</div>
                  </div>
                </article>
              ))}

              {!partners.length ? <div className="text-sm text-slate-500">No delivery partners found.</div> : null}
            </div>
          )}
        </section>
      </div>
    </SidebarLayout>
  );
}
