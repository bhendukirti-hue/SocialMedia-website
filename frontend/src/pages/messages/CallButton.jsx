import React from "react";

import {
  FiPhone,
  FiVideo,
} from "react-icons/fi";

import { useSocket } from "../context/SocketContext";

const CallButton = ({
  user,
  type,
}) => {
  const {
    startCall,
    activeCall,
  } = useSocket();

  if (!user?._id) {
    return null;
  }

  const handleCall = () => {
    if (activeCall) {
      return;
    }

    startCall({
      receiverId: user._id,
      type,

      callerName:
        user.username ||
        "Vlogify User",

      callerProfilePicture:
        user.profilePicture ||
        "",
    });
  };

  const isVideo =
    type === "video";

  return (
    <button
      type="button"
      onClick={handleCall}
      disabled={Boolean(activeCall)}
      title={
        isVideo
          ? "Video call"
          : "Audio call"
      }
      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#0F2747] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isVideo ? (
        <FiVideo size={21} />
      ) : (
        <FiPhone size={20} />
      )}
    </button>
  );
};

export default CallButton;