const User = require("../models/user.model");
const Post = require("../models/post.model");

// ========================================
// SEARCH USERS
// ========================================
exports.searchUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim();

    if (!search) {
      return res.status(200).json({
        success: true,
        users: [],
      });
    }

    const users = await User.find({
      $or: [
        {
          username: {
            $regex: search,
            $options: "i",
          },
        },
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    })
      .select(
        "_id username name profilePicture profilePic profileImage"
      )
      .limit(20);

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search users.",
      error: error.message,
    });
  }
};

// ========================================
// GET USER PROFILE BY ID
// ========================================
// GET /api/users/:id
// ========================================
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select(
      "-password -otp -otpExpiry"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const posts = await Post.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .select(
        "_id mediaUrl mediaType caption likes createdAt"
      );

    const postsWithLikeCount = posts.map((post) => {
      const postObject = post.toObject();

      postObject.likeCount = post.likes?.length || 0;

      return postObject;
    });

    return res.status(200).json({
      success: true,
      user,
      posts: postsWithLikeCount,
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
      error: error.message,
    });
  }
};

// ========================================
// GET FOLLOWERS
// ========================================
// GET /api/users/:userId/followers
// ========================================
exports.getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId).populate(
      "followers",
      "_id username name profilePicture profilePic profileImage bio"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.followers?.length || 0,
      users: user.followers || [],
    });
  } catch (error) {
    console.error("Get followers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get followers.",
      error: error.message,
    });
  }
};

// ========================================
// GET FOLLOWING
// ========================================
// GET /api/users/:userId/following
// ========================================
exports.getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId).populate(
      "following",
      "_id username name profilePicture profilePic profileImage bio"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.following?.length || 0,
      users: user.following || [],
    });
  } catch (error) {
    console.error("Get following error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get following.",
      error: error.message,
    });
  }
};