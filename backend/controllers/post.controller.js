const Post = require("../models/post.model");
const Notification = require("../models/notification.model")
// ==========================================
// CREATE POST
// ==========================================

exports.createPost = async (req, res) => {
  try {
    console.log("================================");
    console.log("CREATE POST");
    console.log("USER:", req.user?._id);
    console.log("FILE:", req.file);
    console.log("BODY:", req.body);
    console.log("================================");

    const { caption } = req.body;

    // Check authenticated user
    if (!req.user) {
      return res.status(401).json({
        message: "User is not authenticated.",
      });
    }

    // Check uploaded file
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an image or video.",
      });
    }

    // Cloudinary URL
    const mediaUrl = req.file.path;

    // Determine media type
    const mediaType = req.file.mimetype.startsWith("video/")
      ? "video"
      : "image";

    // Create post
    const post = await Post.create({
      user: req.user._id,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      caption: caption || "",
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post,
    });

  } catch (error) {

    console.error("================================");
    console.error("CREATE POST ERROR:");
    console.error(error);
    console.error("================================");

    return res.status(500).json({
      success: false,
      message: "Failed to create post.",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY POSTS
// ==========================================

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture");

    const postsWithLikeStatus = posts.map((post) => {
      const postObject = post.toObject();

      postObject.likeCount = post.likes.length;

      postObject.likedByMe = post.likes.some(
        (userId) =>
          userId.toString() === req.user._id.toString()
      );

      return postObject;
    });

    return res.status(200).json({
      posts: postsWithLikeStatus,
    });
  } catch (error) {
    console.error("Get posts error:", error);

    return res.status(500).json({
      message: "Failed to fetch posts.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE POST
// ==========================================

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.id,
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    await Post.findByIdAndDelete(post._id);

    return res.status(200).json({
      message: "Post deleted successfully.",
    });
    } catch (error) {
    console.error("Delete post error:", error);

    return res.status(500).json({
      message: "Failed to delete post.",
      error: error.message,
    });
  }
};

// ==========================================
// LIKE / UNLIKE POST
// ==========================================

exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    // ==========================================
    // UNLIKE
    // ==========================================

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );

      await post.save();

      // Remove the like notification
      await Notification.findOneAndDelete({
        recipient: post.user,
        sender: userId,
        post: post._id,
        type: "like",
      });

      return res.status(200).json({
        success: true,
        liked: false,
        likeCount: post.likes.length,
        message: "Post unliked successfully.",
      });
    }

    // ==========================================
    // LIKE
    // ==========================================

    post.likes.push(userId);

    await post.save();

    // ==========================================
    // CREATE NOTIFICATION
    // ==========================================

    // Don't notify yourself when you like your own post
    if (post.user.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: userId,
        type: "like",
        post: post._id,
        isRead: false,
      });
    }

    return res.status(200).json({
      success: true,
      liked: true,
      likeCount: post.likes.length,
      message: "Post liked successfully.",
    });

  } catch (error) {
    console.error("Toggle like error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to like/unlike post.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL POSTS - HOME FEED
// ==========================================

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture");

    const postsWithLikeStatus = posts.map((post) => {
      const postObject = post.toObject();

      postObject.likeCount = post.likes.length;

      postObject.likedByMe = post.likes.some(
        (userId) =>
          userId.toString() === req.user._id.toString()
      );

      return postObject;
    });

    return res.status(200).json({
      success: true,
      posts: postsWithLikeStatus,
    });

  } catch (error) {
    console.error("Get all posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch posts.",
      error: error.message,
    });
  }
};
