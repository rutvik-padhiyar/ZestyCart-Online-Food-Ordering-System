import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  LogIn,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  Store,
  MessageSquareMore,
  ScrollText,
  Bike,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import "../styles/admin.css";
import { clearUserSession, readCurrentUser } from "../utils/auth";

const links = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "All Orders", path: "/admin/orders", icon: ShoppingBag },
  { name: "All Foods", path: "/admin/foods", icon: UtensilsCrossed },
  { name: "All Users", path: "/admin/users", icon: Users },
  { name: "Restaurants", path: "/admin/restaurants", icon: Store },
  { name: "Feedbacks", path: "/admin/feedbacks", icon: MessageSquareMore },
  { name: "Blogs", path: "/admin/blogs", icon: ScrollText },
  { name: "Delivery", path: "/admin/delivery-partners", icon: Bike },
  { name: "Enable 2FA", path: "/admin/enable-2fa", icon: ShieldCheck },
];

export default function SidebarLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = useMemo(() => readCurrentUser(), []);

  const handleSwitchAccount = () => {
    clearUserSession();
    window.location.href = "/login";
  };

  return (
    <div className="admin-shell flex min-h-screen">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-full border border-white/10 bg-slate-950/70 p-3 text-white shadow-2xl backdrop-blur lg:hidden"
      >
        <Menu size={18} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-white/10 bg-slate-950/90 p-5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="admin-glass rounded-[28px] p-5">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="admin-badge bg-amber-400/15 text-amber-200">
                ZestyCart Admin
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                Admin Panel
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Orders, revenue aur activity ko ek jagah se manage karo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-white/10 p-2 text-slate-200 lg:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `admin-sidebar-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-5 rounded-[28px] border border-amber-300/15 bg-gradient-to-br from-amber-400/15 via-rose-300/10 to-transparent p-5 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
            Quick Access
          </p>
          <h2 className="mt-3 text-lg font-semibold text-white">
            Admin Actions
          </h2>
          <p className="mt-2 leading-6 text-slate-300">
            Dashboard se latest activity dekho aur orders section se daily actions handle karo.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Signed in</p>
              <p className="mt-2 font-semibold text-white">{currentUser?.email || "Current session"}</p>
            </div>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950"
            >
              <LogIn size={16} />
              Switch to User Login
            </button>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 font-semibold text-white"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-6 pt-16 lg:px-6 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
