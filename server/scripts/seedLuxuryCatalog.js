require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("../models/restaurantModel");
const Food = require("../models/foodModel");

const CITY_CATALOG = [
  { state: "Delhi", city: "New Delhi", lat: 28.6139, lng: 77.209 },
  { state: "Maharashtra", city: "Mumbai", lat: 19.076, lng: 72.8777 },
  { state: "Maharashtra", city: "Pune", lat: 18.5204, lng: 73.8567 },
  { state: "Karnataka", city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { state: "Telangana", city: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { state: "Tamil Nadu", city: "Chennai", lat: 13.0827, lng: 80.2707 },
  { state: "West Bengal", city: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { state: "Gujarat", city: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { state: "Gujarat", city: "Surat", lat: 21.1702, lng: 72.8311 },
  { state: "Rajasthan", city: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { state: "Uttar Pradesh", city: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { state: "Uttar Pradesh", city: "Noida", lat: 28.5355, lng: 77.391 },
  { state: "Madhya Pradesh", city: "Indore", lat: 22.7196, lng: 75.8577 },
  { state: "Madhya Pradesh", city: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { state: "Punjab", city: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { state: "Punjab", city: "Ludhiana", lat: 30.901, lng: 75.8573 },
  { state: "Haryana", city: "Gurugram", lat: 28.4595, lng: 77.0266 },
  { state: "Kerala", city: "Kochi", lat: 9.9312, lng: 76.2673 },
  { state: "Kerala", city: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
  { state: "Goa", city: "Panaji", lat: 15.4909, lng: 73.8278 },
  { state: "Andhra Pradesh", city: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  { state: "Odisha", city: "Bhubaneswar", lat: 20.2961, lng: 85.8245 },
  { state: "Bihar", city: "Patna", lat: 25.5941, lng: 85.1376 },
  { state: "Jharkhand", city: "Ranchi", lat: 23.3441, lng: 85.3096 },
  { state: "Assam", city: "Guwahati", lat: 26.1445, lng: 91.7362 },
  { state: "Chhattisgarh", city: "Raipur", lat: 21.2514, lng: 81.6296 },
  { state: "Uttarakhand", city: "Dehradun", lat: 30.3165, lng: 78.0322 },
  { state: "Himachal Pradesh", city: "Shimla", lat: 31.1048, lng: 77.1734 },
  { state: "Jammu and Kashmir", city: "Srinagar", lat: 34.0837, lng: 74.7973 },
  { state: "Ladakh", city: "Leh", lat: 34.1526, lng: 77.5771 },
  { state: "Sikkim", city: "Gangtok", lat: 27.3389, lng: 88.6065 },
  { state: "Tripura", city: "Agartala", lat: 23.8315, lng: 91.2868 },
  { state: "Meghalaya", city: "Shillong", lat: 25.5788, lng: 91.8933 },
  { state: "Mizoram", city: "Aizawl", lat: 23.7271, lng: 92.7176 },
  { state: "Manipur", city: "Imphal", lat: 24.817, lng: 93.9368 },
  { state: "Nagaland", city: "Dimapur", lat: 25.9091, lng: 93.7266 },
  { state: "Arunachal Pradesh", city: "Itanagar", lat: 27.0844, lng: 93.6053 },
  { state: "Puducherry", city: "Puducherry", lat: 11.9416, lng: 79.8083 },
  { state: "Andaman and Nicobar Islands", city: "Port Blair", lat: 11.6234, lng: 92.7265 },
  { state: "Dadra and Nagar Haveli and Daman and Diu", city: "Daman", lat: 20.3974, lng: 72.8328 },
  { state: "Lakshadweep", city: "Kavaratti", lat: 10.5667, lng: 72.6417 },
];

const RESTAURANT_CONCEPTS = [
  { suffix: "Saffron Pavilion", cuisines: ["North Indian", "Awadhi", "Kebabs"], priceRange: "Royal Fine Dining" },
  { suffix: "Azure Social", cuisines: ["Continental", "Italian", "Cafe"], priceRange: "Modern Bistro" },
  { suffix: "Fire & Tandoor", cuisines: ["Mughlai", "Punjabi", "Grills"], priceRange: "Chef Grill House" },
  { suffix: "Lotus Table", cuisines: ["Pan Asian", "Japanese", "Thai"], priceRange: "Luxury Asian Dining" },
  { suffix: "Velvet Terrace", cuisines: ["Mediterranean", "European", "Desserts"], priceRange: "Rooftop Luxe" },
  { suffix: "Amber Courtyard", cuisines: ["Indian", "Fusion", "Signature Tasting"], priceRange: "Signature Casual Luxury" },
];

const RESTAURANT_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
];

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
];

const FOOD_CATEGORY_IMAGES = {
  Starters: [
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=80",
  ],
  Mains: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  ],
  Rice: [
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1628294896516-0f2d1364c0ef?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80",
  ],
  Desserts: [
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
  ],
  Beverages: [
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80",
  ],
};

const FOOD_TEMPLATES = {
  Starters: ["Truffle Dahi Kebab", "Lotus Stem Crisp", "Smoked Paneer Tikka", "Pepper Corn Croquettes"],
  Mains: ["Awadhi Murgh Lababdar", "Wild Mushroom Ravioli", "Charcoal Kofta Royale", "Saffron Butter Chicken"],
  Rice: ["Nawabi Dum Biryani", "Truffle Herb Rice", "Subz Zafrani Pulao", "Coastal Coconut Rice"],
  Desserts: ["Rose Pistachio Tres Leches", "Dark Chocolate Dome", "Baked Saffron Yogurt", "Mango Basil Cheesecake"],
  Beverages: ["Smoked Jamun Cooler", "Matcha Citrus Spritz", "Saffron Cold Brew", "Sparkling Kokum Elixir"],
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URL);

  const seededRestaurants = await Restaurant.find({ tags: "luxury-seed" }).select("_id");
  const seededIds = seededRestaurants.map((restaurant) => restaurant._id);

  if (seededIds.length) {
    await Food.deleteMany({ restaurant: { $in: seededIds } });
    await Restaurant.deleteMany({ _id: { $in: seededIds } });
  }

  const restaurants = [];

  CITY_CATALOG.forEach((location, cityIndex) => {
    RESTAURANT_CONCEPTS.forEach((concept, conceptIndex) => {
      const restaurantImage = RESTAURANT_IMAGES[conceptIndex % RESTAURANT_IMAGES.length];
      const galleryImages = GALLERY_IMAGES.map((image, imageIndex) => GALLERY_IMAGES[(conceptIndex + imageIndex) % GALLERY_IMAGES.length]);
      const baseName = `${location.city} ${concept.suffix}`;
      const slug = `${location.city}-${concept.suffix}-${conceptIndex}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      restaurants.push({
        name: baseName,
        ownerName: `${location.city} Hospitality Group`,
        mobile: `9${String(100000000 + cityIndex * 100 + conceptIndex).padStart(9, "0")}`,
        email: `${slug}@zesto-luxury.com`,
        city: location.city,
        state: location.state,
        address: `${conceptIndex + 11}, ${location.city} Signature Boulevard, ${location.state}`,
        shortDescription: `${concept.priceRange} dining crafted for elevated evenings in ${location.city}.`,
        description: `${baseName} delivers a high-end experience with plated signatures, warm lighting, premium service rituals and a menu tuned for guests who expect a polished dining journey in ${location.city}.`,
        cuisines: concept.cuisines,
        tags: ["luxury-seed", "Premium Dining", "Chef Curated", location.city, location.state],
        features: ["Valet Access", "Private Dining Corners", "Chef Tasting Plates", "Late Night Service", "Celebration Friendly"],
        galleryImages,
        rating: Number((4.4 + (conceptIndex % 4) * 0.1).toFixed(1)),
        deliveryTime: `${25 + conceptIndex * 5}-${35 + conceptIndex * 5} mins`,
        priceRange: concept.priceRange,
        avgCostForTwo: 1400 + conceptIndex * 250,
        openingHours: conceptIndex % 2 === 0 ? "11:00 AM - 11:45 PM" : "12:00 PM - 12:30 AM",
        panCardImage: "placeholder-restaurant.svg",
        restaurantImage,
        fssaiLicense: `FSSAI${cityIndex}${conceptIndex}8891`,
        bankDetails: {
          accountNumber: `30000000${cityIndex}${conceptIndex}`,
          ifsc: "HDFC0001234",
          bankName: "HDFC Bank",
        },
        location: {
          type: "Point",
          coordinates: [location.lng + conceptIndex * 0.012, location.lat + conceptIndex * 0.012],
        },
        isBlocked: false,
      });
    });
  });

  const createdRestaurants = await Restaurant.insertMany(restaurants);
  const foods = [];

  createdRestaurants.forEach((restaurant, restaurantIndex) => {
    Object.entries(FOOD_TEMPLATES).forEach(([category, names]) => {
      names.forEach((name, itemIndex) => {
        foods.push({
          name,
          description: `${name} at ${restaurant.name} is plated with premium ingredients, elevated textures and a luxury presentation style.`,
          price: 240 + restaurantIndex % 6 * 35 + itemIndex * 20,
          image: FOOD_CATEGORY_IMAGES[category][itemIndex % FOOD_CATEGORY_IMAGES[category].length],
          category,
          address: restaurant.address,
          rating: (4.3 + (itemIndex % 4) * 0.1).toFixed(1),
          deliveryTime: restaurant.deliveryTime,
          restaurant: restaurant._id,
        });
      });
    });
  });

  await Food.insertMany(foods);
  console.log(`Seeded ${createdRestaurants.length} restaurants and ${foods.length} foods.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Luxury catalog seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
