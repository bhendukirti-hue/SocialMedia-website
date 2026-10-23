import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL = "https://pixora-backend-2eai.onrender.com";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);

  // ==========================================
  // STOP INCOMING RINGTONE
  // ==========================================

  const stopIncomingRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current !== null) {
      window.clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }

    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // Oscillator may already be stopped.
      }

      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }

    if (audioContextRef.current) {
      const context = audioContextRef.current;
      audioContextRef.current = null;

      context.close().catch((error) => {
        console.warn("Unable to close ringtone audio:", error);
      });
    }
  }, []);

  // ==========================================
  // START INCOMING RINGTONE
  // ==========================================

  const startIncomingRingtone = useCallback(async () => {
    if (audioContextRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("Web Audio is not supported in this browser.");
        return;
      }

      const context = new AudioContextClass();

      audioContextRef.current = context;

      if (context.state === "suspended") {
        await context.resume();
      }

      // The browser may require a prior user interaction.
      if (
        audioContextRef.current !== context ||
        context.state !== "running"
      ) {
        console.warn(
          "Ringtone audio is blocked. Interact with the page and try again."
        );
        stopIncomingRingtone();
        return;
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 740;

      // Start silent and make periodic audible pulses.
      gain.gain.value = 0;

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();

      oscillatorRef.current = oscillator;
      gainRef.current = gain;

      let isAudible = false;
      let pulseCount = 0;

      ringtoneIntervalRef.current = window.setInterval(() => {
        if (
          audioContextRef.current !== context ||
          context.state !== "running"
        ) {
          return;
        }

        pulseCount += 1;

        // Two short pulses followed by a pause.
        isAudible = pulseCount % 4 === 1 || pulseCount % 4 === 2;

        gain.gain.setTargetAtTime(
          isAudible ? 0.15 : 0,
          context.currentTime,
          0.025
        );
      }, 450);

      console.log("Incoming ringtone started.");
    } catch (error) {
      console.error("Unable to start incoming ringtone:", error);
      stopIncomingRingtone();
    }
  }, [stopIncomingRingtone]);

  // ==========================================
  // SOCKET CONNECTION
  // ==========================================

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    const handleConnect = () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    };

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("disconnect", handleDisconnect);

    // ==========================================
    // INCOMING CALL
    // ==========================================

    const handleIncomingCall = (call) => {
      console.log("Incoming call:", call);

      if (!call?.callId || !call?.callerId) {
        console.error("Invalid incoming call data:", call);
        return;
      }

      setIncomingCall(call);
    };

    newSocket.on("incomingCall", handleIncomingCall);

    // ==========================================
    // CALL ACCEPTED
    // ==========================================

    const handleCallAccepted = (data) => {
      console.log("Call accepted:", data);

      setActiveCall((current) => {
        if (!current) return current;

        if (
          current.callId &&
          data?.callId &&
          current.callId !== data.callId
        ) {
          return current;
        }

        return {
          ...current,
          callId: data?.callId || current.callId,
          receiverId: data?.receiverId || current.receiverId,
          status: "accepted",
          type: data?.type || current.type,
        };
      });
    };

    newSocket.on("callAccepted", handleCallAccepted);

    // ==========================================
    // CALL REJECTED
    // ==========================================

    const handleCallRejected = (data) => {
      console.log("Call rejected:", data);

      setActiveCall((current) => {
        if (
          current?.callId &&
          data?.callId &&
          current.callId !== data.callId
        ) {
          return current;
        }

        return null;
      });

      setIncomingCall((current) => {
        if (
          current?.callId &&
          data?.callId &&
          current.callId !== data.callId
        ) {
          return current;
        }

        return null;
      });
    };

    newSocket.on("callRejected", handleCallRejected);

    // ==========================================
    // CALL ENDED
    // ==========================================

    const handleCallEnded = (data) => {
      console.log("Call ended:", data);

      setActiveCall((current) => {
        if (
          current?.callId &&
          data?.callId &&
          current.callId !== data.callId
        ) {
          return current;
        }

        return null;
      });

      setIncomingCall((current) => {
        if (
          current?.callId &&
          data?.callId &&
          current.callId !== data.callId
        ) {
          return current;
        }

        return null;
      });
    };

    newSocket.on("callEnded", handleCallEnded);

    setSocket(newSocket);

    // ==========================================
    // SOCKET CLEANUP
    // ==========================================

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("connect_error", handleConnectError);
      newSocket.off("disconnect", handleDisconnect);

      newSocket.off("incomingCall", handleIncomingCall);
      newSocket.off("callAccepted", handleCallAccepted);
      newSocket.off("callRejected", handleCallRejected);
      newSocket.off("callEnded", handleCallEnded);

      newSocket.disconnect();

      stopIncomingRingtone();

      setIsConnected(false);
      setSocket(null);
    };
  }, [stopIncomingRingtone]);

  // ==========================================
  // INCOMING RINGTONE LIFECYCLE
  // ==========================================

  useEffect(() => {
    if (incomingCall && !activeCall) {
      void startIncomingRingtone();
    } else {
      stopIncomingRingtone();
    }

    return () => {
      stopIncomingRingtone();
    };
  }, [
    incomingCall,
    activeCall,
    startIncomingRingtone,
    stopIncomingRingtone,
  ]);

  // ==========================================
  // START CALL
  // ==========================================

  const startCall = ({
    receiverId,
    type,
    callerName,
    callerProfilePicture,
  }) => {
    if (!socket?.connected) {
      console.error("Socket is not connected.");
      return;
    }

    if (!receiverId) {
      console.error("Receiver ID is required.");
      return;
    }

    if (!["audio", "video"].includes(type)) {
      console.error("Call type must be audio or video.");
      return;
    }

    if (activeCall || incomingCall) {
      console.warn("A call is already active or incoming.");
      return;
    }

    const callData = {
      receiverId: String(receiverId),
      type,
      callerName: callerName || "Vlogify User",
      callerProfilePicture: callerProfilePicture || "",
    };

    console.log("Starting call:", callData);

    setActiveCall({
      callId: null,
      receiverId: String(receiverId),
      type,
      callerName: callData.callerName,
      callerProfilePicture: callData.callerProfilePicture,
      status: "calling",
      isCaller: true,
    });

    socket.emit("callUser", callData);
  };

  // ==========================================
  // ACCEPT CALL
  // ==========================================

  const acceptCall = () => {
    if (!socket?.connected || !incomingCall) {
      console.error(
        "Cannot accept call: socket or incoming call is missing."
      );
      return;
    }

    const call = incomingCall;

    // Stop ringing immediately when the user accepts.
    stopIncomingRingtone();

    socket.emit("acceptCall", {
      callId: call.callId,
      callerId: call.callerId,
    });

    setActiveCall({
      callId: call.callId,
      callerId: call.callerId,
      type: call.type,
      callerName: call.callerName,
      callerProfilePicture: call.callerProfilePicture,
      status: "accepted",
      isCaller: false,
    });

    setIncomingCall(null);
  };

  // ==========================================
  // REJECT CALL
  // ==========================================

  const rejectCall = () => {
    if (!socket?.connected || !incomingCall) {
      return;
    }

    const call = incomingCall;

    stopIncomingRingtone();

    socket.emit("rejectCall", {
      callId: call.callId,
      callerId: call.callerId,
    });

    setIncomingCall(null);
  };

  // ==========================================
  // END CALL
  // ==========================================

  const endCall = () => {
    stopIncomingRingtone();

    if (!socket?.connected || !activeCall) {
      setActiveCall(null);
      setIncomingCall(null);
      return;
    }

    const call = activeCall;

    const receiverId = call.isCaller
      ? call.receiverId
      : call.callerId;

    if (call.callId && receiverId) {
      socket.emit("endCall", {
        callId: call.callId,
        receiverId,
      });
    }

    setActiveCall(null);
    setIncomingCall(null);
  };

  // ==========================================
  // EMIT OTHER CALL EVENTS
  // ==========================================

  const emitCallEvent = (event, data) => {
    if (!socket?.connected) {
      console.error(
        `Cannot emit "${event}": socket is not connected.`
      );
      return;
    }

    socket.emit(event, data);
  };

  // ==========================================
  // CONTEXT PROVIDER
  // ==========================================

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,

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

// ==========================================
// CUSTOM HOOK
// ==========================================

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      "useSocket must be used inside SocketProvider"
    );
  }

  return context;
};