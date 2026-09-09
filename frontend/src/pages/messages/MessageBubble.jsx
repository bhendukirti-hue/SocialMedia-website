import React from "react";

const MessageBubble = ({ message, currentUserId }) => {
  const senderId =
    message.sender?._id ||
    message.sender;

  const isMine =
    senderId?.toString() ===
    currentUserId?.toString();

  const date = new Date(
    message.createdAt
  );

  const formattedTime =
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      className={`flex w-full mb-3 ${
        isMine
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isMine
            ? "bg-[#0F4C5C] text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <p className="text-sm break-words">
          {message.text}
        </p>

        <div
          className={`flex items-center justify-end gap-1 mt-1 ${
            isMine
              ? "text-white/70"
              : "text-gray-400"
          }`}
        >
          <span className="text-[10px]">
            {formattedTime}
          </span>

          {isMine && (
            <span className="text-[10px]">
              {message.isRead ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;