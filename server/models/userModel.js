const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false, // optional at OTP stage
        trim: true,
    },
    mobile: {
        type: String,
        required: false,
        unique: true,
        sparse: true, // allow multiple nulls
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: ["user", "customer", "restaurant", "partner", "admin", "delivery"],
        default: "user",
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    otpVerified: {
        type: Boolean,
        default: false,
    },
    otp: String,
    otpExpiresAt: Date,

    // 🆕 Profile fields
    address: { type: String, trim: true },
    profileImage: { type: String },

    // 🆕 Blocked field
    isBlocked: {
        type: Boolean,
        default: false,
    },

    // 🆕 Delivery Boy fields
    vehicleType: { type: String, enum: ["bike", "cycle", "scooter", "car"], default: null },
    availability: { type: String, enum: ["free", "busy"], default: "free" },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number], // [lng, lat]
            default: [0, 0],
        },
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    twoFactorSecret: {
        type: String,
        default: null,
    },

    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
});

// ✅ Location index for Geo queries
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);