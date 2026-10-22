
const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export const createPeerConnection = ({
  onIceCandidate,
  onTrack,
  onConnectionStateChange,
}) => {
  const peerConnection = new RTCPeerConnection(
    ICE_SERVERS
  );

  // Send ICE candidates to the other user.
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate?.(event.candidate);
    }
  };

  // Receive the other user's audio/video stream.
  peerConnection.ontrack = (event) => {
    let stream = event.streams?.[0];

    // Fallback if the browser doesn't provide a stream.
    if (!stream) {
      stream = peerConnection.__remoteStream;

      if (!stream) {
        stream = new MediaStream();
        peerConnection.__remoteStream = stream;
      }

      const alreadyAdded = stream
        .getTracks()
        .some((track) => track.id === event.track.id);

      if (!alreadyAdded) {
        stream.addTrack(event.track);
      }
    }

    onTrack?.(stream);
  };

  // Monitor connection status.
  peerConnection.onconnectionstatechange = () => {
    onConnectionStateChange?.(
      peerConnection.connectionState
    );
  };

  return peerConnection;
};

// Request microphone and, for video calls, camera access.
export const getLocalMedia = async (type) => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Camera and microphone access is unavailable. Use localhost or HTTPS and a supported browser."
    );
  }

  const constraints = {
    audio: true,
    video:
      type === "video"
        ? {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : false,
  };

  try {
    const stream =
      await navigator.mediaDevices.getUserMedia(
        constraints
      );

    // Confirm that the requested tracks are enabled.
    stream.getTracks().forEach((track) => {
      track.enabled = true;
    });

    return stream;
  } catch (error) {
    console.error("getUserMedia failed:", error);

    if (error.name === "NotAllowedError") {
      throw new Error(
        "Camera or microphone permission was denied. Allow access in your browser settings."
      );
    }

    if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      throw new Error(
        "No compatible camera or microphone was found."
      );
    }

    if (
      error.name === "NotReadableError" ||
      error.name === "TrackStartError"
    ) {
      throw new Error(
        "The camera or microphone may already be in use by another application."
      );
    }

    throw error;
  }
};

// Add local audio/video tracks to the peer connection.
export const addLocalTracks = (
  peerConnection,
  stream
) => {
  if (!peerConnection || !stream) {
    throw new Error(
      "Peer connection or local media stream is missing."
    );
  }

  const existingTrackIds = new Set(
    peerConnection
      .getSenders()
      .map((sender) => sender.track?.id)
      .filter(Boolean)
  );

  stream.getTracks().forEach((track) => {
    if (!existingTrackIds.has(track.id)) {
      peerConnection.addTrack(track, stream);
    }
  });
};

// Stop local camera and microphone tracks.
export const stopMediaStream = (stream) => {
  if (!stream) return;

  stream.getTracks().forEach((track) => {
    track.stop();
  });
};

// Close the peer connection safely.
export const closePeerConnection = (
  peerConnection
) => {
  if (!peerConnection) return;

  peerConnection.onicecandidate = null;
  peerConnection.ontrack = null;
  peerConnection.onconnectionstatechange = null;

  try {
    if (peerConnection.signalingState !== "closed") {
      peerConnection.close();
    }
  } catch (error) {
    console.error(
      "Close peer connection error:",
      error
    );
  }
};
