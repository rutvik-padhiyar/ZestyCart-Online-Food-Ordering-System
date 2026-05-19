import React from "react";

export default function RestaurantAuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="restaurant-auth-shell">
      <section className="restaurant-auth-panel">
        <div className="restaurant-auth-showcase">
          <img src="/zesto.png" alt="ZestyCart" className="restaurant-showcase-logo" />
          <p className="restaurant-auth-kicker">ZestyCart Restaurant</p>
          <h1>{title}</h1>
          <p className="restaurant-auth-copy">{subtitle}</p>

          <div className="restaurant-preview-grid">
            <div className="restaurant-preview-card">
              <span>Incoming Orders</span>
              <strong>12 Active</strong>
            </div>
            <div className="restaurant-preview-card">
              <span>Kitchen Queue</span>
              <strong>7 Preparing</strong>
            </div>
            <div className="restaurant-preview-card">
              <span>Pickup Ready</span>
              <strong>4 Packed</strong>
            </div>
          </div>
        </div>

        <div className="restaurant-auth-card">
          {children}
          {footer}
        </div>
      </section>
    </div>
  );
}
