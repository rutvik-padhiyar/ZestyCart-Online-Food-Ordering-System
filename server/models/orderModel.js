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
    emergency: { type: Boolean, default: false },

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
    restaurantStatus: {
        type: String,
        enum: ["new", "accepted", "preparing", "ready", "rejected"],
        default: "new"
    },
    restaurantAcceptedAt: Date,
    preparationStartedAt: Date,
    readyForPickupAt: Date,
    assignedDeliveryAt: Date,
    estimatedPrepMinutes: { type: Number, default: 15 },
    priorityScore: { type: Number, default: 0 },
    routeOptimizationScore: { type: Number, default: 0 },
    aiSignals: {
        demandPredictionScore: { type: Number, default: 0 },
        fraudRiskScore: { type: Number, default: 0 },
        profitPredictionScore: { type: Number, default: 0 },
    },
    trackingTimeline: [{
        stage: String,
        actor: String,
        note: String,
        at: { type: Date, default: Date.now },
    }],

    deliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryPartner",
        default: null
    },

    deliveryStatus: {
        type: String,
        enum: ["pending", "accepted", "picked", "on-the-way", "delivered", "rejected"],
        default: "pending"
    },
    acceptedAt: Date,
    pickedAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    deliveryConfirmationOtp: { type: String, default: "" },
    deliveryConfirmationPhoto: { type: String, default: "" },
    deliveryEarnings: { type: Number, default: 0 },

}, { timestamps: true });

// GEO INDEX FOR NEAREST DELIVERY PARTNER
orderSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Order", orderSchema);
