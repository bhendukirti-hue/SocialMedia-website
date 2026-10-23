
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;

        if (!mongoUrl) {
            throw new Error(
                "MONGODB_URL is missing from environment variables."
            );
        }

        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log("✅ Database connected successfully");

        return true;
    } catch (error) {
        console.error("❌ Failed to connect Database");
        console.error("Error:", error.message);

        return false;
    }
};

module.exports = connectDB;
