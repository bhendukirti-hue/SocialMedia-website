const Call = require("../models/call.model");

const registerCallSocket = (io, socket) => {
  // =====================================================
  // START CALL
  // =====================================================

  socket.on(
    "callUser",
    async ({
      receiverId,
      type,
      callerName,
      callerProfilePicture,
    }) => {
      try {
        if (!receiverId || !type) {
          return;
        }

        if (!["audio", "video"].includes(type)) {
          return;
        }

        if (
          receiverId.toString() ===
          socket.userId.toString()
        ) {
          return;
        }

        const call = await Call.create({
          caller: socket.userId,
          receiver: receiverId,
          type,
          status: "ringing",
        });

        io.to(`user:${receiverId}`).emit(
          "incomingCall",
          {
            callId: call._id.toString(),
            callerId: socket.userId.toString(),
            callerName: callerName || "Vlogify User",
            callerProfilePicture:
              callerProfilePicture || "",
            type,
          }
        );

        console.log(
          `Incoming ${type} call from ${socket.userId} to ${receiverId}`
        );
      } catch (error) {
        console.error(
          "callUser error:",
          error
        );
      }
    }
  );

  // =====================================================
  // ACCEPT CALL
  // =====================================================

  socket.on(
    "acceptCall",
    async ({
      callId,
      callerId,
    }) => {
      try {
        if (!callId || !callerId) {
          return;
        }

        const call = await Call.findByIdAndUpdate(
          callId,
          {
            status: "accepted",
            startedAt: new Date(),
          },
          {
            new: true,
          }
        );

        if (!call) {
          return;
        }

        io.to(`user:${callerId}`).emit(
          "callAccepted",
          {
            callId: call._id.toString(),
            receiverId:
              socket.userId.toString(),
            type: call.type,
          }
        );

        console.log(
          `Call accepted: ${callId}`
        );
      } catch (error) {
        console.error(
          "acceptCall error:",
          error
        );
      }
    }
  );

  // =====================================================
  // REJECT CALL
  // =====================================================

  socket.on(
    "rejectCall",
    async ({
      callId,
      callerId,
    }) => {
      try {
        if (!callId || !callerId) {
          return;
        }

        const call = await Call.findByIdAndUpdate(
          callId,
          {
            status: "rejected",
            endedAt: new Date(),
          },
          {
            new: true,
          }
        );

        if (!call) {
          return;
        }

        io.to(`user:${callerId}`).emit(
          "callRejected",
          {
            callId: call._id.toString(),
          }
        );

        console.log(
          `Call rejected: ${callId}`
        );
      } catch (error) {
        console.error(
          "rejectCall error:",
          error
        );
      }
    }
  );

  // =====================================================
  // WEBRTC OFFER
  // =====================================================

  socket.on(
    "callOffer",
    ({
      receiverId,
      offer,
      callId,
    }) => {
      if (!receiverId || !offer) {
        return;
      }

      io.to(`user:${receiverId}`).emit(
        "callOffer",
        {
          callerId:
            socket.userId.toString(),
          offer,
          callId,
        }
      );
    }
  );

  // =====================================================
  // WEBRTC ANSWER
  // =====================================================

  socket.on(
    "callAnswer",
    ({
      callerId,
      answer,
      callId,
    }) => {
      if (!callerId || !answer) {
        return;
      }

      io.to(`user:${callerId}`).emit(
        "callAnswer",
        {
          receiverId:
            socket.userId.toString(),
          answer,
          callId,
        }
      );
    }
  );

  // =====================================================
  // ICE CANDIDATE
  // =====================================================

  socket.on(
    "iceCandidate",
    ({
      receiverId,
      candidate,
      callId,
    }) => {
      if (!receiverId || !candidate) {
        return;
      }

      io.to(`user:${receiverId}`).emit(
        "iceCandidate",
        {
          senderId:
            socket.userId.toString(),
          candidate,
          callId,
        }
      );
    }
  );

  // =====================================================
  // END CALL
  // =====================================================

  socket.on(
    "endCall",
    async ({
      callId,
      receiverId,
    }) => {
      try {
        if (!callId || !receiverId) {
          return;
        }

        const call =
          await Call.findById(callId);

        if (!call) {
          return;
        }

        const endedAt = new Date();

        let duration = 0;

        if (call.startedAt) {
          duration = Math.floor(
            (endedAt - call.startedAt) /
              1000
          );
        }

        await Call.findByIdAndUpdate(
          callId,
          {
            status: "ended",
            endedAt,
            duration,
          }
        );

        io.to(`user:${receiverId}`).emit(
          "callEnded",
          {
            callId,
            duration,
          }
        );

        console.log(
          `Call ended: ${callId}`
        );
      } catch (error) {
        console.error(
          "endCall error:",
          error
        );
      }
    }
  );
};

module.exports = registerCallSocket;