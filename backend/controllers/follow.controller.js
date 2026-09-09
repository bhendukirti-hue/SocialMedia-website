const User = require("../models/user.model");

// ============================
// FOLLOW USER
// POST /api/users/:userId/follow
// ============================
const followUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    // Prevent following yourself
    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already following
    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString()
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });
    }

    // Add target user to current user's following
    currentUser.following.push(targetUserId);

    // Add current user to target user's followers
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "User followed successfully",
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      isFollowing: true,
    });
  } catch (error) {
    console.error("Follow User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to follow user",
      error: error.message,
    });
  }
};

// ============================
// UNFOLLOW USER
// DELETE /api/users/:userId/follow
// ============================
const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    // Prevent unfollowing yourself
    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid operation",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if currently following
    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString()
    );

    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        message: "You are not following this user",
      });
    }

    // Remove target from following
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId.toString()
    );

    // Remove current user from target followers
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      isFollowing: false,
    });
  } catch (error) {
    console.error("Unfollow User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unfollow user",
      error: error.message,
    });
  }
};

// ============================
// FOLLOW STATUS
// GET /api/users/:userId/follow-status
// ============================
const getFollowStatus = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString()
    );

    return res.status(200).json({
      success: true,
      isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length,
    });
  } catch (error) {
    console.error("Get Follow Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get follow status",
      error: error.message,
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowStatus,
};