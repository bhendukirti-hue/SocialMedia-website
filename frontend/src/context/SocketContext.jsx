import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { io } from "socket.io-client";

const SocketContext =
  createContext(null);

const SOCKET_URL =
  "http://localhost:8808";

export const SocketProvider = ({
  children,
}) => {
  const [socket, setSocket] =
    useState(null);

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [activeCall, setActiveCall] =
    useState(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      console.warn(
        "Socket: token not found"
      );

      return;
    }

    const newSocket = io(
      SOCKET_URL,
      {
        auth: {
          token,
        },

        withCredentials: true,

        transports: [
          "websocket",
          "polling",
        ],
      }
    );

    newSocket.on(
      "connect",
      () => {
        console.log(
          "Socket connected:",
          newSocket.id
        );
      }
    );

    newSocket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message
        );
      }
    );

    // =====================================================
    // INCOMING CALL
    // =====================================================

    newSocket.on(
      "incomingCall",
      (call) => {
        console.log(
          "Incoming call:",
          call
        );

        setIncomingCall(call);
      }
    );

    // =====================================================
    // CALL ACCEPTED
    // =====================================================

    newSocket.on(
      "callAccepted",
      (data) => {
        console.log(
          "Call accepted:",
          data
        );

        setActiveCall(
          (current) =>
            current
              ? {
                  ...current,
                  status:
                    "accepted",
                  type:
                    data.type ||
                    current.type,
                }
              : current
        );
      }
    );

    // =====================================================
    // CALL REJECTED
    // =====================================================

    newSocket.on(
      "callRejected",
      (data) => {
        console.log(
          "Call rejected:",
          data
        );

        setActiveCall(null);
      }
    );

    // =====================================================
    // CALL ENDED
    // =====================================================

    newSocket.on(
      "callEnded",
      (data) => {
        console.log(
          "Call ended:",
          data
        );

        setActiveCall(null);
        setIncomingCall(null);
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // =====================================================
  // START CALL
  // =====================================================

  const startCall = ({
    receiverId,
    type,
    callerName,
    callerProfilePicture,
  }) => {
    if (!socket) {
      console.error(
        "Socket is not connected"
      );

      return;
    }

    const callData = {
      receiverId,
      type,
      callerName,
      callerProfilePicture,
    };

    socket.emit(
      "callUser",
      callData
    );

    setActiveCall({
      callId: null,
      receiverId,
      type,
      callerName,
      callerProfilePicture,
      status: "calling",
      isCaller: true,
    });
  };

  // =====================================================
  // ACCEPT CALL
  // =====================================================

  const acceptCall = () => {
    if (!socket || !incomingCall) {
      return;
    }

    socket.emit(
      "acceptCall",
      {
        callId:
          incomingCall.callId,

        callerId:
          incomingCall.callerId,
      }
    );

    setActiveCall({
      callId:
        incomingCall.callId,

      callerId:
        incomingCall.callerId,

      type:
        incomingCall.type,

      callerName:
        incomingCall.callerName,

      callerProfilePicture:
        incomingCall.callerProfilePicture,

      status: "accepted",

      isCaller: false,
    });

    setIncomingCall(null);
  };

  // =====================================================
  // REJECT CALL
  // =====================================================

  const rejectCall = () => {
    if (!socket || !incomingCall) {
      return;
    }

    socket.emit(
      "rejectCall",
      {
        callId:
          incomingCall.callId,

        callerId:
          incomingCall.callerId,
      }
    );

    setIncomingCall(null);
  };

  // =====================================================
  // END CALL
  // =====================================================

  const endCall = () => {
    if (!socket || !activeCall) {
      setActiveCall(null);
      return;
    }

    const receiverId =
      activeCall.isCaller
        ? activeCall.receiverId
        : activeCall.callerId;

    socket.emit(
      "endCall",
      {
        callId:
          activeCall.callId,

        receiverId,
      }
    );

    setActiveCall(null);
    setIncomingCall(null);
  };

  // =====================================================
  // SOCKET EMIT
  // =====================================================

  const emitCallEvent = (
    event,
    data
  ) => {
    if (!socket) return;

    socket.emit(event, data);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,

        incomingCall,
        activeCall,

        setActiveCall,

        startCall,
        acceptCall,
        rejectCall,
        endCall,

        emitCallEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context =
    useContext(SocketContext);

  if (!context) {
    throw new Error(
      "useSocket must be used inside SocketProvider"
    );
  }

  return context;
};