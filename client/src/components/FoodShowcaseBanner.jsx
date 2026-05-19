import React, { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa6";

const foods = [
  {
    id: "pizza",
    title: "Truffle Fire Pizza",
    subtitle: "Wood-fired slices with mozzarella topping",
    tag: "Chef special",
    image: "/images/pizza.jpg",
    accent: "Amber x Emerald",
    price: "From Rs 289",
  },
  {
    id: "burger",
    title: "Royal Smash Burger",
    subtitle: "Loaded layers, smoky glaze and crisp fries",
    tag: "Top trending",
    image: "/images/burger.jpg",
    accent: "Velvet grill",
    price: "From Rs 249",
  },
  {
    id: "noodles",
    title: "Midnight Wok Noodles",
    subtitle: "Street-style wok toss with house seasoning",
    tag: "Hot favourite",
    image: "/images/noodles.jpg",
    accent: "Spice rush",
    price: "From Rs 199",
  },
  {
    id: "pavbhaji",
    title: "Bombay Gold Pav Bhaji",
    subtitle: "Butter-rich bhaji with toasted pav pair",
    tag: "Weekend pick",
    image: "/images/pavbhaji.jpg",
    accent: "Comfort classic",
    price: "From Rs 179",
  },
  {
    id: "manchurian",
    title: "Dragon Manchurian",
    subtitle: "Bold Indo-Chinese glaze with smoky punch",
    tag: "Fast moving",
    image: "/images/manchurian.jpg",
    accent: "Pan tossed",
    price: "From Rs 229",
  },
  {
    id: "cake",
    title: "Signature Dessert Cake",
    subtitle: "Dessert layers prepared for sweet cravings",
    tag: "Sweet spotlight",
    image: "/images/cake.jpg",
    accent: "Dessert bar",
    price: "From Rs 159",
  },
];

export default function FoodShowcaseBanner() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % foods.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const activeFood = foods[activeIndex];
  const trackFoods = useMemo(() => [...foods, ...foods], []);

  return (
    <section className="food-showcase-shell">
      <div className="food-showcase public-hero overflow-hidden px-6 py-8 lg:px-10 lg:py-12">
        <div className="food-showcase-glow food-showcase-glow-left" />
        <div className="food-showcase-glow food-showcase-glow-right" />

        <div className="food-showcase-inner grid gap-8 lg:grid-cols-[1.1fr_0.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="food-showcase-kicker">Fresh drops from your favourite kitchens</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-white md:text-5xl">
              Popular dishes ko explore karo aur apna next order choose karo.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
              Pizza se noodles tak, alag menu items dekhkar apni पसंद ka order place karo.
            </p>
          </div>

          <div className="relative z-10">
            <div className="food-spotlight-card">
              <div className="food-spotlight-copy">
                <div className="food-spotlight-meta">
                  <span>{activeFood.tag}</span>
                  <span>{activeFood.accent}</span>
                </div>
                <h3>{activeFood.title}</h3>
                <p>{activeFood.subtitle}</p>
                <div className="food-spotlight-footer">
                  <span>{activeFood.price}</span>
                  <span className="food-rating">
                    <FaStar />
                    4.9
                  </span>
                </div>
              </div>

              <div className="food-spotlight-image-wrap">
                <img
                  key={activeFood.id}
                  src={activeFood.image}
                  alt={activeFood.title}
                  className="food-spotlight-image"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="food-marquee mt-8">
          <div className="food-marquee-track">
            {trackFoods.map((food, index) => (
              <article key={`${food.id}-${index}`} className="food-marquee-card">
                <img src={food.image} alt={food.title} className="food-marquee-image" />
                <div>
                  <p className="food-marquee-tag">{food.tag}</p>
                  <h3>{food.title}</h3>
                  <p className="food-marquee-price">{food.price}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
