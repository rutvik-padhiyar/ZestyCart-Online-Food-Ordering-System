import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import { ArrowUpRight, ShieldCheck, Sparkles, Star, TimerReset } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-white/10 bg-[linear-gradient(180deg,rgba(4,18,15,0)_0%,rgba(3,14,12,0.82)_18%,rgba(2,9,17,0.98)_100%)] text-slate-200">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-8 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="mx-auto max-w-[1280px] px-6 pb-8 pt-12 lg:px-8 lg:pb-10 lg:pt-14">
        <section className="public-glass rounded-[32px] px-5 py-6 lg:px-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FooterStat icon={<Sparkles size={18} />} label="Browse" value="Find restaurants and menu items quickly" />
            <FooterStat icon={<TimerReset size={18} />} label="Reorder" value="Access recent orders and reorder faster" />
            <FooterStat icon={<ShieldCheck size={18} />} label="Support" value="Get help and track order updates easily" />
            <FooterStat icon={<Star size={18} />} label="Account" value="Manage profile, cart and checkout details" />
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr_1.05fr]">
          <div>
            <div className="public-pill">ZestyCart</div>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-white lg:text-[2rem]">
              Order food, manage your cart and track updates from one place.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
              Browse restaurants, place orders and contact support whenever needed.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="http://localhost:3001/delivery-signup"
                target="_blank"
                rel="noopener noreferrer"
                className="public-button public-button-primary text-sm"
              >
                Become Delivery Partner
                <ArrowUpRight size={16} />
              </a>
              <Link to="/help-center" className="public-button public-button-secondary text-sm">
                Help Center
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <FooterTip
                title="Ordering"
                text="Checkout se pehle cart items aur address details verify kar lo."
              />
              <FooterTip
                title="Tracking"
                text="My Orders page se latest order status dekh sakte ho."
              />
            </div>
          </div>

          <div className="grid gap-6 rounded-[30px] border border-white/10 bg-white/5 p-5 sm:grid-cols-2 xl:grid-cols-1">
            <FooterGroup
              title="Explore"
              links={[
                { to: "/", label: "Home" },
                { to: "/restaurants", label: "Restaurants" },
                { to: "/blogs", label: "Blogs" },
                { to: "/checkout", label: "Checkout" },
              ]}
            />
            <FooterGroup
              title="Assistance"
              links={[
                { to: "/help-center", label: "Help Center" },
                { to: "/my-orders", label: "My Orders" },
                { to: "/my-profile", label: "Profile" },
                { to: "/login", label: "Account Access" },
              ]}
            />
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-200/80">Useful Info</p>
            <div className="mt-4 space-y-3">
              <FooterLine title="My Orders" text="Placed orders aur latest status yahan track kar sakte ho." />
              <FooterLine title="Checkout" text="Saved address aur payment options checkout page par available hain." />
              <FooterLine title="Support" text="Order issue ke liye Help Center se support chat start karo." />
            </div>
            <div className="mt-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200/75">Follow</h3>
              <div className="mt-3 flex gap-3">
                {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, index) => (
                  <a
                    key={index}
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
          <p>Copyright © {new Date().getFullYear()} ZestyCart. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <Star size={14} className="text-amber-300" />
              Restaurants
            </span>
            <span>Orders</span>
            <span>Support</span>
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
      <div className="mt-4 space-y-2.5">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="block text-sm text-slate-300 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FooterStat({ icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-200">
        {icon}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-medium leading-6 text-white">{value}</p>
    </div>
  );
}

function FooterTip({ title, text }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/75">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function FooterLine({ title, text }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}
