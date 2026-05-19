const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/restaurantAuthController");
const restaurantAuth = require("../middleware/restaurantAuthMiddleware");
const {
    getProfile,
    getLiveOrders,
    getOrderHistory,
    getEarnings,
    getInsights,
    restaurantActionOnOrder,
    startPreparation,
    markReady,
    getAvailableDeliveryPartners,
    assignDeliveryPartner,
} = require("../controllers/restaurantConsoleController");

// ✅ Signup Route
router.post("/signup", async(req, res) => {
    try {
        await signup(req, res);
    } catch (error) {
        console.error("❌ Signup route error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Login Route
router.post("/login", async(req, res) => {
    try {
        await login(req, res);
    } catch (error) {
        console.error("❌ Login route error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/me", restaurantAuth, getProfile);
router.get("/orders/live", restaurantAuth, getLiveOrders);
router.get("/orders/history", restaurantAuth, getOrderHistory);
router.get("/earnings", restaurantAuth, getEarnings);
router.get("/insights", restaurantAuth, getInsights);
router.post("/orders/:id/action", restaurantAuth, restaurantActionOnOrder);
router.post("/orders/:id/prepare", restaurantAuth, startPreparation);
router.post("/orders/:id/ready", restaurantAuth, markReady);
router.get("/orders/:id/delivery-partners", restaurantAuth, getAvailableDeliveryPartners);
router.post("/orders/:id/assign-delivery", restaurantAuth, assignDeliveryPartner);

module.exports = router;
