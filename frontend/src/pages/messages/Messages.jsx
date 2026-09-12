import React, { useEffect, useRef, useState } from "react";

import axios from "axios";

import { io } from "socket.io-client";

import { FiMessageCircle, FiSearch, FiChevronRight } from "react-icons/fi";

import { useSearchParams } from "react-router-dom";

import Chat from "./Chat";

const API_URL = "http://localhost:8808/api";

const SOCKET_URL = "http://localhost:8808";

const Messages = () => {
  const [searchParams] = useSearchParams();

  // =====================================================
  // USER ID RECEIVED FROM USER PROFILE
  // =====================================================

  const userIdFromProfile = searchParams.get("user");

  // =====================================================
  // STATES
  // =====================================================

  const [currentUser, setCurrentUser] = useState(null);

  const [conversations, setConversations] = useState([]);

  const [users, setUsers] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [socket, setSocket] = useState(null);

  // =====================================================
  // UNREAD MESSAGE COUNTS
  //
  // Example:
  // {
  //   "conversationId1": 3,
  //   "conversationId2": 7
  // }
  // =====================================================

  const [unreadCounts, setUnreadCounts] = useState({});

  // =====================================================
  // REF FOR CURRENT OPEN CONVERSATION
  //
  // This prevents Socket.IO from using an old value
  // of selectedConversation.
  // =====================================================

  const selectedConversationRef = useRef(null);

  // Keep ref updated
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/verify-token`, {
          withCredentials: true,
        });

        if (response.data.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error("Get current user error:", error);
      }
    };

    getCurrentUser();
  }, []);

  // =====================================================
  // SOCKET CONNECTION
  // =====================================================

  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("JWT token not found in localStorage");

      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      withCredentials: true,
    });

    setSocket(newSocket);

    // ===================================================
    // SOCKET CONNECTED
    // ===================================================

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    // ===================================================
    // SOCKET ERROR
    // ===================================================

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    // ===================================================
    // RECEIVE REAL-TIME MESSAGE
    // ===================================================

    newSocket.on("newMessage", (message) => {
      const conversationId = message.conversation;

      if (!conversationId) {
        return;
      }

      // ===============================================
      // UPDATE CONVERSATION LIST
      // ===============================================

      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (conversation) =>
            conversation._id?.toString() === conversationId?.toString(),
        );

        // =============================================
        // CONVERSATION NOT FOUND
        // =============================================

        if (existingIndex === -1) {
          return prev;
        }

        const updated = [...prev];

        const oldConversation = updated[existingIndex];

        const updatedConversation = {
          ...oldConversation,

          lastMessage: message,

          lastMessageText: message.text,

          lastMessageAt: message.createdAt,
        };

        updated.splice(existingIndex, 1);

        return [updatedConversation, ...updated];
      });

      // ===============================================
      // CHECK IF THIS CHAT IS CURRENTLY OPEN
      // ===============================================

      const currentlyOpen = selectedConversationRef.current;

      const isCurrentConversation =
        currentlyOpen?._id?.toString() === conversationId?.toString();

      // ===============================================
      // IF CHAT IS NOT OPEN
      // INCREASE UNREAD COUNT
      // ===============================================

      if (!isCurrentConversation) {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
    });

    // ===================================================
    // CLEANUP SOCKET
    // ===================================================

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // =====================================================
  // FETCH CONVERSATIONS
  // =====================================================

  useEffect(() => {
    if (!currentUser) return;

    fetchConversations();
  }, [currentUser]);

  // =====================================================
  // FETCH CONVERSATIONS FUNCTION
  // =====================================================

  const fetchConversations = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/messages/conversations`, {
        withCredentials: true,
      });

      if (response.data.success) {
        const fetchedConversations = response.data.conversations || [];

        setConversations(fetchedConversations);

        // =============================================
        // INITIAL UNREAD COUNTS
        //
        // Supports backend fields such as:
        // unreadCount
        // unreadMessages
        // unreadMessagesCount
        // =============================================

        const initialUnreadCounts = {};

        fetchedConversations.forEach((conversation) => {
          const count = Number(
            conversation.unreadCount ??
              conversation.unreadMessagesCount ??
              conversation.unreadMessages ??
              0,
          );

          if (count > 0) {
            initialUnreadCounts[conversation._id] = count;
          }
        });

        setUnreadCounts(initialUnreadCounts);
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // AUTOMATICALLY OPEN USER'S CHAT
  // =====================================================

  useEffect(() => {
    if (!currentUser || !userIdFromProfile) {
      return;
    }

    openConversation(userIdFromProfile);
  }, [currentUser, userIdFromProfile]);

  // =====================================================
  // SEARCH USERS
  // =====================================================

  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // =====================================================
  // SEARCH USERS FUNCTION
  // =====================================================

  const searchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/search`, {
        params: {
          query: search.trim(),
        },

        withCredentials: true,
      });

      if (response.data.success) {
        const filtered = (response.data.users || []).filter(
          (user) => user._id?.toString() !== currentUser?._id?.toString(),
        );

        setUsers(filtered);
      }
    } catch (error) {
      console.error("Search users error:", error);
    }
  };

  // =====================================================
  // OPEN CONVERSATION
  // =====================================================

  const openConversation = async (userId) => {
    if (!userId) return;

    try {
      const response = await axios.get(
        `${API_URL}/messages/conversation/${userId}`,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        const conversation = response.data.conversation;

        if (!conversation) {
          console.error("Conversation not returned by backend");

          return;
        }

        // =============================================
        // SET SELECTED CONVERSATION
        // =============================================

        setSelectedConversation(conversation);

        // =============================================
        // UPDATE REF IMMEDIATELY
        // =============================================

        selectedConversationRef.current = conversation;

        // =============================================
        // CLEAR SEARCH
        // =============================================

        setSearch("");

        setUsers([]);

        // =============================================
        // RESET UNREAD COUNT
        // =============================================

        setUnreadCounts((prev) => {
          const updated = {
            ...prev,
          };

          delete updated[conversation._id];

          return updated;
        });

        // =============================================
        // ADD / UPDATE CONVERSATION
        // =============================================

        setConversations((prev) => {
          const exists = prev.some(
            (item) => item._id?.toString() === conversation._id?.toString(),
          );

          if (exists) {
            return prev.map((item) =>
              item._id?.toString() === conversation._id?.toString()
                ? conversation
                : item,
            );
          }

          return [conversation, ...prev];
        });
      }
    } catch (error) {
      console.error("Open conversation error:", error);
    }
  };

  // =====================================================
  // OPEN EXISTING CONVERSATION
  // =====================================================

  const handleOpenConversation = (conversation) => {
    // ===============================================
    // RESET UNREAD COUNT FIRST
    // ===============================================

    setUnreadCounts((prev) => {
      const updated = {
        ...prev,
      };

      delete updated[conversation._id];

      return updated;
    });

    // ===============================================
    // SET SELECTED CHAT
    // ===============================================

    setSelectedConversation(conversation);

    selectedConversationRef.current = conversation;
  };

  // =====================================================
  // GET OTHER USER
  // =====================================================

  const getOtherUser = (conversation) => {
    if (!conversation?.participants) {
      return null;
    }

    return conversation.participants.find(
      (user) => user._id?.toString() !== currentUser?._id?.toString(),
    );
  };

  // =====================================================
  // GET PROFILE IMAGE
  // =====================================================

  const getProfileImage = (user) => {
    return (
      user?.profilePicture || user?.profilePic || user?.profileImage || null
    );
  };

  // =====================================================
  // GET USER INITIAL
  // =====================================================

  const getUserInitial = (user) => {
    return (user?.username || user?.name || "U").charAt(0).toUpperCase();
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);

    const now = new Date();

    const isToday = messageDate.toDateString() === now.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
    });
  };
  // =====================================================
  // FILTER CONVERSATIONS BY SEARCH NAME
  // =====================================================

  const filteredConversations = conversations.filter((conversation) => {
    const otherUser = getOtherUser(conversation);

    if (!otherUser) return false;

    const name = otherUser.name || otherUser.username || "";

    return name.toLowerCase().includes(search.trim().toLowerCase());
  });
  // =====================================================
  // TOTAL UNREAD COUNT
  // =====================================================

  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (total, count) => total + Number(count || 0),
    0,
  );

  // =====================================================
  // CHAT VIEW
  // =====================================================

  if (selectedConversation) {
    return (
      <div className="h-screen overflow-hidden bg-white">
        <Chat
          conversation={selectedConversation}
          currentUser={currentUser}
          socket={socket}
          onBack={() => {
            setSelectedConversation(null);

            selectedConversationRef.current = null;
          }}
        />
      </div>
    );
  }

  // =====================================================
  // MESSAGES PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6">
          {/* TOP HEADER */}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* MESSAGE ICON */}

              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiMessageCircle size={23} />

                {/* TOTAL UNREAD */}

                {totalUnreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-pink-500 px-1 text-[10px] font-bold text-white">
                    {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Messages
                </h1>

                <p className="text-xs text-slate-400 sm:text-sm">
                  Stay connected with your friends
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="relative mt-4">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people to message..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            {/* =================================================
                SEARCH RESULTS
            ================================================= */}

            {search.trim() && users.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {users.map((user) => {
                  const image = getProfileImage(user);

                  return (
                    <button
                      key={user._id}
                      onClick={() => openConversation(user._id)}
                      className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-blue-50/50"
                    >
                      {/* IMAGE */}

                      <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-blue-100 ring-2 ring-blue-50">
                        {image ? (
                          <img
                            src={image}
                            alt={user.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-blue-600 font-semibold text-white">
                            {getUserInitial(user)}
                          </div>
                        )}
                      </div>

                      {/* INFO */}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {user.name || user.username}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          @{user.username}
                        </p>
                      </div>

                      <FiChevronRight size={17} className="text-slate-300" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =================================================
          CONVERSATIONS
      ================================================= */}

      <main className="mx-auto w-full max-w-4xl px-0 sm:px-6">
        <div className="overflow-hidden bg-white sm:mt-5 sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm">
          {/* SECTION HEADER */}

          {conversations.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Recent conversations
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  {filteredConversations.length}{" "}
                  {filteredConversations.length === 1
                    ? "conversation"
                    : "conversations"}
                </p>
              </div>

              {totalUnreadCount > 0 && (
                <div className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
                  {totalUnreadCount} unread
                </div>
              )}
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-5">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading conversations...
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            /* =================================================
                EMPTY
            ================================================= */

            <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <FiMessageCircle size={34} />
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                No messages yet
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Search for a user above to start a new conversation.
              </p>
            </div>
          ) : (
            /* =================================================
                CONVERSATION LIST
            ================================================= */

            <div>
              {filteredConversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);

                if (!otherUser) {
                  return null;
                }

                const image = getProfileImage(otherUser);

                const unreadCount = Number(unreadCounts[conversation._id] || 0);

                const hasUnread = unreadCount > 0;

                return (
                  <button
                    key={conversation._id}
                    onClick={() => handleOpenConversation(conversation)}
                    className={`group flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left transition sm:px-5 ${
                      hasUnread
                        ? "bg-blue-50/40 hover:bg-blue-50"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {/* =================================================
                          PROFILE IMAGE
                      ================================================= */}

                    <div className="relative flex-shrink-0">
                      <div
                        className={`h-14 w-14 overflow-hidden rounded-full bg-blue-100 ${
                          hasUnread
                            ? "ring-2 ring-pink-200"
                            : "ring-2 ring-slate-100"
                        }`}
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={otherUser.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-blue-600 text-lg font-bold text-white">
                            {getUserInitial(otherUser)}
                          </div>
                        )}
                      </div>

                      {/* ONLINE DOT */}

                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500" />
                    </div>

                    {/* =================================================
                          MESSAGE INFO
                      ================================================= */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`truncate text-sm sm:text-[15px] ${
                            hasUnread
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-800"
                          }`}
                        >
                          {otherUser.name || otherUser.username}
                        </h3>

                        <span
                          className={`flex-shrink-0 text-[10px] sm:text-xs ${
                            hasUnread
                              ? "font-semibold text-blue-600"
                              : "text-slate-400"
                          }`}
                        >
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <p
                          className={`min-w-0 flex-1 truncate text-xs sm:text-sm ${
                            hasUnread
                              ? "font-semibold text-slate-700"
                              : "text-slate-500"
                          }`}
                        >
                          {conversation.lastMessageText ||
                            "Start a conversation"}
                        </p>
                      </div>
                    </div>

                    {/* =================================================
                          UNREAD MESSAGE COUNT
                      ================================================= */}

                    {hasUnread && (
                      <div className="flex flex-shrink-0 flex-col items-center justify-center">
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-pink-500 px-1.5 text-[11px] font-bold text-white shadow-sm shadow-pink-100">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>

                        <span className="mt-1 text-[9px] font-medium uppercase tracking-wide text-pink-500">
                          new
                        </span>
                      </div>
                    )}

                    {/* =================================================
                          ARROW
                      ================================================= */}

                    {!hasUnread && (
                      <FiChevronRight
                        size={17}
                        className="flex-shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
