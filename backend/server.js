
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const { initializeSocket } = require("./socket/socket");

// =======================
// Server Configuration
// =======================

const PORT = process.env.PORT || 8808;

// Allow your local frontend and deployed frontend.
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter(Boolean);

// =======================
// Create HTTP Server
// =======================

const server = http.createServer(app);

// =======================
// Socket.IO Configuration
// =======================

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// =======================
// Initialize Socket.IO
// =======================

initializeSocket(io);

// =======================
// Start Server
// =======================

const startServer = async () => {
    try {
        console.log("🚀 Starting Pixora backend...");
        console.log("🔍 Checking MongoDB configuration...");

        if (!process.env.MONGODB_URL) {
            throw new Error(
                "MONGODB_URL is missing. Add it in Render Environment Variables."
            );
        }

        console.log("✅ MONGODB_URL is configured.");

        // Connect to MongoDB
        const connected = await connectDB();

        if (connected !== true) {
            throw new Error(
                "MongoDB connection failed. Check the database logs and Atlas settings."
            );
        }

        console.log("✅ MongoDB connected successfully!");

        // Start HTTP server only after database connection
        server.listen(PORT, "0.0.0.0", () => {
            console.log(
                `🚀 Pixora backend is listening on port ${PORT}`
            );

            console.log(
                `🔌 Socket.IO is running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "❌ Pixora backend startup failed:",
            error.message
        );

        process.exit(1);
    }
};

// =======================
// Handle Server Errors
// =======================

server.on("error", (error) => {
    console.error("❌ HTTP server error:", error.message);
    process.exit(1);
});

// =======================
// Run Server
// =======================

startServer();
