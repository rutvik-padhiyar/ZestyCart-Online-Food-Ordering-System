#!/usr/bin/env node
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const Restaurant = require("../models/restaurantModel");
const Food = require("../models/foodModel");

const SEEDED_FOOD_IMAGES = {
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

const SAMPLE_MENU = [
  {
    name: "Urban Truffle Risotto",
    description: "Creamy arborio rice finished with black truffle oil, parmesan shards, and a sprig of microgreens.",
    category: "Fine Dining",
    price: 1299,
    image: SEEDED_FOOD_IMAGES["Urban Truffle Risotto"],
  },
  {
    name: "Charred Pineapple Tacos",
    description: "Soft tortillas filled with charred pineapple, pickled onion, chili crema, and crispy quinoa.",
    category: "Street Eats",
    price: 450,
    image: SEEDED_FOOD_IMAGES["Charred Pineapple Tacos"],
  },
  {
    name: "Smoked Beets & Burrata",
    description: "Smoked golden beets, burrata, candied pistachio, and basil oil on a grilled baguette crostini.",
    category: "Starters",
    price: 625,
    image: SEEDED_FOOD_IMAGES["Smoked Beets & Burrata"],
  },
  {
    name: "Sumac-Kissed Lamb Chops",
    description: "Charcoal-seared lamb chops tossed in sumac, served with minted tahini and date molasses drizzle.",
    category: "Main",
    price: 1999,
    image: SEEDED_FOOD_IMAGES["Sumac-Kissed Lamb Chops"],
  },
  {
    name: "Coconut Lemongrass Broth",
    description: "Aromatic lemongrass broth with coconut cream, shiitake mushroom, and rice noodles.",
    category: "Soup",
    price: 550,
    image: SEEDED_FOOD_IMAGES["Coconut Lemongrass Broth"],
  },
  {
    name: "Saffron & Honey Glazed Salmon",
    description: "Miso-glazed salmon fillet finished with saffron honey butter and charred broccolini.",
    category: "Seafood",
    price: 1799,
    image: SEEDED_FOOD_IMAGES["Saffron & Honey Glazed Salmon"],
  },
  {
    name: "Lavender Latte Panna Cotta",
    description: "Silky panna cotta infused with lavender, served with a pistachio crumble and candied lemon zest.",
    category: "Dessert",
    price: 450,
    image: SEEDED_FOOD_IMAGES["Lavender Latte Panna Cotta"],
  },
  {
    name: "Crispy Dosa Sliders",
    description: "Mini dosa wraps stuffed with spiced potato hash, coconut chutney, and curry leaf aioli.",
    category: "Fusion",
    price: 499,
    image: SEEDED_FOOD_IMAGES["Crispy Dosa Sliders"],
  },
  {
    name: "Roasted Cauliflower Steak",
    description: "Thick-cut cauliflower with smoked paprika, almond tahini, and burnt citrus jus.",
    category: "Vegetarian",
    price: 799,
    image: SEEDED_FOOD_IMAGES["Roasted Cauliflower Steak"],
  },
  {
    name: "Gold Leaf Espresso Martini",
    description: "Coffee liqueur, cold brew, and vodka crowned with edible gold leaf for a luxe finish.",
    category: "Beverage",
    price: 650,
    image: SEEDED_FOOD_IMAGES["Gold Leaf Espresso Martini"],
  },
  {
    name: "Peri Peri Paneer Skewers",
    description: "Char-grilled paneer skewers brushed with peri peri glaze, bell peppers, and lime crema.",
    category: "Grill",
    price: 575,
    image: SEEDED_FOOD_IMAGES["Peri Peri Paneer Skewers"],
  },
  {
    name: "Mango Chili Cheesecake",
    description: "Baked cheesecake layered with mango compote, chili salt, and buttery biscuit crumble.",
    category: "Dessert",
    price: 425,
    image: SEEDED_FOOD_IMAGES["Mango Chili Cheesecake"],
  },
];

const TARGET_ITEMS_PER_RESTAURANT = 12;

const ensureSampleMenuForRestaurant = async (restaurant, existingFoods) => {
  const existingNames = new Set(existingFoods.map((food) => food.name));
  const foodsToCreate = [];
  const itemsNeeded = Math.max(0, TARGET_ITEMS_PER_RESTAURANT - existingFoods.length);

  for (let i = 0; i < SAMPLE_MENU.length && foodsToCreate.length < itemsNeeded; i += 1) {
    const template = SAMPLE_MENU[i];
    if (existingNames.has(template.name)) {
      continue;
    }

    foodsToCreate.push({
      ...template,
      address: restaurant.address || `${restaurant.city || "Local"} kitchen`,
      rating: String(restaurant.rating || "4.5"),
      deliveryTime: restaurant.deliveryTime || "30-40 mins",
      restaurant: restaurant._id,
      prepTimeMinutes: 12,
      stockQuantity: 100,
      ingredients: ["Fresh ingredients", "Chef spice blend"],
    });
  }

  if (foodsToCreate.length === 0) {
    return 0;
  }

  await Food.insertMany(foodsToCreate);
  return foodsToCreate.length;
};

const run = async () => {
  if (!process.env.MONGO_URL) {
    console.error("Missing MONGO_URL in environment");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    const restaurants = await Restaurant.find();
    let totalAdded = 0;

    for (const restaurant of restaurants) {
      const existingFoods = await Food.find({ restaurant: restaurant._id });
      const toCreate = Math.max(0, TARGET_ITEMS_PER_RESTAURANT - existingFoods.length);

      if (toCreate === 0) {
        console.log(`${restaurant.name} already has ${existingFoods.length} food items`);
        continue;
      }

      const added = await ensureSampleMenuForRestaurant(restaurant, existingFoods);
      totalAdded += added;
      console.log(`Added ${added} dishes for ${restaurant.name} (${existingFoods.length} -> ${existingFoods.length + added})`);
    }

    console.log(`Seed complete. Added ${totalAdded} food items in total.`);
  } catch (error) {
    console.error("Failed to seed foods", error);
  } finally {
    mongoose.connection.close();
  }
};

run();
