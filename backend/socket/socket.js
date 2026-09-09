const jwt = require("jsonwebtoken");

const connectedUsers = new Map();


const initializeSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication token is required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      socket.userId = decoded.id || decoded._id || decoded.userId;

      if (!socket.userId) {
        return next(
          new Error("Invalid authentication token")
        );
      }

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);

      next(
        new Error("Socket authentication failed")
      );
    }
  });


  io.on("connection", (socket) => {
    console.log(
      "Socket connected:",
      socket.userId
    );

    connectedUsers.set(
      socket.userId.toString(),
      socket.id
    );


    // Join personal room
    socket.join(
      `user:${socket.userId}`
    );


    // Join conversation room
    socket.on(
      "joinConversation",
      (conversationId) => {
        if (!conversationId) return;

        socket.join(
          `conversation:${conversationId}`
        );

        console.log(
          `User ${socket.userId} joined conversation ${conversationId}`
        );
      }
    );


    // Leave conversation room
    socket.on(
      "leaveConversation",
      (conversationId) => {
        if (!conversationId) return;

        socket.leave(
          `conversation:${conversationId}`
        );
      }
    );


    // Typing
    socket.on(
      "typing",
      ({ receiverId, conversationId }) => {
        if (!receiverId) return;

        io.to(`user:${receiverId}`).emit(
          "userTyping",
          {
            userId: socket.userId,
            conversationId,
          }
        );
      }
    );


    // Stop typing
    socket.on(
      "stopTyping",
      ({ receiverId, conversationId }) => {
        if (!receiverId) return;

        io.to(`user:${receiverId}`).emit(
          "userStoppedTyping",
          {
            userId: socket.userId,
            conversationId,
          }
        );
      }
    );


    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected:",
        socket.userId
      );

      connectedUsers.delete(
        socket.userId.toString()
      );
    });
  });


  return io;
};


const getConnectedUsers = () => {
  return connectedUsers;
};


module.exports = {
  initializeSocket,
  getConnectedUsers,
};