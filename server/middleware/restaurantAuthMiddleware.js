const jwt = require("jsonwebtoken");
const RestaurantAuth = require("../models/restaurantAuthModel");
const Restaurant = require("../models/restaurantModel");

function normalizeValue(value) {
    return String(value || "").trim().toLowerCase();
}

module.exports = async function restaurantAuthMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No restaurant token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "restaurant") {
            return res.status(401).json({ message: "Invalid restaurant token" });
        }

        const account = await RestaurantAuth.findById(decoded.id).select("-password");
        if (!account) {
            return res.status(401).json({ message: "Restaurant account not found" });
        }

        const normalizedName = normalizeValue(account.name);
        const normalizedEmail = normalizeValue(account.email);
        const possibleRestaurants = await Restaurant.find({
            $or: [
                { email: account.email },
                { name: new RegExp(`^\\s*${String(account.name || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") }
            ]
        }).sort({ createdAt: -1 });

        const matchingRestaurants = possibleRestaurants.filter((restaurant) => {
            const restaurantName = normalizeValue(restaurant.name);
            const restaurantEmail = normalizeValue(restaurant.email);
            return (
                (normalizedEmail && restaurantEmail === normalizedEmail) ||
                (normalizedName && restaurantName === normalizedName)
            );
        });

        const restaurant =
            matchingRestaurants.find((item) => normalizeValue(item.email) === normalizedEmail) ||
            matchingRestaurants.find((item) => normalizeValue(item.name) === normalizedName) ||
            null;

        req.restaurantAuth = account;
        req.restaurantProfile = restaurant || null;
        req.restaurantProfiles = matchingRestaurants;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid restaurant token" });
    }
};
