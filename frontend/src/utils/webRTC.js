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
  const peerConnection =
    new RTCPeerConnection(
      ICE_SERVERS
    );

  peerConnection.onicecandidate = (
    event
  ) => {
    if (event.candidate) {
      onIceCandidate?.(
        event.candidate
      );
    }
  };

  peerConnection.ontrack = (
    event
  ) => {
    const stream =
      event.streams?.[0];

    if (stream) {
      onTrack?.(stream);
    }
  };

  peerConnection.onconnectionstatechange =
    () => {
      onConnectionStateChange?.(
        peerConnection.connectionState
      );
    };

  return peerConnection;
};

export const getLocalMedia = async (
  type
) => {
  const constraints = {
    audio: true,
    video: type === "video",
  };

  return navigator.mediaDevices.getUserMedia(
    constraints
  );
};

export const addLocalTracks = (
  peerConnection,
  stream
) => {
  stream.getTracks().forEach(
    (track) => {
      peerConnection.addTrack(
        track,
        stream
      );
    }
  );
};

export const stopMediaStream = (
  stream
) => {
  if (!stream) return;

  stream
    .getTracks()
    .forEach((track) => {
      track.stop();
    });
};

export const closePeerConnection = (
  peerConnection
) => {
  if (!peerConnection) return;

  try {
    peerConnection.close();
  } catch (error) {
    console.error(
      "Close peer connection error:",
      error
    );
  }
};