import React from "react";

import {
  FiPhone,
  FiVideo,
  FiX,
} from "react-icons/fi";

import { useSocket } from "../context/SocketContext";

const IncomingCall = () => {
  const {
    incomingCall,
    acceptCall,
    rejectCall,
  } = useSocket();

  if (!incomingCall) {
    return null;
  }

  const isVideo =
    incomingCall.type ===
    "video";

  const profilePicture =
    incomingCall.callerProfilePicture ||
    "https://via.placeholder.com/100";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

        <div className="flex flex-col items-center text-center">

          <div className="relative">

            <img
              src={profilePicture}
              alt={
                incomingCall.callerName ||
                "Caller"
              }
              className="h-24 w-24 rounded-full border-4 border-slate-100 object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/100";
              }}
            />

            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0F2747] text-white">
              {isVideo ? (
                <FiVideo size={18} />
              ) : (
                <FiPhone size={18} />
              )}
            </div>

          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-wider text-slate-400">
            Incoming{" "}
            {isVideo
              ? "video"
              : "audio"}{" "}
            call
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#0F2747]">
            {incomingCall.callerName ||
              "Vlogify User"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {isVideo
              ? "is calling you with video"
              : "is calling you"}
          </p>

          <div className="mt-7 flex w-full items-center justify-center gap-5">

            <button
              type="button"
              onClick={rejectCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              title="Reject"
            >
              <FiX size={25} />
            </button>

            <button
              type="button"
              onClick={acceptCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F2747] text-white shadow-lg transition hover:bg-[#173B68] active:scale-95"
              title="Accept"
            >
              {isVideo ? (
                <FiVideo size={25} />
              ) : (
                <FiPhone size={25} />
              )}
            </button>

          </div>

          <div className="mt-4 flex items-center justify-center gap-10 text-xs text-slate-400">
            <span>Decline</span>
            <span>Accept</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default IncomingCall;