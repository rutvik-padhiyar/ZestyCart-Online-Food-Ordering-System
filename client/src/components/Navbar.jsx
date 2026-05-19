import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ShoppingBag, UserCircle2, X } from "lucide-react";
import { CartContext } from "../context/CartContext";
import { clearUserSession, getStoredToken, validateStoredToken } from "../utils/auth";

export default function Navbar() {
  const [userRole, setUserRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, fetchCartCount } = useContext(CartContext);

  const syncSession = useCallback(() => {
    const token = getStoredToken();
    if (!token) {
      setUserRole(null);
      return;
    }

    const decoded = validateStoredToken();
    if (!decoded) {
      setUserRole(null);
      return;
    }

    setUserRole(decoded.role || "user");
  }, []);

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
  }, [syncSession, fetchCartCount]);

  const handleLogout = useCallback(() => {
    clearUserSession();
    window.location.href = "/login";
  }, []);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "All Restaurants", to: "/restaurants" },
    { label: "Blogs", to: "/blogs" },
    { label: "Help", to: "/help-center" },
  ];

  return (
    <header className="site-header">
      <div className="public-glass site-header-bar">
        <Link to="/" className="site-brand" onClick={() => setMenuOpen(false)}>
          <div className="site-brand-mark">
            <img src="/images/fav.png" alt="ZestyCart" className="site-brand-logo" />
          </div>
          <div className="site-brand-copy">
            <p className="site-brand-title">ZestyCart</p>
            <p className="site-brand-tagline">Food Ordering</p>
          </div>
        </Link>

        <nav className="site-nav">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="site-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          {userRole !== "admin" && (
            <Link to="/cart" className="public-button public-button-secondary text-sm">
              <ShoppingBag size={16} />
              Cart ({cartCount})
            </Link>
          )}

          {userRole === "user" && (
            <div className="site-account-menu">
              <button type="button" className="public-button public-button-primary text-sm">
                <UserCircle2 size={16} />
                My Account
              </button>
              <div className="site-account-dropdown">
                <NavMenuLink to="/my-orders">My Orders</NavMenuLink>
                <NavMenuLink to="/my-profile">My Profile</NavMenuLink>
                <NavMenuLink to="/help-center">Help Center</NavMenuLink>
                <button type="button" onClick={handleLogout} className="site-mobile-link site-mobile-link-danger">
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

        <button
          type="button"
          className="site-mobile-toggle"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {menuOpen && (
        <div className="public-glass site-mobile-panel">
          <div className="site-mobile-links">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="site-mobile-link">
                {link.label}
              </Link>
            ))}

            {userRole === "user" && (
              <>
                <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="site-mobile-link">
                  My Orders
                </Link>
                <Link to="/my-profile" onClick={() => setMenuOpen(false)} className="site-mobile-link">
                  My Profile
                </Link>
                <button type="button" onClick={handleLogout} className="site-mobile-link site-mobile-link-danger">
                  Logout
                </button>
              </>
            )}

            {!userRole && (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="site-mobile-link">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="site-mobile-link">
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
    <Link to={to} className="site-menu-link">
      {children}
    </Link>
  );
}
