const Order = require("../models/orderModel");
const Restaurant = require("../models/restaurantModel");
const DeliveryPartner = require("../models/deliveryModel");
const Food = require("../models/foodModel");
const { emitOrderEvent } = require("../utils/orderEvents");
const {
    appendTrackingEvent,
    ensureOrderLocation,
    findNearestAvailablePartner,
    buildRestaurantInsights,
} = require("../utils/platformIntelligence");

function calculateDeliveryFee(order) {
    return Number((Math.max(35, Number(order.totalPrice || 0) * 0.12)).toFixed(0));
}

function buildOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getRestaurantQuery(req) {
    const ids = [];
    for (const restaurant of req.restaurantProfiles || []) {
        if (restaurant?._id) ids.push(String(restaurant._id));
    }
    if (req.restaurantProfile?._id) ids.push(String(req.restaurantProfile._id));
    return ids.length ? { restaurant: { $in: ids } } : null;
}

function hydrateOrder(order) {
    const hasFoodItems = Array.isArray(order.foodItems) && order.foodItems.length > 0;
    const derivedFoodItems = hasFoodItems
        ? order.foodItems
        : (order.items || []).map((item) => ({
            name: item.food?.name || "Food Item",
            price: item.food?.price || 0,
            quantity: item.quantity || 0,
        }));

    let restaurantStatus = order.restaurantStatus;
    if (!restaurantStatus) {
        if (order.status === "rejected") restaurantStatus = "rejected";
        else if (order.status === "delivered") restaurantStatus = "ready";
        else if (order.status === "assigned" || order.status === "confirmed") restaurantStatus = "accepted";
        else restaurantStatus = "new";
    }

    return {
        ...order.toObject(),
        foodItems: derivedFoodItems,
        restaurantStatus,
    };
}

exports.getProfile = async (req, res) => {
    return res.json({
        account: req.restaurantAuth,
        restaurant: req.restaurantProfile,
        linkedRestaurants: req.restaurantProfiles || [],
    });
};

exports.getLiveOrders = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) return res.json({ orders: [] });

        const orders = await Order.find({
            ...query,
            status: { $ne: "delivered" },
            restaurantStatus: { $ne: "rejected" },
        })
            .populate("user", "name email mobile")
            .populate("items.food", "name price image")
            .populate("deliveryBoy", "name phone vehicleType isAvailable location")
            .sort({ createdAt: -1 });

        return res.json({ orders: orders.map(hydrateOrder) });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch live orders", error: error.message });
    }
};

exports.getOrderHistory = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) return res.json({ orders: [] });

        const orders = await Order.find({
            ...query,
            $or: [
                { status: "delivered" },
                { restaurantStatus: "rejected" }
            ]
        })
            .populate("user", "name email mobile")
            .populate("deliveryBoy", "name phone vehicleType")
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(100);

        return res.json({ orders: orders.map(hydrateOrder) });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch order history", error: error.message });
    }
};

exports.getEarnings = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) {
            return res.json({ summary: { totalSales: 0, completedOrders: 0, readyOrders: 0, activeOrders: 0 } });
        }

        const orders = await Order.find(query);
        const delivered = orders.filter((order) => order.status === "delivered");
        const nonRejected = orders.filter((order) => order.restaurantStatus !== "rejected");

        return res.json({
            summary: {
                totalSales: nonRejected.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
                completedOrders: delivered.length,
                readyOrders: orders.filter((order) => order.restaurantStatus === "ready").length,
                activeOrders: orders.filter((order) => !["delivered", "rejected"].includes(order.status)).length,
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch earnings", error: error.message });
    }
};

exports.getInsights = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) {
            return res.json({
                demandPrediction: [],
                inventoryAlerts: [],
                heatmap: [],
                performanceScore: 0,
                avgOrderValue: 0,
                avgDeliveryMinutes: 0,
                projectedWeeklyRevenue: 0,
            });
        }

        const [orders, foods] = await Promise.all([
            Order.find(query).lean(),
            Food.find({ restaurant: query.restaurant.$in }).lean(),
        ]);

        return res.json(buildRestaurantInsights({ orders, foods }));
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch restaurant insights", error: error.message });
    }
};

exports.restaurantActionOnOrder = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) return res.status(404).json({ message: "Restaurant profile not linked" });

        const order = await Order.findOne({ _id: req.params.id, ...query });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (req.body.action === "accept") {
            order.status = order.deliveryBoy ? "assigned" : "confirmed";
            order.restaurantStatus = "accepted";
            order.restaurantAcceptedAt = new Date();
            appendTrackingEvent(order, "restaurant_accepted", "restaurant", "Restaurant accepted the order");
        } else if (req.body.action === "reject") {
            order.status = "rejected";
            order.restaurantStatus = "rejected";
            appendTrackingEvent(order, "restaurant_rejected", "restaurant", "Restaurant rejected the order");
            if (order.deliveryBoy) {
                await DeliveryPartner.findByIdAndUpdate(order.deliveryBoy, {
                    $pull: { activeOrders: order._id },
                    isAvailable: true,
                    currentOrder: null
                });
                order.deliveryBoy = null;
                order.deliveryStatus = "rejected";
            }
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        ensureOrderLocation(order);
        await order.save({ validateBeforeSave: false });
        emitOrderEvent(req, `order.${req.body.action}`, order);
        return res.json({ message: "Order updated", order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update order", error: error.message });
    }
};

exports.startPreparation = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) return res.status(404).json({ message: "Restaurant profile not linked" });

        const order = await Order.findOne({ _id: req.params.id, ...query });
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.status = order.deliveryBoy ? "assigned" : "confirmed";
        order.restaurantStatus = "preparing";
        order.preparationStartedAt = new Date();
        appendTrackingEvent(order, "kitchen_preparing", "restaurant", "Order sent to kitchen preparation");
        ensureOrderLocation(order);
        await order.save({ validateBeforeSave: false });

        emitOrderEvent(req, "order.preparing", order);
        return res.json({ message: "Preparation started", order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to start preparation", error: error.message });
    }
};

