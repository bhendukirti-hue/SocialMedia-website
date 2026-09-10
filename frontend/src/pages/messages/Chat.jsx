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
  FiX,
  FiImage,
  FiTrash2,
  FiSlash,
  FiChevronRight,
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

  // =====================================================
  // UI STATES
  // =====================================================

  const [showMenu, setShowMenu] =
    useState(false);

  const [chatBackground, setChatBackground] =
    useState("default");

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
    axios
      .put(
        `${API_URL}/messages/${conversation._id}/read`,
        {},
        {
          withCredentials: true,
        }
      )
      .catch((error) => {
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
        axios
          .put(
            `${API_URL}/messages/${conversation._id}/read`,
            {},
            {
              withCredentials: true,
            }
          )
          .catch(() => {});
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
        if (
          socket &&
          otherUser?._id
        ) {
          socket.emit(
            "messageSent",
            {
              message: newMessage,
              receiverId:
                otherUser._id,
            }
          );
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

  // =====================================================
  // CLOSE SIDE MENU
  // =====================================================

  const closeMenu = () => {
    setShowMenu(false);
  };

  // =====================================================
  // UI ONLY - CLEAR CHAT
  // =====================================================

  const handleClearChat = () => {
    setMessages([]);
    setShowMenu(false);
  };

  // =====================================================
  // UI ONLY - BLOCK
  // =====================================================

  const handleBlock = () => {
    setShowMenu(false);
  };

  // =====================================================
  // CHAT BACKGROUND
  // =====================================================

  const backgroundClasses = {
    default:
      "bg-[#F8FAFC]",

    blue:
      "bg-blue-50",

    pink:
      "bg-pink-50",

    soft:
      "bg-slate-100",
  };

  if (!conversation) {
    return null;
  }

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-white">

      {/* =================================================
          MAIN CHAT
      ================================================= */}

      <div className="flex min-w-0 flex-1 flex-col">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="z-20 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-5">

          {/* LEFT SIDE */}

          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">

            {/* BACK BUTTON */}

            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 active:scale-95"
              aria-label="Back"
            >
              <FiArrowLeft
                size={21}
              />
            </button>

            {/* PROFILE */}

            <div className="relative flex-shrink-0">

              <div className="h-10 w-10 overflow-hidden rounded-full bg-blue-100 ring-2 ring-blue-50 sm:h-11 sm:w-11">

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
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-600 font-semibold text-white">
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

              {/* ONLINE INDICATOR */}

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />

            </div>

            {/* USER INFO */}

            <div className="min-w-0">

              <h2 className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                {otherUser?.name ||
                  otherUser?.username ||
                  "User"}
              </h2>

              <p className="truncate text-[11px] text-slate-400 sm:text-xs">
                @{otherUser?.username ||
                  "user"}
              </p>

              {typing && (
                <p className="mt-0.5 text-[11px] font-medium text-pink-500">
                  typing...
                </p>
              )}

            </div>

          </div>

          {/* RIGHT SIDE */}

          <button
            type="button"
            onClick={() =>
              setShowMenu(true)
            }
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 active:scale-95"
            aria-label="Chat options"
          >
            <FiMoreVertical
              size={20}
            />
          </button>

        </header>

        {/* =================================================
            MESSAGES
        ================================================= */}

        <div
          className={`relative min-h-0 flex-1 overflow-y-auto px-3 py-5 transition-colors duration-300 sm:px-5 ${backgroundClasses[chatBackground]}`}
        >

          {/* TOP DECORATION */}

          <div className="pointer-events-none absolute left-1/2 top-5 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-medium text-slate-400 shadow-sm backdrop-blur sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Your messages are private
          </div>

          {loading ? (
            /* =================================================
                LOADING
            ================================================= */

            <div className="flex h-full flex-col items-center justify-center">

              <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading messages...
              </p>

            </div>
          ) : messages.length ===
            0 ? (
            /* =================================================
                EMPTY CHAT
            ================================================= */

            <div className="flex h-full flex-col items-center justify-center px-5 text-center">

              {/* PROFILE */}

              <div className="relative mb-5">

                <div className="h-20 w-20 overflow-hidden rounded-full bg-blue-100 p-1 shadow-sm ring-4 ring-white">

                  <div className="h-full w-full overflow-hidden rounded-full">

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
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-600 text-2xl font-bold text-white">
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

                </div>

                <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white bg-pink-500" />

              </div>

              <h3 className="text-base font-bold text-slate-800">
                Start a conversation
              </h3>

              <p className="mt-1.5 max-w-xs text-sm leading-6 text-slate-500">
                Send a message to{" "}
                <span className="font-semibold text-slate-700">
                  {otherUser?.name ||
                    otherUser?.username}
                </span>{" "}
                and start chatting.
              </p>

            </div>
          ) : (
            /* =================================================
                MESSAGE LIST
            ================================================= */

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">

              {messages.map(
                (message) => (
                  <MessageBubble
                    key={
                      message._id
                    }
                    message={
                      message
                    }
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

            </div>
          )}

        </div>

        {/* =================================================
            MESSAGE INPUT
        ================================================= */}

        <form
          onSubmit={
            handleSendMessage
          }
          className="border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4"
        >

          <div className="mx-auto flex w-full max-w-3xl items-center gap-2">

            {/* INPUT */}

            <div className="relative min-w-0 flex-1">

              <input
                type="text"
                value={text}
                onChange={
                  handleTypingInput
                }
                placeholder="Write a message..."
                maxLength={5000}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

            </div>

            {/* SEND */}

            <button
              type="submit"
              disabled={
                !text.trim()
              }
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              aria-label="Send message"
            >
              <FiSend
                size={18}
              />
            </button>

          </div>

        </form>

      </div>

      {/* =================================================
          OVERLAY
      ================================================= */}

      {showMenu && (
        <div
          className="absolute inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
          onClick={closeMenu}
        />
      )}

      {/* =================================================
          RIGHT SIDE SETTINGS PANEL
      ================================================= */}

      <aside
        className={`absolute right-0 top-0 z-50 flex h-full w-[85%] max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
          showMenu
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >

        {/* =================================================
            PANEL HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <div>

            <h3 className="text-base font-bold text-slate-900">
              Chat settings
            </h3>

            <p className="mt-0.5 text-xs text-slate-400">
              Manage this conversation
            </p>

          </div>

          <button
            type="button"
            onClick={closeMenu}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-pink-50 hover:text-pink-600"
            aria-label="Close"
          >
            <FiX
              size={19}
            />
          </button>

        </div>

        {/* =================================================
            USER PREVIEW
        ================================================= */}

        <div className="border-b border-slate-100 px-5 py-5">

          <div className="flex items-center gap-3">

            <div className="h-12 w-12 overflow-hidden rounded-full bg-blue-100 ring-2 ring-blue-50">

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
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-600 font-bold text-white">
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

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-slate-800">
                {otherUser?.name ||
                  otherUser?.username ||
                  "User"}
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                @{otherUser?.username ||
                  "user"}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            SETTINGS
        ================================================= */}

        <div className="flex-1 overflow-y-auto px-4 py-4">

          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Appearance
          </p>

          {/* CHAT BACKGROUND */}

          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">

            <div className="flex items-center gap-3 px-1 py-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FiImage
                  size={17}
                />
              </div>

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Chat background
                </p>

                <p className="text-xs text-slate-400">
                  Choose your chat appearance
                </p>

              </div>

            </div>

            {/* BACKGROUND OPTIONS */}

            <div className="mt-3 grid grid-cols-4 gap-2">

              {/* DEFAULT */}

              <button
                type="button"
                onClick={() =>
                  setChatBackground(
                    "default"
                  )
                }
                className={`h-10 rounded-xl border bg-[#F8FAFC] transition ${
                  chatBackground ===
                  "default"
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
                title="Default"
              />

              {/* BLUE */}

              <button
                type="button"
                onClick={() =>
                  setChatBackground(
                    "blue"
                  )
                }
                className={`h-10 rounded-xl border bg-blue-50 transition ${
                  chatBackground ===
                  "blue"
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
                title="Blue"
              />

              {/* PINK */}

              <button
                type="button"
                onClick={() =>
                  setChatBackground(
                    "pink"
                  )
                }
                className={`h-10 rounded-xl border bg-pink-50 transition ${
                  chatBackground ===
                  "pink"
                    ? "border-pink-500 ring-2 ring-pink-100"
                    : "border-slate-200"
                }`}
                title="Pink"
              />

              {/* SOFT */}

              <button
                type="button"
                onClick={() =>
                  setChatBackground(
                    "soft"
                  )
                }
                className={`h-10 rounded-xl border bg-slate-100 transition ${
                  chatBackground ===
                  "soft"
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
                title="Soft"
              />

            </div>

          </div>

          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Conversation
          </p>

          {/* CLEAR CHAT */}

          <button
            type="button"
            onClick={
              handleClearChat
            }
            className="group mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition hover:bg-pink-50"
          >

            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600 transition group-hover:bg-pink-100">
              <FiTrash2
                size={18}
              />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-semibold text-slate-800">
                Clear chat
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Clear messages from this view
              </p>

            </div>

            <FiChevronRight
              size={17}
              className="text-slate-300"
            />

          </button>

          {/* BLOCK */}

          <button
            type="button"
            onClick={
              handleBlock
            }
            className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition hover:bg-red-50"
          >

            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition group-hover:bg-red-100">
              <FiSlash
                size={18}
              />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-semibold text-slate-800">
                Block user
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Stop receiving messages from this user
              </p>

            </div>

            <FiChevronRight
              size={17}
              className="text-slate-300"
            />

          </button>

        </div>

        {/* =================================================
            PANEL FOOTER
        ================================================= */}

        <div className="border-t border-slate-100 px-5 py-4">

          <div className="rounded-2xl bg-blue-50 px-4 py-3">

            <p className="text-xs leading-5 text-blue-700">
              You can customize the appearance
              of this conversation anytime.
            </p>

          </div>

        </div>

      </aside>

    </div>
  );
};

export default Chat;