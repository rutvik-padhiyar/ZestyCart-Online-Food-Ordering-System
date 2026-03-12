import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Menu, ShoppingBag, UserCircle2, X } from "lucide-react";
import { CartContext } from "../context/CartContext";

export default function Navbar() {
  const [userRole, setUserRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, fetchCartCount } = useContext(CartContext);

  useEffect(() => {
    syncSession();
    fetchCartCount();

    const handleCartUpdate = () => fetchCartCount();
    const handleLoginSuccess = () => {
      syncSession();
      fetchCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("loginSuccess", handleLoginSuccess);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("loginSuccess", handleLoginSuccess);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncSession = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserRole(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role || "user");
    } catch (error) {
      setUserRole(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setUserRole(null);
    window.dispatchEvent(new Event("loginSuccess"));
    window.location.href = "/login";
  };

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "All Restaurants", to: "/restaurants" },
    { label: "Blogs", to: "/blogs" },
    { label: "Help", to: "/help-center" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="public-glass mx-auto flex max-w-7xl items-center justify-between rounded-[28px] px-5 py-4 text-white lg:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-400/15 px-3 py-2 text-xl">🍕</div>
          <div>
            <p className="text-xl font-semibold tracking-tight">Zesto</p>
            <p className="text-xs uppercase tracking-[0.32em] text-emerald-200/70">
              Luxury Fooding
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-slate-200 transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {userRole !== "admin" && (
            <Link to="/cart" className="public-button public-button-secondary text-sm">
              <ShoppingBag size={16} />
              Cart ({cartCount})
            </Link>
          )}

          {userRole === "user" && (
            <div className="group relative">
              <button className="public-button public-button-primary text-sm">
                <UserCircle2 size={16} />
                My Account
              </button>
              <div className="invisible absolute right-0 top-full mt-3 min-w-[220px] rounded-[22px] border border-white/10 bg-slate-950/95 p-2 opacity-0 shadow-2xl transition-all group-hover:visible group-hover:opacity-100">
                <NavMenuLink to="/my-orders">My Orders</NavMenuLink>
                <NavMenuLink to="/my-profile">My Profile</NavMenuLink>
                <NavMenuLink to="/help-center">Help Center</NavMenuLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-300 transition hover:bg-white/5"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {!userRole && (
            <>
              <Link to="/login" className="public-button public-button-secondary text-sm">
                Login
              </Link>
              <Link to="/signup" className="public-button public-button-primary text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button type="button" className="rounded-2xl border border-white/10 p-3 lg:hidden" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {menuOpen && (
        <div className="public-glass mx-auto mt-3 max-w-7xl rounded-[28px] p-4 text-white lg:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium hover:bg-white/5">
                {link.label}
              </Link>
            ))}
            {userRole === "user" && (
              <>
                <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium hover:bg-white/5">
                  My Orders
                </Link>
                <Link to="/my-profile" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium hover:bg-white/5">
                  My Profile
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-300 hover:bg-white/5">
                  Logout
                </button>
              </>
            )}
            {!userRole && (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium hover:bg-white/5">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium hover:bg-white/5">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavMenuLink({ to, children }) {
  return (
    <Link to={to} className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5">
      {children}
    </Link>
  );
}
