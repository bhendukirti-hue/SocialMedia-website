// server.js

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

// =======================
// Create HTTP Server
// =======================

const server = http.createServer(app);

// =======================
// Socket.IO Configuration
// =======================

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
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
        // Connect to MongoDB
        await connectDB();

        // Start HTTP + Express + Socket.IO Server
        server.listen(PORT, () => {
            console.log(
                `🚀 Server is running on http://localhost:${PORT}`
            );

            console.log(
                `🔌 Socket.IO is running on port ${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "❌ Server failed to start:",
            error
        );

        process.exit(1);
    }
};

// =======================
// Run Server
// =======================

startServer();