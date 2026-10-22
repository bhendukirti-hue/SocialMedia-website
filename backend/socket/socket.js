// backend/socket/socket.js

const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const registerCallSocket = require("./call.socket");

const connectedUsers = new Map();

const COOKIE_NAME = "token";

// =====================================================
// INITIALIZE SOCKET.IO
// =====================================================

const initializeSocket = (io) => {
  // =====================================================
  // COOKIE AUTHENTICATION
  // =====================================================

  io.use((socket, next) => {
    try {
      const cookieHeader =
        socket.handshake.headers.cookie || "";

      const cookies = cookie.parse(cookieHeader);

      const token = cookies[COOKIE_NAME];

      if (!token) {
        return next(
          new Error(
            "Authentication cookie is missing"
          )
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY
      );

      const userId =
        decoded.id ||
        decoded._id ||
        decoded.userId;

      if (!userId) {
        return next(
          new Error(
            "Invalid authentication token"
          )
        );
      }

      socket.userId = userId.toString();

      next();
    } catch (error) {
      console.error(
        "Socket authentication error:",
        error.message
      );

      next(
        new Error(
          "Socket authentication failed"
        )
      );
    }
  });

  // =====================================================
  // SOCKET CONNECTION
  // =====================================================

  io.on("connection", (socket) => {
    const userId = socket.userId.toString();

    console.log(
      `Socket connected: user ${userId}, socket ${socket.id}`
    );

    connectedUsers.set(userId, socket.id);

    // =====================================================
    // PERSONAL USER ROOM
    // =====================================================

    socket.join(`user:${userId}`);

    // =====================================================
    // MESSAGE SENT
    // =====================================================

    socket.on(
      "messageSent",
      ({ message, receiverId } = {}) => {
        if (!message || !receiverId) {
          return;
        }

        io.to(`user:${receiverId}`).emit(
          "newMessage",
          message
        );

        console.log(
          `New message sent to user ${receiverId}`
        );
      }
    );

    // =====================================================
    // JOIN CONVERSATION
    // =====================================================

    socket.on(
      "joinConversation",
      (conversationId) => {
        if (!conversationId) {
          return;
        }

        socket.join(
          `conversation:${conversationId}`
        );

        console.log(
          `User ${userId} joined conversation ${conversationId}`
        );
      }
    );

    // =====================================================
    // LEAVE CONVERSATION
    // =====================================================

    socket.on(
      "leaveConversation",
      (conversationId) => {
        if (!conversationId) {
          return;
        }

        socket.leave(
          `conversation:${conversationId}`
        );
      }
    );

    // =====================================================
    // TYPING
    // =====================================================

    socket.on(
      "typing",
      ({ receiverId, conversationId } = {}) => {
        if (!receiverId) {
          return;
        }

        io.to(`user:${receiverId}`).emit(
          "userTyping",
          {
            userId,
            conversationId,
          }
        );
      }
    );

    // =====================================================
    // STOP TYPING
    // =====================================================

    socket.on(
      "stopTyping",
      ({ receiverId, conversationId } = {}) => {
        if (!receiverId) {
          return;
        }

        io.to(`user:${receiverId}`).emit(
          "userStoppedTyping",
          {
            userId,
            conversationId,
          }
        );
      }
    );

    // =====================================================
    // CALL SOCKET EVENTS
    // =====================================================

    registerCallSocket(io, socket);

    // =====================================================
    // DISCONNECT
    // =====================================================

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: user ${userId}`
      );

      // Don't delete a newer connection if this
      // user has connected from another tab/device.
      if (connectedUsers.get(userId) === socket.id) {
        connectedUsers.delete(userId);
      }
    });
  });

  return io;
};

// =====================================================
// GET CONNECTED USERS
// =====================================================

const getConnectedUsers = () => {
  return connectedUsers;
};

module.exports = {
  initializeSocket,
  getConnectedUsers,
};