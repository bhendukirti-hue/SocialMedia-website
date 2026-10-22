
import { useCallback, useEffect, useRef, useState } from "react";
import { callService } from "../services/callService";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export default function useCall(socket) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState("");

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const activeCallRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const mountedRef = useRef(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const updateActiveCall = useCallback((call) => {
    activeCallRef.current = call;
    setActiveCall(call);
  }, []);

  const stopMedia = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    setRemoteStream(null);

    pendingCandidatesRef.current = [];
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  const resetCall = useCallback(() => {
    stopMedia();
    activeCallRef.current = null;
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus("idle");
    setError("");
  }, [stopMedia]);

  const getMedia = useCallback(async (type) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera and microphone require HTTPS or localhost.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    localStreamRef.current = stream;

    if (mountedRef.current) {
      setLocalStream(stream);
    }

    return stream;
  }, []);

  const createPeer = useCallback((call) => {
    if (peerRef.current) return peerRef.current;

    const peer = new RTCPeerConnection(rtcConfig);
    peerRef.current = peer;

    const stream = new MediaStream();
    remoteStreamRef.current = stream;
    setRemoteStream(stream);

    peer.ontrack = (event) => {
      const incomingStream = event.streams?.[0];

      if (incomingStream) {
        remoteStreamRef.current = incomingStream;
        setRemoteStream(incomingStream);
      } else {
        stream.addTrack(event.track);
        setRemoteStream(new MediaStream(stream.getTracks()));
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        callService.sendIceCandidate(socket, {
          callId: call.callId,
          receiverId: call.peerId,
          candidate: event.candidate,
        });
      }
    };

    peer.onconnectionstatechange = () => {
      if (
        ["failed", "closed"].includes(peer.connectionState) &&
        mountedRef.current
      ) {
        setError("Call connection lost.");
      }
    };

    return peer;
  }, [socket]);

  const addPendingCandidates = useCallback(async (peer) => {
    const candidates = pendingCandidatesRef.current.splice(0);

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE candidate error:", err);
      }
    }
  }, []);

  const startCall = useCallback(async (receiverId, callType = "audio") => {
    if (!socket?.connected) {
      setError("You are not connected to the messaging server.");
      return;
    }

    if (activeCallRef.current || incomingCall) {
      setError("You already have an active call.");
      return;
    }

    try {
      setError("");
      await getMedia(callType);

      const call = await callService.initiate(
        socket,
        receiverId,
        callType
      );

      const nextCall = {
        ...call,
        peerId: String(receiverId),
        isCaller: true,
      };

      updateActiveCall(nextCall);
      setCallStatus("ringing");
    } catch (err) {
      stopMedia();
      setError(err.message || "Unable to start call.");
    }
  }, [
    socket,
    incomingCall,
    getMedia,
    updateActiveCall,
    stopMedia,
  ]);

  const acceptCall = useCallback(async () => {
    const call = incomingCall;
    if (!call || !socket?.connected) return;

    try {
      setError("");
      await getMedia(call.callType);

      const nextCall = {
        ...call,
        peerId: String(call.callerId),
        isCaller: false,
      };

      updateActiveCall(nextCall);
      createPeer(nextCall);
      callService.accept(socket, call.callId);

      setIncomingCall(null);
      setCallStatus("connecting");
    } catch (err) {
      setError(err.message || "Unable to access microphone or camera.");
      stopMedia();
    }
  }, [
    incomingCall,
    socket,
    getMedia,
    updateActiveCall,
    createPeer,
    stopMedia,
  ]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      callService.reject(socket, incomingCall.callId);
    }

    setIncomingCall(null);
    setCallStatus("idle");
  }, [socket, incomingCall]);

  const endCall = useCallback(() => {
    const call = activeCallRef.current;

    if (call) {
      callService.end(socket, call.callId);
    }

    resetCall();
  }, [socket, resetCall]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const nextOff = !isCameraOff;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !nextOff;
    });
    setIsCameraOff(nextOff);
  }, [isCameraOff]);

  useEffect(() => {
    mountedRef.current = true;
    if (!socket) return;

    const onIncoming = (call) => {
      if (activeCallRef.current) {
        callService.reject(socket, call.callId);
        return;
      }

      setIncomingCall(call);
      setCallStatus("incoming");
    };

    const onAccepted = async (data) => {
      const call = activeCallRef.current;

      if (!call || call.callId !== data.callId || !call.isCaller) {
        return;
      }

      try {
        const peer = createPeer(call);

        localStreamRef.current?.getTracks().forEach((track) => {
          peer.addTrack(track, localStreamRef.current);
        });

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        callService.sendOffer(socket, {
          callId: call.callId,
          receiverId: call.peerId,
          offer,
        });

        setCallStatus("connecting");
      } catch (err) {
        console.error("Create offer error:", err);
        setError("Could not establish the call.");
      }
    };

    const onOffer = async (data) => {
      const call = activeCallRef.current;

      if (!call || call.callId !== data.callId || call.isCaller) return;

      try {
        const peer = createPeer(call);

        localStreamRef.current?.getTracks().forEach((track) => {
          peer.addTrack(track, localStreamRef.current);
        });

        await peer.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        await addPendingCandidates(peer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        callService.sendAnswer(socket, {
          callId: call.callId,
          receiverId: call.peerId,
          answer,
        });
      } catch (err) {
        console.error("Handle offer error:", err);
        setError("Could not connect the call.");
      }
    };

    const onAnswer = async (data) => {
      const call = activeCallRef.current;
      const peer = peerRef.current;

      if (!call || call.callId !== data.callId || !call.isCaller || !peer) {
        return;
      }

      try {
        await peer.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        await addPendingCandidates(peer);
      } catch (err) {
        console.error("Handle answer error:", err);
      }
    };

    const onCandidate = async (data) => {
      const call = activeCallRef.current;

      if (!call || call.callId !== data.callId) return;

      const peer = peerRef.current;

      if (!peer?.remoteDescription) {
        pendingCandidatesRef.current.push(data.candidate);
        return;
      }

      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (err) {
        console.error("Add ICE candidate error:", err);
      }
    };

    const onEnded = (data) => {
      if (activeCallRef.current?.callId === data.callId) {
        resetCall();
      }
    };

    const onRejected = (data) => {
      if (activeCallRef.current?.callId === data.callId) {
        resetCall();
        setError("The call was declined.");
      }
    };

    const onSocketDisconnect = () => {
      if (activeCallRef.current) {
        resetCall();
        setError("Connection lost. Please call again.");
      }
    };

    const onPeerState = () => {
      const peer = peerRef.current;

      if (peer?.connectionState === "connected") {
        setCallStatus("connected");
      }
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onCandidate);
    socket.on("call:ended", onEnded);
    socket.on("call:rejected", onRejected);
    socket.on("disconnect", onSocketDisconnect);

    // Peer state changes are handled in createPeer; this listener
    // is retained only as a placeholder for optional UI integration.
    void onPeerState;

    return () => {
      mountedRef.current = false;
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onCandidate);
      socket.off("call:ended", onEnded);
      socket.off("call:rejected", onRejected);
      socket.off("disconnect", onSocketDisconnect);
    };
  }, [
    socket,
    createPeer,
    addPendingCandidates,
    resetCall,
  ]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopMedia();
    };
  }, [stopMedia]);

  return {
    incomingCall,
    activeCall,
    callStatus,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    error,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
