import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="public-section pb-8">
      <div className="public-glass rounded-[32px] px-6 py-10 text-slate-200 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <div className="public-pill">Zesto Signature</div>
            <h2 className="mt-5 text-3xl font-semibold text-white">Modern food ordering, styled like a premium brand.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
              Restaurants, meals, orders aur support ko ek richer customer experience ke saath serve karne ke liye.
            </p>
            <a
              href="http://localhost:3001/delivery-signup"
              target="_blank"
              rel="noopener noreferrer"
              className="public-button public-button-primary mt-6 text-sm"
            >
              Become Delivery Partner
            </a>
          </div>

          <FooterGroup
            title="Explore"
            links={[
              { to: "/", label: "Home" },
              { to: "/restaurants", label: "Restaurants" },
              { to: "/blogs", label: "Blogs" },
            ]}
          />
          <FooterGroup
            title="Support"
            links={[
              { to: "/help-center", label: "Help Center" },
              { to: "/my-orders", label: "My Orders" },
              { to: "/my-profile", label: "Profile" },
            ]}
          />

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200/75">Follow</h3>
            <div className="mt-5 flex gap-3">
              {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, index) => (
                <a
                  key={index}
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
                >
                  <Icon />
                </a>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-300">
              Copyright © {new Date().getFullYear()} Zesto. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200/75">{title}</h3>
      <div className="mt-5 space-y-3">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="block text-sm text-slate-300 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
