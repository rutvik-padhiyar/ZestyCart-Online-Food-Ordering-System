function emitOrderEvent(req, eventName, order, meta = {}) {
    const io = req.app.get("io");
    if (!io || !order) return;

    const payload = {
        eventName,
        orderId: String(order._id),
        restaurantId: order.restaurant ? String(order.restaurant) : null,
        userId: order.user ? String(order.user) : null,
        deliveryBoyId: order.deliveryBoy ? String(order.deliveryBoy) : null,
        status: order.status,
        restaurantStatus: order.restaurantStatus || "",
        deliveryStatus: order.deliveryStatus || "",
        updatedAt: order.updatedAt || new Date(),
        ...meta,
    };

    io.emit("platform:order-updated", payload);
    io.emit("newOrder", payload);
}

module.exports = { emitOrderEvent };
