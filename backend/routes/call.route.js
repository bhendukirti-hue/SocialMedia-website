
const express = require("express");
const router = express.Router();

const {
  getMyCallHistory,
} = require("../controllers/call.Controller");

// Add your existing authentication middleware to this route.
// Example:
// router.get("/history", protectRoute, getMyCallHistory);

router.get("/history", getMyCallHistory);

module.exports = router;
