import React from "react";
import { Bike, Store, UserRound } from "lucide-react";

export default function LuxuryEndcap() {
  return (
    <section className="delivery-strip mt-10 mb-10">
      <div className="delivery-strip-inner">
        <div className="delivery-strip-point">
          <div className="delivery-strip-icon">
            <Store size={16} />
          </div>
          <span>Restaurant</span>
        </div>

        <div className="delivery-strip-track" aria-hidden="true">
          <div className="delivery-strip-line" />
          <div className="delivery-strip-rider">
            <span className="delivery-strip-badge">Zesto</span>
            <Bike size={18} />
          </div>
        </div>

        <div className="delivery-strip-point delivery-strip-point-end">
          <div className="delivery-strip-icon">
            <UserRound size={16} />
          </div>
          <span>Customer</span>
        </div>
      </div>
    </section>
  );
}
