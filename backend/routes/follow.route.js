const express = require("express");

const {
  followUser,
  unfollowUser,
  getFollowStatus,
} = require("../controllers/follow.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Follow
router.post("/:userId/follow", authMiddleware, followUser);

// Unfollow
router.delete("/:userId/follow", authMiddleware, unfollowUser);

// Check follow status
router.get("/:userId/follow-status", authMiddleware, getFollowStatus);

module.exports = router;