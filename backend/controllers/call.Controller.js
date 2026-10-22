
const Call = require("../models/call.model");

const getMyCallHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }],
    })
      .populate("caller", "username fullName profilePicture")
      .populate("receiver", "username fullName profilePicture")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      calls,
    });
  } catch (error) {
    console.error("Get call history error:", error);

    return res.status(500).json({
      message: "Failed to fetch call history",
    });
  }
};

module.exports = { getMyCallHistory };
