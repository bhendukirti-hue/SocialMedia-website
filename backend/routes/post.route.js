const express = require("express");

const PostController = require("../controllers/post.controller");
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../config/postMulter");

const router = express.Router();

// CREATE POST
router.post(
  "/",
  authMiddleware,
  upload.single("media"),
  PostController.createPost
);

// GET MY POSTS
router.get(
  "/my-posts",
  authMiddleware,
  PostController.getMyPosts
);

// DELETE POST
router.delete(
  "/:id",
  authMiddleware,
  PostController.deletePost
);

// LIKE / UNLIKE POST

router.post(
  "/:id/like",
  authMiddleware,
  PostController.toggleLike
);

// GET ALL POSTS - HOME FEED

router.get(
  "/all-posts",
  authMiddleware,
  PostController.getAllPosts
);
module.exports = router;