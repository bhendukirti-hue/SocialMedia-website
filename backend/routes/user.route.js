const express = require("express");

const router = express.Router();

const UserController = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");

// ========================================
// SEARCH USERS
// ========================================
// GET /api/users/search?search=kirti
// ========================================

router.get(
  "/search",
  authMiddleware,
  UserController.searchUsers
);

// ========================================
// GET USER FOLLOWERS
// ========================================
// GET /api/users/:userId/followers
// ========================================

router.get(
  "/:userId/followers",
  authMiddleware,
  UserController.getFollowers
);

// ========================================
// GET USER FOLLOWING
// ========================================
// GET /api/users/:userId/following
// ========================================

router.get(
  "/:userId/following",
  authMiddleware,
  UserController.getFollowing
);

// ========================================
// GET USER PROFILE
// ========================================
// GET /api/users/:id
// ========================================

router.get(
  "/:id",
  authMiddleware,
  UserController.getUserById
);

module.exports = router;