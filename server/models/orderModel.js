const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },

    items: [{
        food: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
        quantity: { type: Number, required: true, default: 1 },
    }],

    foodItems: [
        { name: String, price: Number, quantity: Number }
    ],

    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["COD", "Online"], default: "COD" },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },

    address: { type: String, required: true },
    mobile: { type: String, required: true },

    // ⭐ USER LOCATION FROM OPENSTREETMAP
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },

    status: {
        type: String,
        enum: ["placed", "confirmed", "rejected", "assigned", "picked", "on-the-way", "delivered"],
        default: "placed"
    },

    deliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryPartner",
        default: null
    },

    deliveryStatus: {
        type: String,
        enum: ["pending", "picked", "on-the-way", "delivered"],
        default: "pending"
    }

}, { timestamps: true });

// GEO INDEX FOR NEAREST DELIVERY PARTNER
orderSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Order", orderSchema);
