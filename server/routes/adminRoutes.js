// server/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const moment = require("moment");

const auth = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleCheck");

// Models
const Order = require("../models/orderModel");
const Restaurant = require("../models/restaurantModel");
const User = require("../models/userModel");

// Controllers
const {
    getAdminSummary,
    getAllUsers,
    addUser,
    blockUser,
    unblockUser,
    deleteUser,
    getAllFoods,
    addFood,
    updateFood,
    deleteFood,
    getFoodById
} = require("../controllers/adminController");

const {
    addRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant,
    blockRestaurant
} = require("../controllers/restaurantController");

const getSalesSeries = (orders, days) => {
    const recentLabels = Array.from({ length: days }, (_, index) =>
        moment().subtract(days - index - 1, "days")
    );

    const buildSeries = (labels) => labels.map((day) => {
        const dayStart = day.clone().startOf("day");
        const dayEnd = day.clone().endOf("day");
        const dayOrders = orders.filter((order) => {
            const createdAt = moment(order.createdAt);
            return createdAt.isBetween(dayStart, dayEnd, undefined, "[]");
        });

        return {
            label: day.format("DD MMM"),
            revenue: dayOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
            orders: dayOrders.length,
        };
    });

    const recentSeries = buildSeries(recentLabels);
    const hasRecentData = recentSeries.some((item) => item.orders > 0 || item.revenue > 0);
    if (hasRecentData || orders.length === 0) return recentSeries;

    const activeDays = Array.from(
        new Set(
            orders.map((order) => moment(order.createdAt).format("YYYY-MM-DD"))
        )
    )
        .sort()
        .slice(-days)
        .map((day) => moment(day, "YYYY-MM-DD"));

    return buildSeries(activeDays);
};

const normalizeOrderFoodItems = (order) => {
    if (Array.isArray(order.foodItems) && order.foodItems.length > 0) {
        return order.foodItems;
    }

    return (order.items || []).map((item) => ({
        name: item.food?.name || "Food Item",
        price: item.food?.price || 0,
        quantity: item.quantity || 0,
    }));
};

//
// ================= DASHBOARD SUMMARY =================
//
router.get(
    "/dashboard-summary",
    auth,
    roleCheck(["admin", "partner", "masteradmin"]),
    async(req, res) => {
        try {
            const totalCustomers = await User.countDocuments({ role: "user" });
            const totalPartners = await User.countDocuments({ role: "partner" });
            const totalRestaurants = await Restaurant.countDocuments();

            const orders = await Order.find();

            const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

            const lastWeek = moment().subtract(7, "days").toDate();
            const thisWeekOrders = orders.filter(order => new Date(order.createdAt) > lastWeek);
            const lastWeekOrders = orders.filter(order => new Date(order.createdAt) <= lastWeek);

            const thisRevenue = thisWeekOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
            const lastRevenue = lastWeekOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

            const growthRevenue = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 100;

            res.status(200).json({
                totalCustomers,
                totalPartners,
                totalRestaurants,
                totalOrders: orders.length,
                totalRevenue,
                growthRevenue: growthRevenue.toFixed(2),
            });
        } catch (error) {
            console.error("❌ Dashboard summary error:", error);
            res.status(500).json({ message: "Failed to fetch dashboard summary", error: error.message });
        }
    }
);

