const RestaurantAuth = require("../models/restaurantAuthModel");
const Restaurant = require("../models/restaurantModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ Restaurant Signup
exports.signup = async(req, res) => {
    try {
        const { name, email, password, ownerName, phone } = req.body;

        // 🔹 Check required fields
        if (!name || !email || !password || !ownerName || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 🔹 Check if email already exists
        const existingRestaurant = await RestaurantAuth.findOne({ email });
        if (existingRestaurant) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // 🔹 Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔹 Create restaurant with role field
        const restaurant = new RestaurantAuth({
            name,
            email,
            password: hashedPassword,
            ownerName,
            phone,
            role: "restaurant", // ✅ default role
        });

        await restaurant.save();

        const existingListing = await Restaurant.findOne({
            $or: [{ email }, { name }]
        });
        if (!existingListing) {
            await Restaurant.create({
                name,
                ownerName,
                mobile: phone,
                email,
                panCardImage: "placeholder-restaurant.svg",
                restaurantImage: "placeholder-restaurant.svg",
            });
        }

        res.status(201).json({
            message: "Restaurant registered successfully",
            restaurant: {
                id: restaurant._id,
                name: restaurant.name,
                email: restaurant.email,
                role: restaurant.role, // ✅ include role in response
            },
        });
    } catch (err) {
        console.error("❌ Signup error:", err.message);
        res.status(500).json({ message: "Server error during signup" });
    }
};

// ✅ Restaurant Login
exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;

        // 🔹 Check required fields
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // 🔹 Find restaurant by email
        const restaurant = await RestaurantAuth.findOne({ email });
        if (!restaurant) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 🔹 Compare password
        const isMatch = await bcrypt.compare(password, restaurant.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 🔹 Generate JWT with role
        const token = jwt.sign({ id: restaurant._id, role: restaurant.role },
            process.env.JWT_SECRET, { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            restaurant: {
                id: restaurant._id,
                name: restaurant.name,
                email: restaurant.email,
                role: restaurant.role, // ✅ include role in response
            },
        });
    } catch (err) {
        console.error("❌ Login error:", err.message);
        res.status(500).json({ message: "Server error during login" });
    }
};  
