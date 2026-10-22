
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FiMic,
  FiMicOff,
  FiPhoneOff,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi";

import { useSocket } from "../../context/SocketContext";

import {
  createPeerConnection,
  getLocalMedia,
  addLocalTracks,
  stopMediaStream,
  closePeerConnection,
} from "../../utils/webRTC";

const CallScreen = () => {
  const {
    socket,
    activeCall,
    setActiveCall,
  } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callInitialized = useRef(false);
  const pendingCandidatesRef = useRef([]);
  const audioContextRef = useRef(null);
  const ringtoneRef = useRef(null);
  const ringtoneGainRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const isCleaningUpRef = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [duration, setDuration] = useState(0);

  const callId = activeCall?.callId;
  const callStatus = activeCall?.status;
  const callType = activeCall?.type;
  const isCaller = activeCall?.isCaller;
  const receiverId = activeCall?.receiverId;
  const callerId = activeCall?.callerId;

  const isVideo = callType === "video";

  const remoteName = isCaller
    ? activeCall?.receiverName || "Vlogify User"
    : activeCall?.callerName || "Vlogify User";

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  // Log call state for debugging.
  useEffect(() => {
    console.log("CALL SCREEN STATE:", {
      status: callStatus,
      type: callType,
      callId,
      isCaller,
      receiverId,
      callerId,
    });
  }, [
    callStatus,
    callType,
    callId,
    isCaller,
    receiverId,
    callerId,
  ]);

  // Attach the local camera stream whenever it becomes available.
  useEffect(() => {
    const video = localVideoRef.current;

    if (!video || !localStream || !isVideo) {
      return;
    }

    video.srcObject = localStream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    const playVideo = async () => {
      try {
        await video.play();
        console.log("Local camera preview started.");
      } catch (error) {
        console.error(
          "Local camera preview failed:",
          error
        );
      }
    };

    void playVideo();

    console.log(
      "Local video tracks:",
      localStream.getVideoTracks().map((track) => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
      }))
    );

    return () => {
      if (video.srcObject === localStream) {
        video.srcObject = null;
      }
    };
  }, [localStream, isVideo]);

  // Attach the remote participant's stream.
  useEffect(() => {
    const video = remoteVideoRef.current;

    if (!video || !remoteStream || !isVideo) {
      return;
    }

    video.srcObject = remoteStream;
    video.autoplay = true;
    video.playsInline = true;

    video.play().catch((error) => {
      console.warn(
        "Remote video playback failed:",
        error
      );
    });

    return () => {
      if (video.srcObject === remoteStream) {
        video.srcObject = null;
      }
    };
  }, [remoteStream, isVideo]);

  // Request camera and microphone access.
  const startLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    console.log(
      "Requesting camera/microphone:",
      callType
    );

    const stream = await getLocalMedia(callType);

    localStreamRef.current = stream;
    setLocalStream(stream);

    const videoTracks = stream.getVideoTracks();

    console.log(
      "Local media tracks:",
      stream.getTracks().map((track) => ({
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
      }))
    );

    if (callType === "video" && videoTracks.length === 0) {
      console.error(
        "Video call requested, but no camera track was returned."
      );
    }

    // Attach immediately if the video element is mounted.
    const video = localVideoRef.current;

    if (video && callType === "video") {
      video.srcObject = stream;
      video.muted = true;

      try {
        await video.play();
      } catch (error) {
        console.warn(
          "Could not start local preview immediately:",
          error
        );
      }
    }

    setMicEnabled(
      stream.getAudioTracks().some((track) => track.enabled)
    );

    setCameraEnabled(
      callType === "video" &&
        videoTracks.some((track) => track.enabled)
    );

    return stream;
  }, [callType]);

  // Stop the caller's ringback tone.
  const stopRingback = useCallback(() => {
    if (ringIntervalRef.current) {
      window.clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }

    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.stop();
      } catch {
        // The oscillator may already have stopped.
      }

      ringtoneRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    ringtoneGainRef.current = null;
  }, []);

  // Start a repeating ringback tone while the caller waits.
  const startRingback = useCallback(async () => {
    if (
      audioContextRef.current ||
      !activeCall?.isCaller ||
      activeCall?.status !== "calling"
    ) {
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) {
        console.warn(
          "Web Audio is not supported in this browser."
        );
        return;
      }

      const context = new AudioContextClass();
      audioContextRef.current = context;

      if (context.state === "suspended") {
        await context.resume();
      }

      if (
        audioContextRef.current !== context ||
        context.state !== "running"
      ) {
        return;
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 440;
      gain.gain.value = 0;

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();

      ringtoneRef.current = oscillator;
      ringtoneGainRef.current = gain;

      let audible = false;

      ringIntervalRef.current = window.setInterval(() => {
        if (
          audioContextRef.current !== context ||
          context.state !== "running"
        ) {
          return;
        }

        audible = !audible;

        gain.gain.setTargetAtTime(
          audible ? 0.12 : 0,
          context.currentTime,
          0.03
        );
      }, 1500);

      console.log("Caller ringback tone started.");
    } catch (error) {
      console.warn(
        "Unable to start ringback tone:",
        error
      );
    }
  }, [activeCall]);

  useEffect(() => {
    if (isCaller && callStatus === "calling") {
      void startRingback();
    } else {
      stopRingback();
    }

    return () => {
      stopRingback();
    };
  }, [
    isCaller,
    callStatus,
    startRingback,
    stopRingback,
  ]);

  // Create the WebRTC peer connection.
  const createConnection = useCallback(() => {
    if (!socket) {
      console.error("Socket is not connected.");
      return null;
    }

    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    let peerConnection;

    peerConnection = createPeerConnection({
      onIceCandidate: (candidate) => {
        const targetId = isCaller
          ? receiverId
          : callerId;

        if (!targetId) {
          console.error(
            "Cannot send ICE candidate: peer ID is missing.",
            { receiverId, callerId }
          );
          return;
        }

        socket.emit("iceCandidate", {
          receiverId: targetId,
          candidate,
          callId,
        });
      },

      onTrack: (stream) => {
        console.log(
          "Remote track received:",
          stream.getTracks().map((track) => ({
            kind: track.kind,
            readyState: track.readyState,
          }))
        );

        peerConnection.__remoteStream = stream;
        setRemoteStream(stream);
      },

      onConnectionStateChange: (state) => {
        console.log(
          "WebRTC connection state:",
          state
        );

        setConnected(state === "connected");

        if (state === "connected") {
          stopRingback();
        }

        if (
          state === "failed" ||
          state === "disconnected"
        ) {
          console.warn(
            "WebRTC connection state:",
            state
          );
        }
      },
    });

    peerConnectionRef.current = peerConnection;

    return peerConnection;
  }, [
    socket,
    isCaller,
    receiverId,
    callerId,
    callId,
    stopRingback,
  ]);

  // Apply ICE candidates that arrived before remote description.
  const flushPendingCandidates = useCallback(
    async (peerConnection) => {
      const candidates = pendingCandidatesRef.current;
      pendingCandidatesRef.current = [];

      for (const candidate of candidates) {
        try {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error(
            "Queued ICE candidate failed:",
            error
          );
        }
      }
    },
    []
  );

  // Create and send an offer from the caller.
  const createOffer = useCallback(async () => {
    try {
      const peerConnection =
        peerConnectionRef.current ||
        createConnection();

      if (!peerConnection) return;

      const stream =
        localStreamRef.current ||
        (await startLocalMedia());

      if (peerConnection.getSenders().length === 0) {
        addLocalTracks(peerConnection, stream);
      }

      const offer = await peerConnection.createOffer();

      await peerConnection.setLocalDescription(offer);

      if (!receiverId || !callId) {
        console.error(
          "Cannot send offer: call details are missing.",
          { receiverId, callId }
        );
        return;
      }

      console.log("Sending call offer:", callId);

      socket.emit("callOffer", {
        receiverId,
        offer,
        callId,
      });
    } catch (error) {
      console.error("Create offer failed:", error);
    }
  }, [
    createConnection,
    startLocalMedia,
    receiverId,
    callId,
    socket,
  ]);

  // Receive the caller's offer and send an answer.
  const handleOffer = useCallback(
    async (data) => {
      try {
        if (!activeCall || !data?.offer) return;

        if (
          callId &&
          data.callId &&
          callId !== data.callId
        ) {
          console.warn(
            "Ignoring offer for a different call."
          );
          return;
        }

        const peerConnection =
          peerConnectionRef.current ||
          createConnection();

        if (!peerConnection) return;

        const stream =
          localStreamRef.current ||
          (await startLocalMedia());

        if (peerConnection.getSenders().length === 0) {
          addLocalTracks(peerConnection, stream);
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        await flushPendingCandidates(peerConnection);

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        if (!data.callerId || !data.callId) {
          console.error(
            "Cannot send answer: caller ID or call ID is missing."
          );
          return;
        }

        console.log("Sending call answer:", data.callId);

        socket.emit("callAnswer", {
          callerId: data.callerId,
          answer,
          callId: data.callId,
        });
      } catch (error) {
        console.error("Handle offer failed:", error);
      }
    },
    [
      activeCall,
      callId,
      createConnection,
      startLocalMedia,
      flushPendingCandidates,
      socket,
    ]
  );

  // Receive the callee's answer.
  const handleAnswer = useCallback(
    async (data) => {
      try {
        const peerConnection =
          peerConnectionRef.current;

        if (!peerConnection || !data?.answer) return;

        if (
          callId &&
          data.callId &&
          callId !== data.callId
        ) {
          console.warn(
            "Ignoring answer for a different call."
          );
          return;
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );

        await flushPendingCandidates(peerConnection);

        console.log("Remote answer applied.");
      } catch (error) {
        console.error("Handle answer failed:", error);
      }
    },
    [callId, flushPendingCandidates]
  );

  // Receive ICE candidates from the other participant.
  const handleIceCandidate = useCallback(
    async (data) => {
      try {
        if (!data?.candidate) return;

        if (
          callId &&
          data.callId &&
          callId !== data.callId
        ) {
          return;
        }

        const peerConnection =
          peerConnectionRef.current;

        if (
          !peerConnection ||
          !peerConnection.remoteDescription
        ) {
          pendingCandidatesRef.current.push(
            data.candidate
          );
          return;
        }

        await peerConnection.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (error) {
        console.error("ICE candidate failed:", error);
      }
    },
    [callId]
  );

  // Clean up media and call state.
  const cleanupCall = useCallback(
    (notify = true) => {
      if (isCleaningUpRef.current) return;

      isCleaningUpRef.current = true;

      const currentCall = activeCall;

      stopRingback();

      if (notify && currentCall && socket) {
        const targetId = currentCall.isCaller
          ? currentCall.receiverId
          : currentCall.callerId;

        socket.emit("endCall", {
          callId: currentCall.callId,
          receiverId: targetId,
        });
      }

      stopMediaStream(localStreamRef.current);
      closePeerConnection(peerConnectionRef.current);

      localStreamRef.current = null;
      peerConnectionRef.current = null;
      pendingCandidatesRef.current = [];
      callInitialized.current = false;

      setLocalStream(null);
      setRemoteStream(null);
      setConnected(false);
      setDuration(0);
      setMicEnabled(true);
      setCameraEnabled(false);
      setActiveCall(null);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      window.setTimeout(() => {
        isCleaningUpRef.current = false;
      }, 0);
    },
    [
      activeCall,
      socket,
      setActiveCall,
      stopRingback,
    ]
  );

  // Register signaling listeners.
  useEffect(() => {
    if (!socket || !activeCall) return;

    const onCallOffer = (data) => {
      void handleOffer(data);
    };

    const onCallAnswer = (data) => {
      void handleAnswer(data);
    };

    const onIceCandidate = (data) => {
      void handleIceCandidate(data);
    };

    const onCallEnded = (data) => {
      if (
        callId &&
        data?.callId &&
        callId !== data.callId
      ) {
        return;
      }

      console.log(
        "Remote participant ended the call."
      );

      cleanupCall(false);
    };

    socket.on("callOffer", onCallOffer);
    socket.on("callAnswer", onCallAnswer);
    socket.on("iceCandidate", onIceCandidate);
    socket.on("callEnded", onCallEnded);

    return () => {
      socket.off("callOffer", onCallOffer);
      socket.off("callAnswer", onCallAnswer);
      socket.off("iceCandidate", onIceCandidate);
      socket.off("callEnded", onCallEnded);
    };
  }, [
    socket,
    activeCall,
    callId,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupCall,
  ]);

  // Initialize media and WebRTC after the call is accepted.
  useEffect(() => {
    if (
      !socket ||
      !activeCall ||
      callStatus !== "accepted" ||
      callInitialized.current
    ) {
      return;
    }

    callInitialized.current = true;

    const initializeCall = async () => {
      try {
        console.log(
          "Initializing accepted call:",
          {
            callId,
            isCaller,
            callType,
          }
        );

        const stream = await startLocalMedia();

        const peerConnection = createConnection();

        if (!peerConnection) {
          throw new Error(
            "Unable to create peer connection."
          );
        }

        if (peerConnection.getSenders().length === 0) {
          addLocalTracks(peerConnection, stream);
        }

        if (isCaller) {
          await createOffer();
        }
      } catch (error) {
        console.error(
          "Call initialization failed:",
          error
        );

        alert(
          error.message ||
            "Unable to start the call. Check camera and microphone permissions."
        );

        cleanupCall(true);
      }
    };

    void initializeCall();
  }, [
    socket,
    activeCall,
    callStatus,
    callId,
    isCaller,
    callType,
    startLocalMedia,
    createConnection,
    createOffer,
    cleanupCall,
  ]);

  // Call duration timer.
  useEffect(() => {
    if (!connected) return undefined;

    const timer = window.setInterval(() => {
      setDuration((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [connected]);

  // Release media if the component unmounts.
  useEffect(() => {
    return () => {
      stopRingback();
      stopMediaStream(localStreamRef.current);
      closePeerConnection(peerConnectionRef.current);

      localStreamRef.current = null;
      peerConnectionRef.current = null;
      pendingCandidatesRef.current = [];
      callInitialized.current = false;
    };
  }, [stopRingback]);

  const toggleMic = () => {
    const audioTrack =
      localStreamRef.current?.getAudioTracks()[0];

    if (!audioTrack) {
      console.warn(
        "No microphone track is available."
      );
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;
    setMicEnabled(audioTrack.enabled);
  };

  const toggleCamera = () => {
    const videoTrack =
      localStreamRef.current?.getVideoTracks()[0];

    if (!videoTrack) {
      console.warn(
        "No camera track is available."
      );
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;
    setCameraEnabled(videoTrack.enabled);
  };

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#07111F]">
      {isVideo ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            {activeCall.callerProfilePicture ||
            activeCall.receiverProfilePicture ? (
              <img
                src={
                  isCaller
                    ? activeCall.receiverProfilePicture
                    : activeCall.callerProfilePicture
                }
                alt={remoteName}
                className="mx-auto h-32 w-32 rounded-full object-cover"
              />
            ) : (
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white/10 text-4xl font-bold text-white">
                {remoteName.charAt(0).toUpperCase()}
              </div>
            )}

            <h2 className="mt-6 text-2xl font-bold text-white">
              {remoteName}
            </h2>

            <p className="mt-2 text-sm text-white/60">
              {connected
                ? formatDuration(duration)
                : callStatus === "calling"
                  ? "Ringing..."
                  : "Connecting..."}
            </p>
          </div>
        </div>
      )}

      {isVideo && (
        <div className="absolute right-5 top-5 h-40 w-28 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl sm:h-48 sm:w-36">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full scale-x-[-1] object-cover"
          />

          {!localStream?.getVideoTracks().length && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-2 text-center text-xs text-white">
              Starting camera...
            </div>
          )}
        </div>
      )}

      {isVideo && (
        <div className="absolute left-5 top-5">
          <p className="text-lg font-semibold text-white">
            {remoteName}
          </p>

          <p className="mt-1 text-sm text-white/60">
            {connected
              ? formatDuration(duration)
              : callStatus === "calling"
                ? "Ringing..."
                : "Connecting..."}
          </p>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4">
        <button
          type="button"
          onClick={toggleMic}
          aria-label={
            micEnabled
              ? "Mute microphone"
              : "Enable microphone"
          }
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
        >
          {micEnabled ? (
            <FiMic size={23} />
          ) : (
            <FiMicOff size={23} />
          )}
        </button>

        {isVideo && (
          <button
            type="button"
            onClick={toggleCamera}
            aria-label={
              cameraEnabled
                ? "Turn camera off"
                : "Turn camera on"
            }
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          >
            {cameraEnabled ? (
              <FiVideo size={23} />
            ) : (
              <FiVideoOff size={23} />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => cleanupCall(true)}
          aria-label="End call"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 active:scale-95"
        >
          <FiPhoneOff size={25} />
        </button>
      </div>
    </div>
  );
};

export default CallScreen;
