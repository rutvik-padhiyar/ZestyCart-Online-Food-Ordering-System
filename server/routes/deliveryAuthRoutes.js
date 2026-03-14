const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleCheck");
const deliveryAuth = require("../middleware/deliveryAuthMiddleware");
const {
  signupDelivery,
  loginDelivery,
  sendDeliveryOtp,
  verifyDeliveryOtp,
  getProfile,
  updateAvailability,
  updateKyc,
  updateLocation,
  getNearbyOrders,
  getAssignedOrders,
  respondToOrder,
  updateOrderStage,
  confirmDelivery,
  getHistory,
  getEarnings,
  getAdminDeliveryPartners,
} = require("../controllers/deliveryAuthController");

router.post("/signup", signupDelivery);
router.post("/login", loginDelivery);
router.post("/send-otp", sendDeliveryOtp);
router.post("/verify-otp", verifyDeliveryOtp);

router.get("/me", deliveryAuth, getProfile);
router.patch("/availability", deliveryAuth, updateAvailability);
router.patch("/kyc", deliveryAuth, updateKyc);
router.patch("/location", deliveryAuth, updateLocation);
router.get("/orders/nearby", deliveryAuth, getNearbyOrders);
router.get("/orders/assigned", deliveryAuth, getAssignedOrders);
router.get("/orders/history", deliveryAuth, getHistory);
router.get("/earnings", deliveryAuth, getEarnings);
router.post("/orders/:id/respond", deliveryAuth, respondToOrder);
router.post("/orders/:id/stage", deliveryAuth, updateOrderStage);
router.post("/orders/:id/confirm-delivery", deliveryAuth, confirmDelivery);

router.get("/admin/partners", auth, roleCheck(["admin", "masteradmin"]), getAdminDeliveryPartners);

module.exports = router;
