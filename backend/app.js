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
        origin: "http://localhost:5173", // React Frontend URL
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
// const likeRoutes = require("./routes/like.routes");
// const followRoutes = require("./routes/follow.routes");
// const conversationRoutes = require("./routes/conversation.routes");
// const messageRoutes = require("./routes/message.routes");
const notificationRoutes = require("./routes/notification.route");
// const storyRoutes = require("./routes/story.routes");

app.use("/api/auth", router);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
// app.use("/api/likes", likeRoutes);
// app.use("/api/follows", followRoutes);
// app.use("/api/conversations", conversationRoutes);
// app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
// app.use("/api/stories", storyRoutes);

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