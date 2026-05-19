const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: String,
    category: String,
    address: String,
    rating: String,
    deliveryTime: String,
    prepTimeMinutes: { type: Number, default: 12 },
    stockQuantity: { type: Number, default: 50 },
    lowStockThreshold: { type: Number, default: 5 },
    inventoryAlertEnabled: { type: Boolean, default: true },
    ingredients: { type: [String], default: [] },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Food = mongoose.model("Food", foodSchema);
module.exports = Food;