exports.markReady = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) return res.status(404).json({ message: "Restaurant profile not linked" });

        const order = await Order.findOne({ _id: req.params.id, ...query });
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.restaurantStatus = "ready";
        order.readyForPickupAt = new Date();
        appendTrackingEvent(order, "ready_for_pickup", "restaurant", "Food marked ready for pickup");
        if (!order.deliveryBoy) {
            order.status = "confirmed";
            order.deliveryStatus = "pending";

            const partner = await findNearestAvailablePartner({ order });
            if (partner) {
                order.deliveryBoy = partner._id;
                order.status = "assigned";
                order.assignedDeliveryAt = new Date();
                order.deliveryConfirmationOtp = buildOtp();
                order.deliveryEarnings = calculateDeliveryFee(order);
                appendTrackingEvent(order, "delivery_auto_assigned", "system", `Auto-assigned to ${partner.name}`);
                partner.currentOrder = order._id;
                const activeOrders = Array.isArray(partner.activeOrders) ? partner.activeOrders : [];
                if (!activeOrders.some((item) => String(item) === String(order._id))) {
                    activeOrders.push(order._id);
                }
                partner.activeOrders = activeOrders;
                partner.isAvailable = (partner.activeOrders || []).length < Number(partner.maxConcurrentOrders || 3);
                await partner.save();
            }
        }
        ensureOrderLocation(order);
        await order.save({ validateBeforeSave: false });

        emitOrderEvent(req, "order.ready", order, { autoAssigned: Boolean(order.deliveryBoy) });
        return res.json({ message: "Order ready for pickup", order });
    } catch (error) {
        return res.status(500).json({ message: "Failed to mark ready", error: error.message });
    }
};

exports.getAvailableDeliveryPartners = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) return res.json({ partners: [] });

        const order = await Order.findOne({ _id: req.params.id, ...query }).populate("restaurant", "location city state");
        if (!order) return res.status(404).json({ message: "Order not found" });

        const baseCoordinates =
            order.location?.coordinates?.length === 2
                ? order.location.coordinates
                : order.restaurant?.location?.coordinates || [0, 0];

        const partners = await DeliveryPartner.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: baseCoordinates },
                    distanceField: "distanceInMeters",
                    spherical: true,
                    query: { isAvailable: true },
                }
            },
            { $sort: { distanceInMeters: 1, completedDeliveries: -1 } },
            { $limit: 12 },
            {
                $project: {
                    name: 1,
                    email: 1,
                    phone: 1,
                    vehicleType: 1,
                    completedDeliveries: 1,
                    totalEarnings: 1,
                    lastKnownLocationLabel: 1,
                    distanceInKm: { $round: [{ $divide: ["$distanceInMeters", 1000] }, 2] },
                    speedScore: {
                        $add: [
                            { $multiply: [{ $ifNull: ["$completedDeliveries", 0] }, 1] },
                            { $cond: [{ $lt: ["$distanceInMeters", 3000] }, 30, 0] }
                        ]
                    }
                }
            }
        ]);

        return res.json({ partners });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch delivery partners", error: error.message });
    }
};

exports.assignDeliveryPartner = async (req, res) => {
    try {
        const query = getRestaurantQuery(req);
        if (!query) return res.status(404).json({ message: "Restaurant profile not linked" });

        const order = await Order.findOne({ _id: req.params.id, ...query });
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.restaurantStatus !== "ready") {
            return res.status(400).json({ message: "Order must be ready for pickup before assigning delivery" });
        }

        const partner = await DeliveryPartner.findOne({ _id: req.body.partnerId, isAvailable: true });
        if (!partner) return res.status(404).json({ message: "Delivery partner unavailable" });

        order.deliveryBoy = partner._id;
        order.status = "assigned";
        order.deliveryStatus = "pending";
        order.assignedDeliveryAt = new Date();
        order.deliveryConfirmationOtp = buildOtp();
        order.deliveryEarnings = calculateDeliveryFee(order);
        appendTrackingEvent(order, "delivery_assigned", "system", `Assigned to ${partner.name}`);
        ensureOrderLocation(order);
        await order.save({ validateBeforeSave: false });

        partner.activeOrders = Array.from(new Set([...(partner.activeOrders || []).map(String), String(order._id)]));
        partner.isAvailable = partner.activeOrders.length < Number(partner.maxConcurrentOrders || 3);
        partner.currentOrder = order._id;
        await partner.save();

        emitOrderEvent(req, "order.delivery-assigned", order, { deliveryBoyId: partner._id });
        return res.json({ message: "Delivery partner assigned", order, partner });
    } catch (error) {
        return res.status(500).json({ message: "Failed to assign delivery partner", error: error.message });
    }
};
