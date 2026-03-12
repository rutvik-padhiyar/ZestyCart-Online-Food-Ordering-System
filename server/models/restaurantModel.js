// server/models/restaurant.js
const mongoose = require("mongoose");

const PLACEHOLDER_IMAGE = "placeholder-restaurant.svg";

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    panCardImage: { type: String, required: true, default: PLACEHOLDER_IMAGE },
    restaurantImage: { type: String, required: true, default: PLACEHOLDER_IMAGE },
    fssaiLicense: { type: String },
    bankDetails: {
        accountNumber: String,
        ifsc: String,
        bankName: String,
    },

    // ✅ GeoJSON location field: required for nearby search
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
            default: [0, 0],
        },
    },

    // ✅ Block/unblock flag
    isBlocked: { type: Boolean, default: false },
}, {
    timestamps: true,
});

// ✅ Create 2dsphere index for geospatial queries
restaurantSchema.index({ location: "2dsphere" });

module.exports =
    mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);
