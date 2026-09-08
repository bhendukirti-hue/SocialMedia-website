const express = require("express");

const router = express.Router();

const UserController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

// ========================================
// SEARCH USERS
// GET /api/users/search?search=kirti
// ========================================
router.get(
  "/search",
  authMiddleware,
  UserController.searchUsers
);

// ========================================
// GET USER PROFILE
// GET /api/users/:id
// ========================================
router.get(
  "/:id",
  authMiddleware,
  UserController.getUserById
);

module.exports = router;