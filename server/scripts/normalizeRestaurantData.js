require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("../models/restaurantModel");

const PLACEHOLDER_IMAGE = "placeholder-restaurant.svg";

async function run() {
    await mongoose.connect(process.env.MONGO_URL);

    const restaurants = await Restaurant.find();
    let updatedCount = 0;

    for (const restaurant of restaurants) {
        const update = {};

        const coordinates = restaurant.location?.coordinates || [];
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
            update["location.type"] = "Point";
            update["location.coordinates"] = [0, 0];
        }

        if (!restaurant.panCardImage) {
            update.panCardImage = PLACEHOLDER_IMAGE;
        }

        if (!restaurant.restaurantImage) {
            update.restaurantImage = PLACEHOLDER_IMAGE;
        }

        if (Object.keys(update).length > 0) {
            await Restaurant.updateOne({ _id: restaurant._id }, { $set: update });
            updatedCount += 1;
        }
    }

    console.log(JSON.stringify({ updatedCount }, null, 2));
    await mongoose.disconnect();
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
