const jwt = require("jsonwebtoken");
const DeliveryPartner = require("../models/deliveryModel");

module.exports = async function deliveryAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No delivery token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.scope !== "delivery") {
      return res.status(401).json({ message: "Invalid delivery token scope" });
    }

    const partner = await DeliveryPartner.findById(decoded.id).select("-password -otp");
    if (!partner) {
      return res.status(401).json({ message: "Delivery partner not found" });
    }

    req.deliveryPartner = partner;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid delivery token" });
  }
};