router.get(
    "/dashboard-overview",
    auth,
    roleCheck(["admin", "partner", "masteradmin"]),
    async(req, res) => {
        try {
            const totalCustomers = await User.countDocuments({ role: "user" });
            const totalPartners = await User.countDocuments({ role: "partner" });
            const totalRestaurants = await Restaurant.countDocuments();

            const orders = await Order.find()
                .populate("user", "name email")
                .populate("items.food", "name price")
                .populate("restaurant", "name")
                .sort({ createdAt: -1 });

            const todayStart = moment().startOf("day");
            const todayEnd = moment().endOf("day");
            const weekStart = moment().subtract(6, "days").startOf("day");
            const priorWeekStart = moment().subtract(13, "days").startOf("day");
            const priorWeekEnd = moment().subtract(7, "days").endOf("day");

            const todayOrders = orders.filter((order) => moment(order.createdAt).isBetween(todayStart, todayEnd, undefined, "[]"));
            const weekOrders = orders.filter((order) => moment(order.createdAt).isBetween(weekStart, todayEnd, undefined, "[]"));
            const priorWeekOrders = orders.filter((order) => moment(order.createdAt).isBetween(priorWeekStart, priorWeekEnd, undefined, "[]"));

            const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
            const weekRevenue = weekOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
            const priorWeekRevenue = priorWeekOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

            const productMap = new Map();
            orders.forEach((order) => {
                const items = normalizeOrderFoodItems(order);
                items.forEach((item) => {
                    const key = item.name || "Unknown";
                    const current = productMap.get(key) || {
                        name: key,
                        quantity: 0,
                        revenue: 0,
                    };

                    current.quantity += Number(item.quantity || 0);
                    current.revenue += Number(item.price || 0) * Number(item.quantity || 0);
                    productMap.set(key, current);
                });
            });

            const topProducts = Array.from(productMap.values())
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            const paymentBreakdown = {
                paid: orders.filter((order) => (order.paymentStatus || (order.paymentMethod === "Online" ? "paid" : "pending")) === "paid").length,
                pending: orders.filter((order) => (order.paymentStatus || (order.paymentMethod === "Online" ? "paid" : "pending")) === "pending").length,
                failed: orders.filter((order) => order.paymentStatus === "failed").length,
                refunded: orders.filter((order) => order.paymentStatus === "refunded").length,
            };

            const statusBreakdown = {
                placed: orders.filter((order) => order.status === "placed").length,
                confirmed: orders.filter((order) => order.status === "confirmed").length,
                assigned: orders.filter((order) => order.status === "assigned").length,
                onTheWay: orders.filter((order) => order.status === "on-the-way").length,
                delivered: orders.filter((order) => order.status === "delivered").length,
            };

            const recentOrders = orders.slice(0, 10).map((order) => ({
                _id: order._id,
                customerName: order.user?.name || "Guest",
                customerEmail: order.user?.email || "",
                amount: order.totalPrice || 0,
                paymentMethod: order.paymentMethod || "COD",
                paymentStatus: order.paymentStatus || (order.paymentMethod === "Online" ? "paid" : "pending"),
                status: order.status,
                createdAt: order.createdAt,
            }));

            const averageOrderValue = orders.length
                ? Number((orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0) / orders.length).toFixed(2))
                : 0;

            const growthRevenue = priorWeekRevenue > 0
                ? Number((((weekRevenue - priorWeekRevenue) / priorWeekRevenue) * 100).toFixed(1))
                : (weekRevenue > 0 ? 100 : 0);

            res.status(200).json({
                summary: {
                    totalCustomers,
                    totalPartners,
                    totalRestaurants,
                    totalOrders: orders.length,
                    todayOrders: todayOrders.length,
                    todayRevenue,
                    weekRevenue,
                    averageOrderValue,
                    growthRevenue,
                },
                paymentBreakdown,
                statusBreakdown,
                topProducts,
                recentOrders,
                salesSeries: getSalesSeries(orders, 7),
            });
        } catch (error) {
            console.error("Dashboard overview error:", error);
            res.status(500).json({ message: "Failed to fetch dashboard overview", error: error.message });
        }
    }
);

//
// ================= USER MANAGEMENT =================
//
router.get("/users", auth, roleCheck(["admin", "masteradmin"]), getAllUsers);
router.post("/users", auth, roleCheck(["admin", "masteradmin"]), addUser);
router.put("/users/:id/block", auth, roleCheck(["admin", "masteradmin"]), blockUser);
router.put("/users/:id/unblock", auth, roleCheck(["admin", "masteradmin"]), unblockUser);
router.delete("/users/:id", auth, roleCheck(["admin", "masteradmin"]), deleteUser);

//
// ================= FOOD MANAGEMENT =================
//
router.get("/foods", auth, roleCheck(["admin", "masteradmin"]), getAllFoods);
router.post("/foods", auth, roleCheck(["admin", "masteradmin"]), addFood);
router.put("/foods/:id", auth, roleCheck(["admin", "masteradmin"]), updateFood);
router.delete("/foods/:id", auth, roleCheck(["admin", "masteradmin"]), deleteFood);
router.get("/foods/:id", auth, roleCheck(["admin", "masteradmin"]), getFoodById);

//
// ================= RESTAURANT MANAGEMENT =================
//
router.get("/restaurants", auth, roleCheck(["admin", "masteradmin"]), getAllRestaurants);
router.post("/restaurants/add", auth, roleCheck(["admin", "masteradmin"]), addRestaurant);
router.get("/restaurants/:id", auth, roleCheck(["admin", "masteradmin"]), getRestaurantById);
router.put("/restaurants/:id", auth, roleCheck(["admin", "masteradmin"]), updateRestaurant);
router.delete("/restaurants/:id", auth, roleCheck(["admin", "masteradmin"]), deleteRestaurant);
router.patch("/restaurants/block/:id", auth, roleCheck(["admin", "masteradmin"]), blockRestaurant);

module.exports = router;
