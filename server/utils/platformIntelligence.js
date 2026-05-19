const DeliveryPartner = require("../models/deliveryModel");

function estimatePrepMinutes(foodItems = []) {
    const quantity = foodItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return Math.max(10, Math.min(55, 8 + quantity * 4));
}

function calculatePriorityScore({ totalPrice = 0, foodItems = [], paymentMethod = "COD", emergency = false, createdAt = new Date() }) {
    const quantity = foodItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const ageMinutes = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));

    return (
        (emergency ? 40 : 0) +
        Math.min(25, quantity * 3) +
        Math.min(20, Number(totalPrice || 0) / 40) +
        (paymentMethod === "Online" ? 8 : 0) +
        Math.min(20, ageMinutes)
    );
}

function calculateFraudRisk({ totalPrice = 0, paymentMethod = "COD", address = "", mobile = "" }) {
    let risk = 5;
    if (paymentMethod === "COD" && Number(totalPrice || 0) > 900) risk += 30;
    if (!address || String(address).trim().length < 12) risk += 20;
    if (!mobile || String(mobile).trim().length < 10) risk += 15;
    return Math.min(100, risk);
}

function appendTrackingEvent(order, stage, actor, note = "") {
    const timeline = Array.isArray(order.trackingTimeline) ? order.trackingTimeline : [];
    timeline.push({
        stage,
        actor,
        note,
        at: new Date(),
    });
    order.trackingTimeline = timeline;
}

function ensureOrderLocation(order) {
    const coordinates = order?.location?.coordinates;
    if (Array.isArray(coordinates) && coordinates.length === 2) {
        return;
    }

    order.location = {
        type: "Point",
        coordinates: [0, 0],
    };
}

async function findNearestAvailablePartner({ order, maxDistanceMeters = 12000 }) {
    const baseCoordinates =
        order.location?.coordinates?.length === 2
            ? order.location.coordinates
            : null;

    if (!baseCoordinates) return null;

    return DeliveryPartner.findOne({
        isAvailable: true,
        location: {
            $near: {
                $geometry: { type: "Point", coordinates: baseCoordinates },
                $maxDistance: maxDistanceMeters,
            },
        },
    }).sort({ completedDeliveries: -1 });
}

function buildRestaurantInsights({ orders = [], foods = [] }) {
    const nonRejectedOrders = orders.filter((order) => order.restaurantStatus !== "rejected");
    const deliveredOrders = orders.filter((order) => order.status === "delivered");
    const totalSales = nonRejectedOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    const avgOrderValue = nonRejectedOrders.length ? Math.round(totalSales / nonRejectedOrders.length) : 0;
    const deliveryMinutes = deliveredOrders
        .map((order) => {
            const start = new Date(order.createdAt).getTime();
            const end = new Date(order.deliveredAt || order.updatedAt).getTime();
            return Math.max(0, Math.round((end - start) / 60000));
        })
        .filter(Boolean);
    const avgDeliveryMinutes = deliveryMinutes.length
        ? Math.round(deliveryMinutes.reduce((sum, mins) => sum + mins, 0) / deliveryMinutes.length)
        : 0;

    const demandMap = new Map();
    nonRejectedOrders.forEach((order) => {
        (order.foodItems || []).forEach((item) => {
            const current = demandMap.get(item.name) || 0;
            demandMap.set(item.name, current + Number(item.quantity || 0));
        });
    });

    const demandPrediction = Array.from(demandMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, demand]) => ({ name, demand }));

    const inventoryAlerts = foods
        .filter((food) => Number(food.stockQuantity || 0) <= Number(food.lowStockThreshold || 5))
        .map((food) => ({
            name: food.name,
            stockQuantity: Number(food.stockQuantity || 0),
            lowStockThreshold: Number(food.lowStockThreshold || 5),
        }))
        .slice(0, 8);

    const heatmap = Object.entries(
        nonRejectedOrders.reduce((acc, order) => {
            const area = String(order.address || "Unknown Area").split(",")[0].trim() || "Unknown Area";
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {})
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([area, ordersCount]) => ({ area, ordersCount }));

    const performanceScore = Math.max(
        0,
        Math.min(
            100,
            55 +
                Math.min(20, deliveredOrders.length * 2) +
                (avgDeliveryMinutes && avgDeliveryMinutes <= 40 ? 15 : 0) +
                (inventoryAlerts.length === 0 ? 10 : 0)
        )
    );

    return {
        demandPrediction,
        inventoryAlerts,
        heatmap,
        performanceScore,
        avgOrderValue,
        avgDeliveryMinutes,
        projectedWeeklyRevenue: totalSales ? Math.round((totalSales / Math.max(1, nonRejectedOrders.length)) * 18) : 0,
    };
}

module.exports = {
    estimatePrepMinutes,
    calculatePriorityScore,
    calculateFraudRisk,
    appendTrackingEvent,
    ensureOrderLocation,
    findNearestAvailablePartner,
    buildRestaurantInsights,
};
