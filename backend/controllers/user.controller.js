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