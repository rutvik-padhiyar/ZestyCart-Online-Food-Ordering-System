const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleCheck");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Food = require("../models/foodModel");
const Restaurant = require("../models/restaurantModel");
const sendOrderEmail = require("../utils/sendOrderEmail");
const { emitOrderEvent } = require("../utils/orderEvents");
const { estimatePrepMinutes, calculatePriorityScore, calculateFraudRisk } = require("../utils/platformIntelligence");

const parseDateInput = (value, endOfDay = false) => {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        return endOfDay
            ? new Date(year, month - 1, day, 23, 59, 59, 999)
            : new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    if (endOfDay) parsed.setHours(23, 59, 59, 999);
    else parsed.setHours(0, 0, 0, 0);

    return parsed;
};

const buildDateRange = (from, to) => {
    if (!from && !to) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { $gte: start, $lte: end };
    }

    const range = {};
    if (from) {
        const start = parseDateInput(from);
        if (start) range.$gte = start;
    }
    if (to) {
        const end = parseDateInput(to, true);
        if (end) range.$lte = end;
    }
    return range;
};


// ================== 1️⃣ Place Order (LOCATION ADDED) ==================
router.post("/place", auth, async(req, res) => {
    try {
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0)
            return res.status(400).json({ message: "🛒 Cart khali hai" });

        let totalAmount = 0;
        const validItems = [];
        const foodItems = [];

        cart.items.forEach((item) => {
            if (!item.product || !item.product.price || !item.product.restaurant) return;

            totalAmount += item.product.price * item.quantity;
            validItems.push({ food: item.product._id, quantity: item.quantity });
            foodItems.push({
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
            });
        });

        if (validItems.length === 0)
            return res.status(400).json({ message: "❌ Sab cart items invalid hai" });

        // ================== RESTAURANT ==================
        const restaurantId = cart.items[0].product.restaurant;
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: "❌ Restaurant not found" });

        // ================== MOBILE & ADDRESS ==================
        const mobile = req.body.mobile || req.user.mobile;
        if (!mobile) return res.status(400).json({ message: "❌ Mobile number required" });

        const address = req.body.address || req.user.address || "No Address Provided";

        // ================== ⭐ LOCATION VALIDATION ==================
        const location = req.body.location;
        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ message: "❌ Map se exact location select karo" });
        }

        // ================== CREATE ORDER ==================
        const newOrder = await Order.create({
            user: userId,
            restaurant: restaurantId,
            items: validItems,
            foodItems,
            totalPrice: totalAmount,
            paymentMethod: req.body.paymentMethod || "COD",
            paymentStatus: req.body.paymentMethod === "Online" ? "paid" : "pending",
            emergency: Boolean(req.body.emergency),
            address,
            mobile,
            status: "placed",
            restaurantStatus: "new",
            estimatedPrepMinutes: estimatePrepMinutes(foodItems),
            priorityScore: calculatePriorityScore({
                totalPrice: totalAmount,
                foodItems,
                paymentMethod: req.body.paymentMethod || "COD",
                emergency: Boolean(req.body.emergency),
            }),
            aiSignals: {
                demandPredictionScore: Math.min(100, foodItems.reduce((sum, item) => sum + Number(item.quantity || 0) * 8, 0)),
                fraudRiskScore: calculateFraudRisk({
                    totalPrice: totalAmount,
                    paymentMethod: req.body.paymentMethod || "COD",
                    address,
                    mobile,
                }),
                profitPredictionScore: Math.min(100, Math.round(totalAmount * 0.22)),
            },
            trackingTimeline: [{
                stage: "order_placed",
                actor: "user",
                note: "Order created from customer application",
                at: new Date(),
            }],

            // ⭐ SAVE LOCATION (GEOJSON POINT)
            location: {
                type: "Point",
                coordinates: [location.lng, location.lat]
            }
        });

        // ================== EMAIL TRY ==================
        const orderDetails = {
            orderId: newOrder._id,
            customerName: req.user.name,
            items: foodItems,
            totalAmount,
            deliveryTime: 35,
        };

        try {
            await sendOrderEmail(req.user.email, restaurant.email, orderDetails);
        } catch (err) {
            console.error("❌ Email failed:", err.message);
        }

        for (const item of cart.items) {
            if (!item.product?._id) continue;
            await Food.findByIdAndUpdate(item.product._id, {
                $inc: { stockQuantity: -Number(item.quantity || 0) }
            });
        }

        // ================== CART CLEAR ==================
        await Cart.findOneAndDelete({ user: userId });

        emitOrderEvent(req, "order.placed", newOrder, {
            totalPrice: newOrder.totalPrice,
            estimatedPrepMinutes: newOrder.estimatedPrepMinutes,
            priorityScore: newOrder.priorityScore,
        });

        res.status(201).json({
            message: "✅ Order placed with live location",
            order: newOrder
        });

    } catch (err) {
        console.error("❌ Order error:", err.message);
        res.status(500).json({ message: "Order place nahi ho paya", error: err.message });
    }
});



