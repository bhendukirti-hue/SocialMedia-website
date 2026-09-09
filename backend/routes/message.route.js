const express = require("express");

const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} = require("../controllers/message.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();


// Get all conversations
router.get(
  "/conversations",
  authMiddleware,
  getConversations
);


// Create/get conversation with a user
router.get(
  "/conversation/:userId",
  authMiddleware,
  getOrCreateConversation
);


// Get messages
router.get(
  "/:conversationId",
  authMiddleware,
  getMessages
);


// Send message
router.post(
  "/:conversationId",
  authMiddleware,
  sendMessage
);


// Mark messages as read
router.put(
  "/:conversationId/read",
  authMiddleware,
  markMessagesAsRead
);


module.exports = router;