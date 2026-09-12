const mongoose = require("mongoose");

const User = require("../models/user.model");
const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");

// =====================================================
// GET ALL CONVERSATIONS
// =====================================================

exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate(
        "participants",
        "_id username name profilePicture profilePic profileImage"
      )
      .populate(
        "lastMessage",
        "_id sender receiver text isRead createdAt"
      )
      .sort({
        lastMessageAt: -1,
        updatedAt: -1,
      });

    // Add unread message count for every conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          receiver: currentUserId,
          isRead: false,
        });

        return {
          ...conversation.toObject(),
          unreadCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      conversations: conversationsWithUnreadCount,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

// =====================================================
// GET OR CREATE CONVERSATION
// =====================================================

exports.getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself",
      });
    }

    const otherUser = await User.findById(userId).select(
      "_id username name profilePicture profilePic profileImage"
    );

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let conversation = await Conversation.findOne({
      participants: {
        $all: [currentUserId, userId],
      },
    }).populate(
      "participants",
      "_id username name profilePicture profilePic profileImage"
    );

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
      });

      conversation = await Conversation.findById(
        conversation._id
      ).populate(
        "participants",
        "_id username name profilePicture profilePic profileImage"
      );
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get/create conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};

// =====================================================
// GET MESSAGES
// =====================================================

exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate(
        "sender",
        "_id username name profilePicture profilePic profileImage"
      )
      .populate(
        "receiver",
        "_id username name profilePicture profilePic profileImage"
      )
      .sort({
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

// =====================================================
// SEND MESSAGE
// =====================================================

exports.sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation",
      });
    }

    const receiverId = conversation.participants.find(
      (id) => id.toString() !== currentUserId.toString()
    );

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // New messages automatically have isRead: false
    const message = await Message.create({
      conversation: conversationId,
      sender: currentUserId,
      receiver: receiverId,
      text: text.trim(),
      isRead: false,
      readAt: null,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageText: message.text,
      lastMessageAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate(
        "sender",
        "_id username name profilePicture profilePic profileImage"
      )
      .populate(
        "receiver",
        "_id username name profilePicture profilePic profileImage"
      );

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// =====================================================
// MARK MESSAGES AS READ
// =====================================================

exports.markMessagesAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation",
      });
    }

    const result = await Message.updateMany(
      {
        conversation: conversationId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark messages read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
    });
  }
};