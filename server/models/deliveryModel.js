// 📄 models/deliveryModel.js
const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: "" },
    phone: { type: String, required: true, unique: true },
    vehicleType: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    vehicleNumber: { type: String, default: "" },
    aadhaarNumber: { type: String, default: "" },
    drivingLicenseNumber: { type: String, default: "" },
    kycStatus: {
        type: String,
        enum: ["pending", "submitted", "verified", "rejected"],
        default: "pending"
    },
    kycDocuments: {
        aadhaarImage: { type: String, default: "" },
        drivingLicenseImage: { type: String, default: "" },
    },
    otp: { type: String, default: "" },
    otpExpiresAt: { type: Date, default: null },
    lastKnownLocationLabel: { type: String, default: "" },
    totalEarnings: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },

    // ✅ Location fields (TomTom se aayenge)
    address: { type: String, required: true },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },

    // ✅ Track current order
    currentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    }
}, { timestamps: true });

// ✅ Create 2dsphere index for geo queries
deliverySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("DeliveryPartner", deliverySchema);
