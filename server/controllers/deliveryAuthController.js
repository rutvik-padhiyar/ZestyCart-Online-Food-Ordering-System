const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const DeliveryPartner = require("../models/deliveryModel");
const Order = require("../models/orderModel");

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const OTP_TTL_MS = 5 * 60 * 1000;

async function getLatLng(address) {
  if (!TOMTOM_API_KEY) {
    return { lat: 23.0225, lon: 72.5714 };
  }

  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${TOMTOM_API_KEY}`;
  const { data } = await axios.get(url);

  if (data.results && data.results.length > 0) {
    return {
      lat: data.results[0].position.lat,
      lon: data.results[0].position.lon,
    };
  }

  throw new Error("Address not found");
}

function buildDeliveryToken(partner) {
  return jwt.sign({ id: partner._id, scope: "delivery" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function buildOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function calculateDeliveryFee(order) {
  return Number((Math.max(35, Number(order.totalPrice || 0) * 0.12)).toFixed(0));
}

async function serializePartner(partnerId) {
  return DeliveryPartner.findById(partnerId).select("-password -otp");
}

exports.signupDelivery = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      vehicleType,
      vehicleNumber,
      address,
      aadhaarNumber,
      drivingLicenseNumber,
      aadhaarImage,
      drivingLicenseImage,
    } = req.body;

    const existing = await DeliveryPartner.findOne({
      $or: [{ email }, { phone: mobile }],
    });
    if (existing) return res.status(400).json({ message: "Delivery partner already exists" });

    const hashed = password ? await bcrypt.hash(password, 10) : "";
    const latLng = await getLatLng(address);

    const newPartner = await DeliveryPartner.create({
      name,
      email,
      password: hashed,
      phone: mobile,
      vehicleType,
      vehicleNumber,
      address,
      aadhaarNumber,
      drivingLicenseNumber,
      kycStatus: aadhaarNumber || drivingLicenseNumber ? "submitted" : "pending",
      kycDocuments: {
        aadhaarImage: aadhaarImage || "",
        drivingLicenseImage: drivingLicenseImage || "",
      },
      location: { type: "Point", coordinates: [latLng.lon, latLng.lat] },
      lastKnownLocationLabel: address,
      isAvailable: true,
    });

    return res.status(201).json({
      message: "Delivery partner registered",
      partner: await serializePartner(newPartner._id),
    });
  } catch (err) {
    return res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

exports.loginDelivery = async (req, res) => {
  try {
    const { email, password } = req.body;
    const partner = await DeliveryPartner.findOne({ email });
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    const isMatch = partner.password ? await bcrypt.compare(password, partner.password) : false;
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    return res.json({
      message: "Login successful",
      token: buildDeliveryToken(partner),
      partner: await serializePartner(partner._id),
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
};

exports.sendDeliveryOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    const partner = await DeliveryPartner.findOne({ phone: mobile });
    if (!partner) return res.status(404).json({ message: "Delivery partner not found" });

    const otp = buildOtp();
    partner.otp = otp;
    partner.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    await partner.save();

    return res.json({
      message: "OTP sent to mobile",
      otp,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

exports.verifyDeliveryOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    const partner = await DeliveryPartner.findOne({ phone: mobile });
    if (!partner || !partner.otp || !partner.otpExpiresAt) {
      return res.status(400).json({ message: "OTP not requested" });
    }

    if (partner.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > new Date(partner.otpExpiresAt)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    partner.otp = "";
    partner.otpExpiresAt = null;
    await partner.save();

    return res.json({
      message: "OTP verified",
      token: buildDeliveryToken(partner),
      partner: await serializePartner(partner._id),
    });
  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  return res.json({ partner: req.deliveryPartner });
};

exports.updateAvailability = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      { isAvailable: Boolean(req.body.isAvailable) },
      { new: true }
    ).select("-password -otp");

    return res.json({ message: "Availability updated", partner });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update availability", error: err.message });
  }
};

exports.updateKyc = async (req, res) => {
  try {
    const updates = {
      aadhaarNumber: req.body.aadhaarNumber || req.deliveryPartner.aadhaarNumber,
      drivingLicenseNumber: req.body.drivingLicenseNumber || req.deliveryPartner.drivingLicenseNumber,
      vehicleNumber: req.body.vehicleNumber || req.deliveryPartner.vehicleNumber,
      kycDocuments: {
        aadhaarImage: req.body.aadhaarImage || req.deliveryPartner.kycDocuments?.aadhaarImage || "",
        drivingLicenseImage: req.body.drivingLicenseImage || req.deliveryPartner.kycDocuments?.drivingLicenseImage || "",
      },
    };
    updates.kycStatus = updates.aadhaarNumber && updates.drivingLicenseNumber ? "submitted" : "pending";

    const partner = await DeliveryPartner.findByIdAndUpdate(req.deliveryPartner._id, updates, {
      new: true,
    }).select("-password -otp");

    return res.json({ message: "KYC updated", partner });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update KYC", error: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, label } = req.body;
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      {
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        lastKnownLocationLabel: label || req.deliveryPartner.lastKnownLocationLabel || "",
      },
      { new: true }
    ).select("-password -otp");

    return res.json({ message: "Location updated", partner });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update location", error: error.message });
  }
};

exports.getNearbyOrders = async (req, res) => {
  try {
    const coordinates = req.deliveryPartner.location?.coordinates || [72.5714, 23.0225];
    const radiusKm = Number(req.query.radius || 12);

    const orders = await Order.find({
      deliveryBoy: null,
      status: { $in: ["placed", "confirmed"] },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates },
          $maxDistance: radiusKm * 1000,
        },
      },
    })
      .populate("restaurant", "name city state address location restaurantImage")
      .populate("user", "name")
      .populate("items.food", "name price image")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({
      orders: orders.map((order) => ({
        ...order.toObject(),
        notificationLabel: "Nearby order request",
        earningsPreview: calculateDeliveryFee(order),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch nearby orders", error: error.message });
  }
};

exports.getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryBoy: req.deliveryPartner._id, status: { $ne: "delivered" } })
      .populate("restaurant", "name city state address location restaurantImage")
      .populate("user", "name")
      .populate("items.food", "name price image")
      .sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch assigned orders", error: error.message });
  }
};

exports.respondToOrder = async (req, res) => {
  try {
    const { action } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (action === "accept") {
      order.deliveryBoy = req.deliveryPartner._id;
      order.status = "assigned";
      order.deliveryStatus = "accepted";
      order.acceptedAt = new Date();
      order.deliveryConfirmationOtp = buildOtp();
      order.deliveryEarnings = calculateDeliveryFee(order);

      await DeliveryPartner.findByIdAndUpdate(req.deliveryPartner._id, {
        isAvailable: false,
        currentOrder: order._id,
      });
    } else if (action === "reject") {
      order.deliveryBoy = null;
      order.status = "confirmed";
      order.deliveryStatus = "rejected";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await order.save();
    return res.json({ message: `Order ${action}ed`, order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to respond to order", error: error.message });
  }
};

exports.updateOrderStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const order = await Order.findOne({ _id: req.params.id, deliveryBoy: req.deliveryPartner._id });
    if (!order) return res.status(404).json({ message: "Assigned order not found" });

    if (stage === "picked") {
      order.deliveryStatus = "picked";
      order.status = "picked";
      order.pickedAt = new Date();
    } else if (stage === "on-the-way") {
      order.deliveryStatus = "on-the-way";
      order.status = "on-the-way";
      order.outForDeliveryAt = new Date();
    } else {
      return res.status(400).json({ message: "Invalid stage" });
    }

    await order.save();
    return res.json({ message: "Order stage updated", order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order stage", error: error.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const { otp, photo } = req.body;
    const order = await Order.findOne({ _id: req.params.id, deliveryBoy: req.deliveryPartner._id });
    if (!order) return res.status(404).json({ message: "Assigned order not found" });
    if (!order.deliveryConfirmationOtp || order.deliveryConfirmationOtp !== otp) {
      return res.status(400).json({ message: "Invalid delivery OTP" });
    }

    order.deliveryStatus = "delivered";
    order.status = "delivered";
    order.deliveredAt = new Date();
    order.deliveryConfirmationPhoto = photo || "";
    await order.save();

    const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
    partner.isAvailable = true;
    partner.currentOrder = null;
    partner.totalEarnings = Number(partner.totalEarnings || 0) + Number(order.deliveryEarnings || 0);
    partner.completedDeliveries = Number(partner.completedDeliveries || 0) + 1;
    await partner.save();

    return res.json({ message: "Delivery confirmed", order, partner: await serializePartner(partner._id) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to confirm delivery", error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryBoy: req.deliveryPartner._id, status: "delivered" })
      .populate("restaurant", "name city state")
      .sort({ deliveredAt: -1, createdAt: -1 })
      .limit(100);

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryBoy: req.deliveryPartner._id, status: "delivered" });
    const todayKey = new Date().toDateString();
    const dailyIncome = orders
      .filter((order) => new Date(order.deliveredAt || order.updatedAt).toDateString() === todayKey)
      .reduce((sum, order) => sum + Number(order.deliveryEarnings || 0), 0);

    return res.json({
      summary: {
        totalEarnings: req.deliveryPartner.totalEarnings || 0,
        completedDeliveries: req.deliveryPartner.completedDeliveries || 0,
        dailyIncome,
      },
      chart: [
        { label: "Daily", value: dailyIncome },
        { label: "Total", value: req.deliveryPartner.totalEarnings || 0 },
        { label: "Deliveries", value: req.deliveryPartner.completedDeliveries || 0 },
      ],
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch earnings", error: error.message });
  }
};

exports.getAdminDeliveryPartners = async (req, res) => {
  try {
    const partners = await DeliveryPartner.find().select("-password -otp").sort({ createdAt: -1 });
    return res.json({ partners });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch delivery partners", error: error.message });
  }
};
