
export const callService = {
  initiate(socket, receiverId, callType) {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error("Socket is not connected"));
        return;
      }

      socket.emit(
        "call:initiate",
        { receiverId, callType },
        (response) => {
          if (response?.success) {
            resolve(response.call);
          } else {
            reject(new Error(response?.message || "Could not start call"));
          }
        }
      );
    });
  },

  accept(socket, callId) {
    socket?.emit("call:accept", { callId });
  },

  reject(socket, callId) {
    socket?.emit("call:reject", { callId });
  },

  end(socket, callId) {
    socket?.emit("call:end", { callId });
  },

  sendOffer(socket, data) {
    socket?.emit("call:offer", data);
  },

  sendAnswer(socket, data) {
    socket?.emit("call:answer", data);
  },

  sendIceCandidate(socket, data) {
    socket?.emit("call:ice-candidate", data);
  },
};