// ================== 2️⃣ My Orders ==================
router.get("/my-orders", auth, async(req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate("items.food", "name price image")
            .populate("restaurant", "name")
            .sort({ createdAt: -1 });
        res.status(200).json({ message: "✅ Your orders fetched", orders });
    } catch (err) {
        console.error("❌ Failed to fetch orders:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});



// ================== 3️⃣ Admin - All Orders ==================
router.get("/all", auth, roleCheck(["admin", "masteradmin", "partner"]), async(req, res) => {
    try {
        const { from, to, status, paymentStatus, paymentMethod, search } = req.query;
        const query = { createdAt: buildDateRange(from, to) };

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (paymentMethod) query.paymentMethod = paymentMethod;

        let orders = await Order.find(query)
            .populate("user", "name email")
            .populate("items.food", "name price")
            .populate("restaurant", "name")
            .sort({ createdAt: -1 });
        orders = orders.map((order) => {
            const hasFoodItems = Array.isArray(order.foodItems) && order.foodItems.length > 0;
            const derivedFoodItems = hasFoodItems
                ? order.foodItems
                : (order.items || []).map((item) => ({
                    name: item.food?.name || "Food Item",
                    price: item.food?.price || 0,
                    quantity: item.quantity || 0,
                }));

            return {
                ...order.toObject(),
                foodItems: derivedFoodItems,
                paymentStatus: order.paymentStatus || (order.paymentMethod === "Online" ? "paid" : "pending"),
            };
        });

        if (search) {
            const needle = search.toLowerCase();
            orders = orders.filter((order) => {
                const customerName = order.user?.name?.toLowerCase() || "";
                const customerEmail = order.user?.email?.toLowerCase() || "";
                const items = (order.foodItems || [])
                    .map((item) => item.name?.toLowerCase() || "")
                    .join(" ");

                return customerName.includes(needle) ||
                    customerEmail.includes(needle) ||
                    items.includes(needle);
            });
        }
        res.status(200).json({ message: "✅ Orders fetched", orders });
    } catch (err) {
        console.error("❌ Orders fetch error:", err.message);
        res.status(500).json({ message: "Orders fetch nahi ho paye", error: err.message });
    }
});



// ================== 4️⃣ Orders Count ==================
router.get("/count", auth, roleCheck(["admin", "masteradmin"]), async(req, res) => {
    try {
        const count = await Order.countDocuments();
        res.status(200).json({ totalOrders: count });
    } catch (err) {
        console.error("❌ Order count error:", err.message);
        res.status(500).json({ message: "Count fetch nahi ho paya" });
    }
});



// ================== 5️⃣ Total Revenue ==================
router.get("/total-revenue", auth, roleCheck(["admin"]), async(req, res) => {
    try {
        const orders = await Order.find();
        const totalRevenue = orders.reduce((acc, order) => acc + Number(order.totalPrice || 0), 0);
        res.status(200).json({ totalRevenue });
    } catch (error) {
        console.error("❌ Failed to calculate revenue:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});



// ================== 6️⃣ Monthly Sales for Chart ==================
router.get("/monthly-sales", auth, roleCheck(["admin"]), async(req, res) => {
    try {
        const orders = await Order.find();

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const monthlyRevenue = months.map((month, index) => {
            const revenue = orders
                .filter((order) => order.createdAt.getMonth() === index)
                .reduce((acc, order) => acc + Number(order.totalPrice || 0), 0);
            return { month, revenue };
        });

        res.status(200).json(monthlyRevenue);
    } catch (err) {
        console.error("❌ Monthly sales fetch error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});



// ================== 7️⃣ Single Order Detail ==================
router.get("/:id", auth, async(req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .populate("restaurant", "name")
            .populate("items.food", "name price image");

        if (!order) return res.status(404).json({ message: "❌ Order nahi mila" });

        res.status(200).json({ message: "✅ Order fetched", order });
    } catch (err) {
        console.error("❌ Order fetch error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});



// ================== 8️⃣ Update Order Status ==================
router.patch("/update-status/:id", auth, roleCheck(["admin", "masteradmin", "partner"]), async(req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "❌ Order nahi mila" });

        if (req.body.status) order.status = req.body.status;
        if (req.body.paymentMethod) order.paymentMethod = req.body.paymentMethod;
        if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;

        await order.save();
        res.json({ message: "✅ Order update ho gaya", order });
    } catch (err) {
        console.error("❌ Order update error:", err.message);
        res.status(500).json({ message: "Order update nahi ho paya", error: err.message });
    }
});



// ================== 9️⃣ Delete Order ==================
router.delete("/:id", auth, roleCheck(["admin", "masteradmin", "partner"]), async(req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: "❌ Order not found" });

        res.json({ message: "✅ Order deleted successfully" });
    } catch (err) {
        console.error("❌ Delete order error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
