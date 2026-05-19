require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("../models/restaurantModel");

const PLACEHOLDER_IMAGE = "placeholder-restaurant.svg";

const restaurants = [
    {
        name: "Royal Deesa Courtyard",
        ownerName: "Harshad Joshi",
        mobile: "9011001101",
        email: "royaldeesa@zestycart.local",
        city: "Deesa",
        lat: 24.2586,
        lng: 72.1907,
    },
    {
        name: "Spice Darbar Deesa",
        ownerName: "Nikita Shah",
        mobile: "9011001102",
        email: "spicedeesa@zestycart.local",
        city: "Deesa",
        lat: 24.2554,
        lng: 72.1829,
    },
    {
        name: "Patola Plates Deesa",
        ownerName: "Karan Rabari",
        mobile: "9011001103",
        email: "patoladeesa@zestycart.local",
        city: "Deesa",
        lat: 24.252,
        lng: 72.1861,
    },
    {
        name: "Lakeview Tadka Deesa",
        ownerName: "Riddhi Panchal",
        mobile: "9011001104",
        email: "lakeviewdeesa@zestycart.local",
        city: "Deesa",
        lat: 24.2621,
        lng: 72.1964,
    },
    {
        name: "Palanpur Haveli Kitchen",
        ownerName: "Manav Trivedi",
        mobile: "9011001201",
        email: "havelipalanpur@zestycart.local",
        city: "Palanpur",
        lat: 24.1725,
        lng: 72.4382,
    },
    {
        name: "Saffron Square Palanpur",
        ownerName: "Bhumi Patel",
        mobile: "9011001202",
        email: "saffronpalanpur@zestycart.local",
        city: "Palanpur",
        lat: 24.1704,
        lng: 72.4346,
    },
    {
        name: "Banas Bistro Palanpur",
        ownerName: "Dev Solanki",
        mobile: "9011001203",
        email: "banaspalanpur@zestycart.local",
        city: "Palanpur",
        lat: 24.175,
        lng: 72.4429,
    },
    {
        name: "Heritage Oven Palanpur",
        ownerName: "Krupa Mehta",
        mobile: "9011001204",
        email: "heritagepalanpur@zestycart.local",
        city: "Palanpur",
        lat: 24.1688,
        lng: 72.4298,
    },
    {
        name: "Sabarmati Social Ahmedabad",
        ownerName: "Yash Vora",
        mobile: "9011001301",
        email: "sabarmati@zestycart.local",
        city: "Ahmedabad",
        lat: 23.0225,
        lng: 72.5714,
    },
    {
        name: "Kankaria Table Ahmedabad",
        ownerName: "Mahi Desai",
        mobile: "9011001302",
        email: "kankaria@zestycart.local",
        city: "Ahmedabad",
        lat: 23.0063,
        lng: 72.5963,
    },
    {
        name: "Ellis Bridge Pantry",
        ownerName: "Aryan Shah",
        mobile: "9011001303",
        email: "ellisbridge@zestycart.local",
        city: "Ahmedabad",
        lat: 23.0284,
        lng: 72.5596,
    },
    {
        name: "Riverfront Roast Ahmedabad",
        ownerName: "Heena Gohil",
        mobile: "9011001304",
        email: "riverfront@zestycart.local",
        city: "Ahmedabad",
        lat: 23.0307,
        lng: 72.5665,
    },
];

async function run() {
    await mongoose.connect(process.env.MONGO_URL);

    for (const restaurant of restaurants) {
        await Restaurant.updateOne(
            { name: restaurant.name },
            {
                $set: {
                    name: restaurant.name,
                    ownerName: restaurant.ownerName,
                    mobile: restaurant.mobile,
                    email: restaurant.email,
                    panCardImage: PLACEHOLDER_IMAGE,
                    restaurantImage: PLACEHOLDER_IMAGE,
                    fssaiLicense: `${restaurant.city.toUpperCase()}-${restaurant.mobile}`,
                    bankDetails: {
                        accountNumber: `0000${restaurant.mobile}`,
                        ifsc: "SBIN0001234",
                        bankName: "State Bank of India",
                    },
                    location: {
                        type: "Point",
                        coordinates: [restaurant.lng, restaurant.lat],
                    },
                    isBlocked: false,
                },
            },
            { upsert: true }
        );
    }

    console.log(JSON.stringify({ seeded: restaurants.length }, null, 2));
    await mongoose.disconnect();
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
