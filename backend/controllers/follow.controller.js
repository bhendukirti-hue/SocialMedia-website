const User = require("../models/user.model");
const Notification = require("../models/notification.model");

// ============================
// FOLLOW USER
// POST /api/follows/:userId/follow
// ============================
const followUser = async (req, res) => {
  try {
    // ==========================================
    // GET USER IDs
    // ==========================================

    const currentUserId =
      req.user._id || req.user.id;

    const targetUserId =
      req.params.userId;

    console.log("=================================");
    console.log("FOLLOW REQUEST");
    console.log("Current User:", currentUserId);
    console.log("Target User:", targetUserId);
    console.log("=================================");

    // ==========================================
    // VALIDATE USER IDS
    // ==========================================

    if (!currentUserId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing",
      });
    }

    // ==========================================
    // PREVENT SELF FOLLOW
    // ==========================================

    if (
      currentUserId.toString() ===
      targetUserId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // ==========================================
    // FIND USERS
    // ==========================================

    const currentUser =
      await User.findById(currentUserId);

    const targetUser =
      await User.findById(targetUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // CHECK ALREADY FOLLOWING
    // ==========================================

    const alreadyFollowing =
      currentUser.following.some(
        (id) =>
          id.toString() ===
          targetUserId.toString()
      );

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message:
          "You are already following this user",
      });
    }

    // ==========================================
    // ADD FOLLOWING
    // ==========================================

    currentUser.following.push(
      targetUserId
    );

    // ==========================================
    // ADD FOLLOWER
    // ==========================================

    targetUser.followers.push(
      currentUserId
    );

    // ==========================================
    // SAVE USERS
    // ==========================================

    await currentUser.save();
    await targetUser.save();

    console.log(
      "Follow relationship saved successfully"
    );

    // ==========================================
    // CREATE FOLLOW NOTIFICATION
    // ==========================================

    try {
      const newNotification =
        await Notification.create({
          recipient: targetUserId,
          sender: currentUserId,
          type: "follow",
          post: null,
          comment: "",
          isRead: false,
        });

      console.log(
        "================================="
      );
      console.log(
        "FOLLOW NOTIFICATION CREATED"
      );
      console.log(
        newNotification
      );
      console.log(
        "================================="
      );
    } catch (notificationError) {
      console.error(
        "FOLLOW NOTIFICATION ERROR:",
        notificationError
      );

      // Don't fail the follow operation
      // if notification creation fails.
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "User followed successfully",

      followersCount:
        targetUser.followers.length,

      followingCount:
        currentUser.following.length,

      isFollowing: true,
    });
  } catch (error) {
    console.error(
      "FOLLOW USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to follow user",
      error: error.message,
    });
  }
};

// ============================
// UNFOLLOW USER
// DELETE /api/follows/:userId/follow
// ============================
const unfollowUser = async (req, res) => {
  try {
    // ==========================================
    // GET USER IDs
    // ==========================================

    const currentUserId =
      req.user._id || req.user.id;

    const targetUserId =
      req.params.userId;

    // ==========================================
    // VALIDATE
    // ==========================================

    if (!currentUserId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing",
      });
    }

    // ==========================================
    // PREVENT SELF UNFOLLOW
    // ==========================================

    if (
      currentUserId.toString() ===
      targetUserId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid operation",
      });
    }

    // ==========================================
    // FIND USERS
    // ==========================================

    const currentUser =
      await User.findById(currentUserId);

    const targetUser =
      await User.findById(targetUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // CHECK FOLLOWING
    // ==========================================

    const isFollowing =
      currentUser.following.some(
        (id) =>
          id.toString() ===
          targetUserId.toString()
      );

    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        message:
          "You are not following this user",
      });
    }

    // ==========================================
    // REMOVE FROM FOLLOWING
    // ==========================================

    currentUser.following =
      currentUser.following.filter(
        (id) =>
          id.toString() !==
          targetUserId.toString()
      );

    // ==========================================
    // REMOVE FROM FOLLOWERS
    // ==========================================

    targetUser.followers =
      targetUser.followers.filter(
        (id) =>
          id.toString() !==
          currentUserId.toString()
      );

    // ==========================================
    // SAVE USERS
    // ==========================================

    await currentUser.save();
    await targetUser.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "User unfollowed successfully",

      followersCount:
        targetUser.followers.length,

      followingCount:
        currentUser.following.length,

      isFollowing: false,
    });
  } catch (error) {
    console.error(
      "UNFOLLOW USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to unfollow user",
      error: error.message,
    });
  }
};

// ============================
// FOLLOW STATUS
// GET /api/follows/:userId/follow-status
// ============================
const getFollowStatus = async (req, res) => {
  try {
    // ==========================================
    // GET USER IDs
    // ==========================================

    const currentUserId =
      req.user._id || req.user.id;

    const targetUserId =
      req.params.userId;

    // ==========================================
    // VALIDATE
    // ==========================================

    if (!currentUserId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing",
      });
    }

    // ==========================================
    // FIND USERS
    // ==========================================

    const currentUser =
      await User.findById(currentUserId);

    const targetUser =
      await User.findById(targetUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // CHECK FOLLOW STATUS
    // ==========================================

    const isFollowing =
      currentUser.following.some(
        (id) =>
          id.toString() ===
          targetUserId.toString()
      );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      isFollowing,

      followersCount:
        targetUser.followers.length,

      followingCount:
        targetUser.following.length,
    });
  } catch (error) {
    console.error(
      "GET FOLLOW STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get follow status",
      error: error.message,
    });
  }
};

// ============================
// EXPORT
// ============================

module.exports = {
  followUser,
  unfollowUser,
  getFollowStatus,
};
