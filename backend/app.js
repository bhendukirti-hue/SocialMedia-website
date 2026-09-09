// app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// =======================
// Middlewares
// =======================

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(helmet());

app.use(morgan("dev"));

// =======================
// Health Check Route
// =======================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "🚀 Social Media API is Running Successfully",
    });
});

// =======================
// API Routes
// =======================

const router = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const postRoutes = require("./routes/post.route");
const commentRoutes = require("./routes/comment.route");
const followRoutes = require("./routes/follow.route");
const notificationRoutes = require("./routes/notification.route");

// ✅ Messaging Route
const messageRoutes = require("./routes/message.route");

// =======================
// Route Mounting
// =======================

app.use("/api/auth", router);

app.use("/api/users", userRoutes);

app.use("/api/posts", postRoutes);

app.use("/api/posts", commentRoutes);

app.use("/api/follows", followRoutes);

app.use("/api/notifications", notificationRoutes);

// ✅ Messaging API
app.use("/api/messages", messageRoutes);

// =======================
// 404 Middleware
// =======================

app.use(notFound);

// =======================
// Global Error Middleware
// =======================

app.use(errorHandler);

// =======================
// Export App
// =======================

module.exports = app;