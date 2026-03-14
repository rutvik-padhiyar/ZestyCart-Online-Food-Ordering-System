// server/controllers/restaurantController.js
const Restaurant = require("../models/restaurantModel");

// ✅ Add restaurant (expects latitude & longitude in body or form-data)
const addRestaurant = async (req, res) => {
  try {
    const {
      name,
      ownerName,
      mobile,
      email,
      city,
      state,
      address,
      shortDescription,
      description,
      cuisines,
      tags,
      features,
      galleryImages,
      rating,
      deliveryTime,
      priceRange,
      avgCostForTwo,
      openingHours,
      fssaiLicense,
      accountNumber,
      ifsc,
      bankName,
      latitude,
      longitude
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "latitude and longitude required" });
    }

    const panCardImage =
      req.files?.panCardImage?.[0]?.filename || req.body.panCardImage || "";
    const restaurantImage =
      req.files?.restaurantImage?.[0]?.filename || req.body.restaurantImage || "";

    const newRestaurant = new Restaurant({
      name,
      ownerName,
      mobile,
      email,
      city,
      state,
      address,
      shortDescription,
      description,
      cuisines: normalizeStringArray(cuisines),
      tags: normalizeStringArray(tags),
      features: normalizeStringArray(features),
      galleryImages: normalizeStringArray(galleryImages),
      rating: rating ? Number(rating) : undefined,
      deliveryTime,
      priceRange,
      avgCostForTwo: avgCostForTwo ? Number(avgCostForTwo) : undefined,
      openingHours,
      panCardImage,
      restaurantImage,
      fssaiLicense,
      bankDetails: { accountNumber, ifsc, bankName },
      location: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      isBlocked: false, // default
    });

    await newRestaurant.save();
    return res.status(201).json({ message: "Restaurant added", restaurant: newRestaurant });
  } catch (err) {
    console.error("addRestaurant error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

function normalizeStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// ✅ Get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const list = await Restaurant.find({ isBlocked: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json(list);
  } catch (err) {
    console.error("getAllRestaurants error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get restaurant by id
const getRestaurantById = async (req, res) => {
  try {
    const r = await Restaurant.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Not found" });
    return res.json(r);
  } catch (err) {
    console.error("getRestaurantById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update restaurant
const updateRestaurant = async (req, res) => {
  try {
    const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Restaurant not found" });
    return res.json({ message: "Restaurant updated", restaurant: updated });
  } catch (err) {
    console.error("updateRestaurant error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete restaurant
const deleteRestaurant = async (req, res) => {
  try {
    const deleted = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Restaurant not found" });
    return res.json({ message: "Restaurant deleted" });
  } catch (err) {
    console.error("deleteRestaurant error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Block / Unblock restaurant
const blockRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).select("isBlocked");
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $set: { isBlocked: !restaurant.isBlocked } },
      { new: true }
    );

    return res.json({
      message: `Restaurant ${updatedRestaurant.isBlocked ? "blocked" : "unblocked"}`,
      restaurant: updatedRestaurant,
    });
  } catch (err) {
    console.error("blockRestaurant error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get nearby restaurants (for user location)
const getNearbyRestaurants = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    let distance = req.query.distance
      ? Number(req.query.distance)
      : req.query.radius
      ? Number(req.query.radius)
      : 5;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "Invalid or missing lat/lng in query" });
    }

    let maxDistanceMeters = distance <= 1000 ? distance * 1000 : distance;

    const results = await Restaurant.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distanceInMeters",
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: { isBlocked: { $ne: true } },
        },
      },
      {
        $addFields: {
          distanceInKm: { $round: [{ $divide: ["$distanceInMeters", 1000] }, 2] },
        },
      },
      { $sort: { distanceInMeters: 1 } },
    ]);

    const cleanResults = results.filter((restaurant) => {
      const coordinates = restaurant.location?.coordinates || [];
      return !(coordinates[0] === 0 && coordinates[1] === 0);
    });

    return res.json(cleanResults);
  } catch (err) {
    console.error("getNearbyRestaurants error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  addRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  blockRestaurant,
  getNearbyRestaurants,
};
