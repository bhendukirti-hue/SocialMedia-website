const express = require("express");

const {
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/comment.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Add comment
// POST /api/posts/:postId/comment
router.post("/:postId/comment", authMiddleware, addComment);

// Get comments
// GET /api/posts/:postId/comments
router.get("/:postId/comments", authMiddleware, getComments);

// Delete comment
// DELETE /api/posts/comment/:commentId
router.delete("/comment/:commentId", authMiddleware, deleteComment);

module.exports = router;
