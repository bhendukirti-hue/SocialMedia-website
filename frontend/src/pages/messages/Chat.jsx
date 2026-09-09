import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";

import {
  FiArrowLeft,
  FiSend,
  FiMoreVertical,
} from "react-icons/fi";

import MessageBubble from "./MessageBubble";


const API_URL =
  "http://localhost:8808/api";


const Chat = ({
  conversation,
  currentUser,
  socket,
  onBack,
}) => {
  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [typing, setTyping] =
    useState(false);

  const messagesEndRef =
    useRef(null);

  const typingTimeoutRef =
    useRef(null);


  const currentUserId =
    currentUser?._id ||
    currentUser?.id;


  const otherUser =
    conversation?.participants?.find(
      (user) =>
        user._id?.toString() !==
        currentUserId?.toString()
    );


  // =====================================================
  // LOAD MESSAGES
  // =====================================================

  useEffect(() => {
    if (!conversation?._id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);

        const response =
          await axios.get(
            `${API_URL}/messages/${conversation._id}`,
            {
              withCredentials: true,
            }
          );

        if (response.data.success) {
          setMessages(
            response.data.messages || []
          );
        }
      } catch (error) {
        console.error(
          "Fetch messages error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Join socket conversation
    if (socket) {
      socket.emit(
        "joinConversation",
        conversation._id
      );
    }

    // Mark messages as read
    axios.put(
      `${API_URL}/messages/${conversation._id}/read`,
      {},
      {
        withCredentials: true,
      }
    ).catch((error) => {
      console.error(
        "Mark read error:",
        error
      );
    });


    return () => {
      if (socket) {
        socket.emit(
          "leaveConversation",
          conversation._id
        );
      }
    };
  }, [
    conversation?._id,
    socket,
  ]);


  // =====================================================
  // RECEIVE REAL-TIME MESSAGE
  // =====================================================

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (
      newMessage
    ) => {
      if (
        newMessage.conversation?.toString() !==
        conversation?._id?.toString()
      ) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some(
          (message) =>
            message._id ===
            newMessage._id
        );

        if (exists) {
          return prev;
        }

        return [
          ...prev,
          newMessage,
        ];
      });

      // If receiver is currently viewing chat
      const senderId =
        newMessage.sender?._id ||
        newMessage.sender;

      if (
        senderId?.toString() !==
        currentUserId?.toString()
      ) {
        axios.put(
          `${API_URL}/messages/${conversation._id}/read`,
          {},
          {
            withCredentials: true,
          }
        ).catch(() => {});
      }
    };


    const handleTyping = ({
      userId,
      conversationId,
    }) => {
      if (
        conversationId?.toString() ===
          conversation?._id?.toString() &&
        userId?.toString() !==
          currentUserId?.toString()
      ) {
        setTyping(true);
      }
    };


    const handleStoppedTyping = ({
      userId,
      conversationId,
    }) => {
      if (
        conversationId?.toString() ===
          conversation?._id?.toString() &&
        userId?.toString() !==
          currentUserId?.toString()
      ) {
        setTyping(false);
      }
    };


    socket.on(
      "newMessage",
      handleNewMessage
    );

    socket.on(
      "userTyping",
      handleTyping
    );

    socket.on(
      "userStoppedTyping",
      handleStoppedTyping
    );


    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "userTyping",
        handleTyping
      );

      socket.off(
        "userStoppedTyping",
        handleStoppedTyping
      );
    };
  }, [
    socket,
    conversation?._id,
    currentUserId,
  ]);


  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);


  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = async (
    e
  ) => {
    e?.preventDefault();

    const messageText =
      text.trim();

    if (!messageText) return;

    try {
      setText("");

      if (socket && otherUser?._id) {
        socket.emit("stopTyping", {
          receiverId:
            otherUser._id,
          conversationId:
            conversation._id,
        });
      }

      const response =
        await axios.post(
          `${API_URL}/messages/${conversation._id}`,
          {
            text: messageText,
          },
          {
            withCredentials: true,
          }
        );

      if (response.data.success) {
        const newMessage =
          response.data.message;

        setMessages((prev) => {
          const exists = prev.some(
            (message) =>
              message._id ===
              newMessage._id
          );

          if (exists) {
            return prev;
          }

          return [
            ...prev,
            newMessage,
          ];
        });


        // Tell receiver through socket
        if (socket && otherUser?._id) {
          socket.emit("messageSent", {
            message: newMessage,
            receiverId:
              otherUser._id,
          });
        }
      }
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      setText(messageText);
    }
  };


  // =====================================================
  // TYPING
  // =====================================================

  const handleTypingInput = (
    e
  ) => {
    const value =
      e.target.value;

    setText(value);

    if (
      !socket ||
      !otherUser?._id ||
      !conversation?._id
    ) {
      return;
    }

    socket.emit("typing", {
      receiverId:
        otherUser._id,
      conversationId:
        conversation._id,
    });

    clearTimeout(
      typingTimeoutRef.current
    );

    typingTimeoutRef.current =
      setTimeout(() => {
        socket.emit(
          "stopTyping",
          {
            receiverId:
              otherUser._id,
            conversationId:
              conversation._id,
          }
        );
      }, 1000);
  };


  if (!conversation) {
    return null;
  }


  return (
    <div className="flex flex-col h-full bg-white">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">

        <div className="flex items-center gap-3">

          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiArrowLeft
              size={21}
            />
          </button>


          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">

            {otherUser?.profilePicture ||
            otherUser?.profilePic ||
            otherUser?.profileImage ? (
              <img
                src={
                  otherUser.profilePicture ||
                  otherUser.profilePic ||
                  otherUser.profileImage
                }
                alt={
                  otherUser.username
                }
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#0F4C5C] text-white font-semibold">
                {(
                  otherUser?.username ||
                  otherUser?.name ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

          </div>


          <div>
            <h2 className="font-semibold text-gray-900">
              {otherUser?.name ||
                otherUser?.username ||
                "User"}
            </h2>

            <p className="text-xs text-gray-500">
              @{otherUser?.username}
            </p>

            {typing && (
              <p className="text-xs text-[#0F4C5C]">
                typing...
              </p>
            )}
          </div>

        </div>


        <button className="p-2 rounded-full hover:bg-gray-100">
          <FiMoreVertical
            size={20}
          />
        </button>

      </div>


      {/* MESSAGES */}

      <div className="flex-1 overflow-y-auto px-4 py-5 bg-gray-50">

        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">

            <div className="w-16 h-16 rounded-full bg-[#0F4C5C] text-white flex items-center justify-center text-xl font-bold mb-3">
              {(
                otherUser?.username ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <h3 className="font-semibold text-gray-800">
              Start a conversation
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Send a message to{" "}
              {otherUser?.name ||
                otherUser?.username}
            </p>

          </div>
        ) : (
          <>
            {messages.map(
              (message) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  currentUserId={
                    currentUserId
                  }
                />
              )
            )}

            <div
              ref={
                messagesEndRef
              }
            />
          </>
        )}

      </div>


      {/* INPUT */}

      <form
        onSubmit={
          handleSendMessage
        }
        className="p-3 border-t bg-white"
      >

        <div className="flex items-center gap-2">

          <input
            type="text"
            value={text}
            onChange={
              handleTypingInput
            }
            placeholder="Write a message..."
            maxLength={5000}
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 outline-none focus:border-[#0F4C5C] focus:ring-1 focus:ring-[#0F4C5C]"
          />

          <button
            type="submit"
            disabled={!text.trim()}
            className="w-12 h-12 rounded-full bg-[#0F4C5C] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            <FiSend
              size={19}
            />
          </button>

        </div>

      </form>

    </div>
  );
};

export default Chat;