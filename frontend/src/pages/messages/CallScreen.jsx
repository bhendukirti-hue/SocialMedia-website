import React, {
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

import { useSocket } from "../context/SocketContext";

import {
  createPeerConnection,
  getLocalMedia,
  addLocalTracks,
  stopMediaStream,
  closePeerConnection,
} from "../utils/webRTC";

const CallScreen = () => {
  const {
    socket,
    activeCall,
    setActiveCall,
    endCall,
  } = useSocket();

  const localVideoRef =
    useRef(null);

  const remoteVideoRef =
    useRef(null);

  const peerConnectionRef =
    useRef(null);

  const localStreamRef =
    useRef(null);

  const [micEnabled, setMicEnabled] =
    useState(true);

  const [cameraEnabled, setCameraEnabled] =
    useState(
      activeCall?.type ===
        "video"
    );

  const [connected, setConnected] =
    useState(false);

  const [duration, setDuration] =
    useState(0);

  const callInitialized =
    useRef(false);

  // =====================================================
  // FORMAT DURATION
  // =====================================================

  const formatDuration = (
    seconds
  ) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remaining =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  // =====================================================
  // CREATE PEER CONNECTION
  // =====================================================

  const createConnection = () => {
    if (!socket) {
      return null;
    }

    const peerConnection =
      createPeerConnection({
        onIceCandidate:
          (candidate) => {
            const receiverId =
              activeCall.isCaller
                ? activeCall.receiverId
                : activeCall.callerId;

            socket.emit(
              "iceCandidate",
              {
                receiverId,
                candidate,
                callId:
                  activeCall.callId,
              }
            );
          },

        onTrack: (stream) => {
          if (
            remoteVideoRef.current
          ) {
            remoteVideoRef.current.srcObject =
              stream;
          }
        },

        onConnectionStateChange:
          (state) => {
            console.log(
              "WebRTC state:",
              state
            );

            if (
              state === "connected"
            ) {
              setConnected(true);
            }

            if (
              state === "failed" ||
              state === "disconnected" ||
              state === "closed"
            ) {
              setConnected(false);
            }
          },
      });

    peerConnectionRef.current =
      peerConnection;

    return peerConnection;
  };

  // =====================================================
  // START LOCAL MEDIA
  // =====================================================

  const startLocalMedia =
    async () => {
      const stream =
        await getLocalMedia(
          activeCall.type
        );

      localStreamRef.current =
        stream;

      if (
        localVideoRef.current
      ) {
        localVideoRef.current.srcObject =
          stream;
      }

      return stream;
    };

  // =====================================================
  // CALLER CREATE OFFER
  // =====================================================

  const createOffer =
    async () => {
      try {
        const peerConnection =
          peerConnectionRef.current ||
          createConnection();

        if (!peerConnection) {
          return;
        }

        const stream =
          localStreamRef.current ||
          (await startLocalMedia());

        if (
          peerConnection.getSenders()
            .length === 0
        ) {
          addLocalTracks(
            peerConnection,
            stream
          );
        }

        const offer =
          await peerConnection.createOffer();

        await peerConnection.setLocalDescription(
          offer
        );

        socket.emit(
          "callOffer",
          {
            receiverId:
              activeCall.receiverId,

            offer,

            callId:
              activeCall.callId,
          }
        );
      } catch (error) {
        console.error(
          "Create offer error:",
          error
        );
      }
    };

  // =====================================================
  // RECEIVE OFFER
  // =====================================================

  const handleOffer =
    async (data) => {
      try {
        if (!activeCall) {
          return;
        }

        const peerConnection =
          peerConnectionRef.current ||
          createConnection();

        if (!peerConnection) {
          return;
        }

        const stream =
          localStreamRef.current ||
          (await startLocalMedia());

        if (
          peerConnection.getSenders()
            .length === 0
        ) {
          addLocalTracks(
            peerConnection,
            stream
          );
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(
            data.offer
          )
        );

        const answer =
          await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(
          answer
        );

        socket.emit(
          "callAnswer",
          {
            callerId:
              data.callerId,

            answer,

            callId:
              data.callId,
          }
        );
      } catch (error) {
        console.error(
          "Handle offer error:",
          error
        );
      }
    };

  // =====================================================
  // RECEIVE ANSWER
  // =====================================================

  const handleAnswer =
    async (data) => {
      try {
        const peerConnection =
          peerConnectionRef.current;

        if (!peerConnection) {
          return;
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(
            data.answer
          )
        );
      } catch (error) {
        console.error(
          "Handle answer error:",
          error
        );
      }
    };

  // =====================================================
  // ICE CANDIDATE
  // =====================================================

  const handleIceCandidate =
    async (data) => {
      try {
        const peerConnection =
          peerConnectionRef.current;

        if (!peerConnection) {
          return;
        }

        if (!data.candidate) {
          return;
        }

        await peerConnection.addIceCandidate(
          new RTCIceCandidate(
            data.candidate
          )
        );
      } catch (error) {
        console.error(
          "ICE candidate error:",
          error
        );
      }
    };

  // =====================================================
  // SOCKET EVENTS
  // =====================================================

  useEffect(() => {
    if (
      !socket ||
      !activeCall
    ) {
      return;
    }

    const onCallOffer =
      (data) => {
        handleOffer(data);
      };

    const onCallAnswer =
      (data) => {
        handleAnswer(data);
      };

    const onIceCandidate =
      (data) => {
        handleIceCandidate(data);
      };

    const onCallEnded =
      () => {
        cleanupCall(false);
      };

    socket.on(
      "callOffer",
      onCallOffer
    );

    socket.on(
      "callAnswer",
      onCallAnswer
    );

    socket.on(
      "iceCandidate",
      onIceCandidate
    );

    socket.on(
      "callEnded",
      onCallEnded
    );

    return () => {
      socket.off(
        "callOffer",
        onCallOffer
      );

      socket.off(
        "callAnswer",
        onCallAnswer
      );

      socket.off(
        "iceCandidate",
        onIceCandidate
      );

      socket.off(
        "callEnded",
        onCallEnded
      );
    };
  }, [
    socket,
    activeCall,
  ]);

  // =====================================================
  // INITIALIZE CALL
  // =====================================================

  useEffect(() => {
    if (
      !socket ||
      !activeCall ||
      activeCall.status !==
        "accepted"
    ) {
      return;
    }

    if (callInitialized.current) {
      return;
    }

    callInitialized.current =
      true;

    const initialize =
      async () => {
        try {
          createConnection();

          await startLocalMedia();

          if (activeCall.isCaller) {
            await createOffer();
          }
        } catch (error) {
          console.error(
            "Call initialization error:",
            error
          );

          alert(
            "Unable to access your camera or microphone."
          );

          cleanupCall(true);
        }
      };

    initialize();

    return () => {
      callInitialized.current =
        false;
    };
  }, [
    socket,
    activeCall?.status,
  ]);

  // =====================================================
  // CALL TIMER
  // =====================================================

  useEffect(() => {
    if (!connected) {
      return;
    }

    const timer =
      setInterval(() => {
        setDuration(
          (current) =>
            current + 1
        );
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [connected]);

  // =====================================================
  // CLEANUP
  // =====================================================

  const cleanupCall = (
    notify = true
  ) => {
    if (
      notify &&
      activeCall &&
      socket
    ) {
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
    }

    stopMediaStream(
      localStreamRef.current
    );

    closePeerConnection(
      peerConnectionRef.current
    );

    localStreamRef.current =
      null;

    peerConnectionRef.current =
      null;

    if (
      localVideoRef.current
    ) {
      localVideoRef.current.srcObject =
        null;
    }

    if (
      remoteVideoRef.current
    ) {
      remoteVideoRef.current.srcObject =
        null;
    }

    setConnected(false);
    setDuration(0);

    callInitialized.current =
      false;

    setActiveCall(null);
  };

  // =====================================================
  // END CALL
  // =====================================================

  const handleEndCall = () => {
    cleanupCall(true);
  };

  // =====================================================
  // TOGGLE MIC
  // =====================================================

  const toggleMic = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const audioTrack =
      stream.getAudioTracks()[0];

    if (!audioTrack) {
      return;
    }

    audioTrack.enabled =
      !audioTrack.enabled;

    setMicEnabled(
      audioTrack.enabled
    );
  };

  // =====================================================
  // TOGGLE CAMERA
  // =====================================================

  const toggleCamera = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const videoTrack =
      stream.getVideoTracks()[0];

    if (!videoTrack) {
      return;
    }

    videoTrack.enabled =
      !videoTrack.enabled;

    setCameraEnabled(
      videoTrack.enabled
    );
  };

  if (!activeCall) {
    return null;
  }

  const isVideo =
    activeCall.type ===
    "video";

  const remoteName =
    activeCall.callerName ||
    "Vlogify User";

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

            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white/10">

              {activeCall.callerProfilePicture ? (
                <img
                  src={
                    activeCall.callerProfilePicture
                  }
                  alt={remoteName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {remoteName
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">
              {remoteName}
            </h2>

            <p className="mt-2 text-sm text-white/60">
              {connected
                ? formatDuration(
                    duration
                  )
                : "Connecting..."}
            </p>

          </div>

        </div>
      )}

      {/* LOCAL VIDEO */}

      {isVideo && (
        <div className="absolute right-5 top-5 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl">

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-40 w-28 object-cover sm:h-48 sm:w-36"
          />

        </div>
      )}

      {/* CALL INFO */}

      {isVideo && (
        <div className="absolute left-5 top-5">

          <p className="text-lg font-semibold text-white">
            {remoteName}
          </p>

          <p className="mt-1 text-sm text-white/60">
            {connected
              ? formatDuration(
                  duration
                )
              : "Connecting..."}
          </p>

        </div>
      )}

      {/* CONTROLS */}

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4">

        <button
          type="button"
          onClick={toggleMic}
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
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          >
            {cameraEnabled ? (
              <FiVideo size={23} />
            ) : (
              <FiVideoOff
                size={23}
              />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleEndCall}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 active:scale-95"
        >
          <FiPhoneOff size={25} />
        </button>

      </div>

    </div>
  );
};

export default CallScreen;