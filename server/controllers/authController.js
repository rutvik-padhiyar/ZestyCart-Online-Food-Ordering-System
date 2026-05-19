const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

// ✅ In-memory store (for mobile OTP only - used in forgot password)
const OTPStore = new Map();

// ✅ Twilio client setup
const twilioClient = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// ✅ Send Signup OTP to Email
exports.sendSignupOtp = async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        let user = await User.findOne({ email });

        if (user && user.otpVerified) {
            return res.status(409).json({ message: "User already exists" });
        }

        if (!user) {
            user = await User.create({ email, otp, otpExpiresAt });
        } else {
            user.otp = otp;
            user.otpExpiresAt = otpExpiresAt;
            await user.save();
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            to: email,
            subject: "Your Signup OTP",
            text: `Your OTP is: ${otp} (valid for 5 minutes).`,
        });

        res.status(200).json({ message: "OTP sent to email successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
};

// ✅ Verify Signup OTP
exports.verifySignupOtp = async(req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user || !user.otp || !user.otpExpiresAt) {
            return res.status(400).json({ message: "Invalid request" });
        }

        if (user.otp !== otp) {
            return res.status(401).json({ message: "Incorrect OTP" });
        }

        if (new Date() > user.otpExpiresAt) {
            return res.status(400).json({ message: "OTP expired" });
        }

        user.otpVerified = true;
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        res.status(200).json({ message: "OTP verified successfully" });
    } catch (err) {
        res.status(500).json({ message: "OTP verification failed", error: err.message });
    }
};

// ✅ Signup (after email OTP verification)
exports.signup = async(req, res) => {
    try {
        const { name, email, mobile, password, role } = req.body;

        if (!name || !email || !mobile || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });

        if (!user || !user.otpVerified) {
            return res.status(401).json({ message: "Please verify your email OTP first" });
        }

        if (user.password) {
            return res.status(409).json({ message: "User already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.name = name;
        user.mobile = mobile; // ✔️ Only store mobile, no OTP
        user.password = hashedPassword;
        user.role = role;

        await user.save();

        res.status(201).json({ message: "Signup complete", user });
    } catch (error) {
        res.status(500).json({ message: "Signup failed", error: error.message });
    }
};

// ✅ Login
exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        if (user.role === 'admin' && user.twoFactorEnabled) {
            return res.status(200).json({
                message: '2FA required',
                user: {
                    id: user._id,
                    role: user.role,
                }
            });
        }

        const isAdmin = user.role === "admin";

        const token = jwt.sign({ id: user._id, role: user.role, isAdmin },
            process.env.JWT_SECRET, { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                ...user._doc,
                isAdmin,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};

// ✅ Send OTP to Mobile (for Forgot Password only)
exports.sendOtp = async(req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) return res.status(400).json({ message: "Mobile number is required" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = Date.now() + 5 * 60 * 1000;

        OTPStore.set(mobile, { otp, otpExpiresAt });

        // ✅ Send OTP via Twilio
        await twilioClient.messages.create({
            body: `Your OTP for password reset is ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER, // ✅ Your Twilio phone number
            to: mobile, // ✅ User mobile (must be in +91xxxxxxxxxx format)
        });

        res.status(200).json({ message: "OTP sent to mobile via SMS" });
    } catch (err) {
        console.error("❌ Twilio Error:", err.message);
        res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
};

// ✅ Verify OTP from Mobile
exports.verifyOtp = async(req, res) => {
    const { mobile, otp } = req.body;

    const stored = OTPStore.get(mobile);
    if (!stored || stored.otp !== otp || Date.now() > stored.otpExpiresAt) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
};

// ✅ Reset Password using mobile
exports.resetPassword = async(req, res) => {
    const { mobile, newPassword } = req.body;

    if (!mobile || !newPassword) {
        return res.status(400).json({ message: "Mobile and new password required" });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
};
// controllers/authController.js

exports.signupDelivery = async(req, res) => {
    try {
        const { name, email, mobile, password, vehicleType, address } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const delivery = new User({
            name,
            email,
            mobile,
            password: hashedPassword,
            role: "delivery",
            vehicleType,
            address,
            availability: "free",
            isBlocked: false,
        });

        await delivery.save();

        res.status(201).json({
            message: "Delivery partner registered successfully",
            delivery,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Signup failed", error: err.message });
    }
};