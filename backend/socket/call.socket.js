
const mongoose = require("mongoose");
const Call = require("../models/call.model");

const registerCallSocket = (io, socket) => {
  // Verify that Call is a valid Mongoose model.
  if (
    !Call ||
    typeof Call.create !== "function" ||
    typeof Call.findById !== "function" ||
    typeof Call.findByIdAndUpdate !== "function"
  ) {
    console.error(
      "Invalid Call model. Check backend/models/call.model.js export."
    );
    console.error("Call model type:", typeof Call);
    console.error("Call model keys:", Object.keys(Call || {}));
    return;
  }

  // Helper: emit an event to a user's personal room.
  const emitToUser = (userId, event, data) => {
    if (!userId) return;

    io.to(`user:${userId.toString()}`).emit(event, data);
  };

  // Helper: validate MongoDB IDs.
  const isValidId = (id) =>
    Boolean(id) && mongoose.isValidObjectId(id);

  // =====================================================
  // START CALL
  // =====================================================
  socket.on("callUser", async (data = {}) => {
    console.log("📞 callUser event received:", data);
    try {
      const {
        receiverId,
        type,
        callerName,
        callerProfilePicture,
      } = data;

      const callerId = socket.userId?.toString();

      if (!callerId || !isValidId(receiverId)) {
        socket.emit("callError", {
          message: "Invalid caller or receiver ID.",
        });
        return;
      }

      if (!["audio", "video"].includes(type)) {
        socket.emit("callError", {
          message: "Call type must be audio or video.",
        });
        return;
      }

      if (receiverId.toString() === callerId) {
        socket.emit("callError", {
          message: "You cannot call yourself.",
        });
        return;
      }

      // Confirm that the recipient has a connected socket.
      const recipientRoom = io.sockets.adapter.rooms.get(
        `user:${receiverId.toString()}`
      );

      if (!recipientRoom || recipientRoom.size === 0) {
        socket.emit("callError", {
          message: "The recipient is not connected.",
        });
        return;
      }

      const call = await Call.create({
        caller: callerId,
        receiver: receiverId,
        type,
        status: "ringing",
        startedAt: null,
      });

      emitToUser(receiverId, "incomingCall", {
        callId: call._id.toString(),
        callerId,
        callerName: callerName || "Vlogify User",
        callerProfilePicture: callerProfilePicture || "",
        type,
      });

      console.log(
        `Outgoing ${type} call: ${callerId} -> ${receiverId}`
      );
    } catch (error) {
      console.error("callUser error:", error);

      socket.emit("callError", {
        message: "Unable to start the call.",
      });
    }
  });

  // =====================================================
  // ACCEPT CALL
  // =====================================================
  socket.on("acceptCall", async (data = {}) => {
    try {
      const { callId, callerId } = data;
      const receiverId = socket.userId?.toString();

      if (
        !isValidId(callId) ||
        !isValidId(callerId) ||
        !receiverId
      ) {
        return;
      }

      const call = await Call.findOneAndUpdate(
        {
          _id: callId,
          caller: callerId,
          receiver: receiverId,
          status: "ringing",
        },
        {
          $set: {
            status: "accepted",
            startedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!call) {
        socket.emit("callError", {
          message: "Call not found or no longer ringing.",
        });
        return;
      }

      emitToUser(callerId, "callAccepted", {
        callId: call._id.toString(),
        receiverId,
        type: call.type,
      });

      console.log(`Call accepted: ${callId}`);
    } catch (error) {
      console.error("acceptCall error:", error);
    }
  });

  // =====================================================
  // REJECT CALL
  // =====================================================
  socket.on("rejectCall", async (data = {}) => {
    try {
      const { callId, callerId } = data;
      const receiverId = socket.userId?.toString();

      if (
        !isValidId(callId) ||
        !isValidId(callerId) ||
        !receiverId
      ) {
        return;
      }

      const call = await Call.findOneAndUpdate(
        {
          _id: callId,
          caller: callerId,
          receiver: receiverId,
          status: "ringing",
        },
        {
          $set: {
            status: "rejected",
            endedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!call) return;

      emitToUser(callerId, "callRejected", {
        callId: call._id.toString(),
      });

      console.log(`Call rejected: ${callId}`);
    } catch (error) {
      console.error("rejectCall error:", error);
    }
  });

  // =====================================================
  // WEBRTC OFFER
  // =====================================================
  socket.on("callOffer", (data = {}) => {
    try {
      const { receiverId, offer, callId } = data;

      if (!isValidId(receiverId) || !offer || !callId) {
        return;
      }

      emitToUser(receiverId, "callOffer", {
        callerId: socket.userId.toString(),
        offer,
        callId,
      });
    } catch (error) {
      console.error("callOffer error:", error);
    }
  });

  // =====================================================
  // WEBRTC ANSWER
  // =====================================================
  socket.on("callAnswer", (data = {}) => {
    try {
      const { callerId, answer, callId } = data;

      if (!isValidId(callerId) || !answer || !callId) {
        return;
      }

      emitToUser(callerId, "callAnswer", {
        receiverId: socket.userId.toString(),
        answer,
        callId,
      });
    } catch (error) {
      console.error("callAnswer error:", error);
    }
  });

  // =====================================================
  // ICE CANDIDATE
  // =====================================================
  socket.on("iceCandidate", (data = {}) => {
    try {
      const { receiverId, candidate, callId } = data;

      if (!isValidId(receiverId) || !candidate || !callId) {
        return;
      }

      emitToUser(receiverId, "iceCandidate", {
        senderId: socket.userId.toString(),
        candidate,
        callId,
      });
    } catch (error) {
      console.error("iceCandidate error:", error);
    }
  });

  // =====================================================
  // END CALL
  // =====================================================
  socket.on("endCall", async (data = {}) => {
    try {
      const { callId, receiverId } = data;
      const currentUserId = socket.userId?.toString();

      if (
        !isValidId(callId) ||
        !isValidId(receiverId) ||
        !currentUserId
      ) {
        return;
      }

      // Only a participant in this call may end it.
      const call = await Call.findOne({
        _id: callId,
        $or: [
          { caller: currentUserId, receiver: receiverId },
          { caller: receiverId, receiver: currentUserId },
        ],
      });

      if (!call || ["ended", "rejected"].includes(call.status)) {
        return;
      }

      const endedAt = new Date();
      const duration =
        call.startedAt && call.status === "accepted"
          ? Math.max(
              0,
              Math.floor((endedAt - call.startedAt) / 1000)
            )
          : 0;

      await Call.findByIdAndUpdate(callId, {
        $set: {
          status: "ended",
          endedAt,
          duration,
        },
      });

      // Notify the other participant, not the current user.
      emitToUser(receiverId, "callEnded", {
        callId,
        duration,
      });

      console.log(`Call ended: ${callId}`);
    } catch (error) {
      console.error("endCall error:", error);
    }
  });
};

module.exports = registerCallSocket;
