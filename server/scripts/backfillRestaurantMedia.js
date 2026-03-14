require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("../models/restaurantModel");

const IMAGE_SET = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
];

async function run() {
  await mongoose.connect(process.env.MONGO_URL);

  const restaurants = await Restaurant.find({
    $or: [
      { restaurantImage: { $exists: false } },
      { restaurantImage: "" },
      { restaurantImage: "placeholder-restaurant.svg" },
      { galleryImages: { $exists: false } },
      { galleryImages: { $size: 0 } },
      { city: { $in: ["Deesa", "Palanpur", "Ahmedabad"] } },
    ],
  });

  let updatedCount = 0;

  for (const [index, restaurant] of restaurants.entries()) {
    const image = IMAGE_SET[index % IMAGE_SET.length];
    const gallery = IMAGE_SET.map((_, galleryIndex) => IMAGE_SET[(index + galleryIndex) % IMAGE_SET.length]).slice(0, 5);

    if (!restaurant.restaurantImage || restaurant.restaurantImage === "placeholder-restaurant.svg") {
      restaurant.restaurantImage = image;
    }

    if (!restaurant.galleryImages?.length) {
      restaurant.galleryImages = gallery;
    }

    if (!restaurant.city) {
      const inferred = inferCity(restaurant);
      if (inferred.city) restaurant.city = inferred.city;
      if (inferred.state) restaurant.state = inferred.state;
    }

    await restaurant.save();
    updatedCount += 1;
  }

  console.log(`Backfilled media for ${updatedCount} restaurants.`);
  await mongoose.disconnect();
}

function inferCity(restaurant) {
  const text = `${restaurant.name || ""} ${restaurant.address || ""}`.toLowerCase();
  if (text.includes("deesa")) return { city: "Deesa", state: "Gujarat" };
  if (text.includes("palanpur")) return { city: "Palanpur", state: "Gujarat" };
  if (text.includes("ahmedabad")) return { city: "Ahmedabad", state: "Gujarat" };
  return {};
}

run().catch(async (error) => {
  console.error("Backfill media failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
