#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const Food = require("../models/foodModel");

const uploadsDir = path.resolve(__dirname, "../uploads");
const exactFoodImageMap = {
  "Urban Truffle Risotto": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80",
  "Charred Pineapple Tacos": "https://images.unsplash.com/photo-1565299585323-38174c4a6471?auto=format&fit=crop&w=1200&q=80",
  "Smoked Beets & Burrata": "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=1200&q=80",
  "Sumac-Kissed Lamb Chops": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  "Coconut Lemongrass Broth": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
  "Saffron & Honey Glazed Salmon": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
  "Lavender Latte Panna Cotta": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
  "Crispy Dosa Sliders": "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=1200&q=80",
  "Roasted Cauliflower Steak": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  "Gold Leaf Espresso Martini": "https://images.unsplash.com/photo-1575023782549-62ca0d244b39?auto=format&fit=crop&w=1200&q=80",
  "Peri Peri Paneer Skewers": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=1200&q=80",
  "Mango Chili Cheesecake": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1200&q=80",
};
const seedImagePool = [
  "seed-bhel.jpg",
  "seed-burger.jpg",
  "seed-cake.jpg",
  "seed-cold-coffee.jpg",
  "seed-fries.jpg",
  "seed-manchurian.jpg",
  "seed-noodles.jpg",
  "seed-pani-puri.jpg",
  "seed-pavbhaji.jpg",
  "seed-pizza.jpg",
  "seed-sandwich.jpg",
  "seed-vadapav.jpg",
];

const foodImageKeywords = [
  { match: ["coffee", "martini", "spritz", "cooler", "elixir", "cold brew", "beverage"], image: "seed-cold-coffee.jpg" },
  { match: ["cake", "cheesecake", "dessert", "panna cotta", "tres leches", "yogurt"], image: "seed-cake.jpg" },
  { match: ["pizza", "ravioli"], image: "seed-pizza.jpg" },
  { match: ["burger", "sliders"], image: "seed-burger.jpg" },
  { match: ["noodle", "broth", "ramen"], image: "seed-noodles.jpg" },
  { match: ["manchurian", "kofta", "croquettes"], image: "seed-manchurian.jpg" },
  { match: ["biryani", "rice", "pulao"], image: "seed-pavbhaji.jpg" },
  { match: ["paneer", "tikka", "kebab", "kebab"], image: "seed-vadapav.jpg" },
  { match: ["taco", "sandwich"], image: "seed-sandwich.jpg" },
  { match: ["salmon", "fries", "steak", "chops"], image: "seed-fries.jpg" },
  { match: ["chaat", "pani", "lotus"], image: "seed-pani-puri.jpg" },
];

function hasUsableImage(image) {
  if (!image) {
    return false;
  }

  if (/^https?:\/\//i.test(image) || image.startsWith("data:") || image.startsWith("/uploads/")) {
    return true;
  }

  return fs.existsSync(path.join(uploadsDir, image));
}

function pickImageForFood(food, index) {
  const haystack = `${food.name || ""} ${food.category || ""} ${food.description || ""}`.toLowerCase();
  const keywordMatch = foodImageKeywords.find((entry) => entry.match.some((term) => haystack.includes(term)));

  return keywordMatch?.image || seedImagePool[index % seedImagePool.length];
}

async function run() {
  if (!process.env.MONGO_URL) {
    console.error("Missing MONGO_URL in environment");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    const foods = await Food.find().sort({ createdAt: 1 });
    let updatedCount = 0;

    for (let index = 0; index < foods.length; index += 1) {
      const food = foods[index];
      const exactImage = exactFoodImageMap[food.name];

      if (exactImage && food.image !== exactImage) {
        food.image = exactImage;
        await food.save();
        updatedCount += 1;
        continue;
      }

      if (hasUsableImage(food.image)) {
        continue;
      }

      food.image = pickImageForFood(food, index);
      await food.save();
      updatedCount += 1;
    }

    console.log(`Backfilled ${updatedCount} food images.`);
  } catch (error) {
    console.error("Failed to backfill food images", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
