// server.js

require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");


// =======================
// Server Configuration
// =======================

const PORT = process.env.PORT || 8808;


// =======================
// Start Server
// =======================

const startServer = async () => {
    try {

        // Connect to MongoDB
        await connectDB();

        // Start Express Server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });

    } catch (error) {

        console.error("❌ Server failed to start:", error);

        process.exit(1);
    }
};


// =======================
// Run Server
// =======================

startServer();