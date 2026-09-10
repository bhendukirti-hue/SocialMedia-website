import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import {
  FiMessageCircle,
  FiSearch,
  FiChevronRight,
  FiEdit3,
} from "react-icons/fi";

import { useSearchParams } from "react-router-dom";

import Chat from "./Chat";

const API_URL = "http://localhost:8808/api";
const SOCKET_URL = "http://localhost:8808";

const Messages = () => {
  const [searchParams] = useSearchParams();

  // User ID received from UserProfile
  const userIdFromProfile = searchParams.get("user");

  const [currentUser, setCurrentUser] = useState(null);

  const [conversations, setConversations] = useState([]);

  const [users, setUsers] = useState([]);

  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [socket, setSocket] = useState(null);

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/auth/verify-token`,
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error(
          "Get current user error:",
          error
        );
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
      console.warn(
        "JWT token not found in localStorage"
      );

      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log(
        "Socket connected:",
        newSocket.id
      );
    });

    newSocket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message
        );
      }
    );

    // =================================================
    // RECEIVE REAL-TIME MESSAGE
    // =================================================

    newSocket.on(
      "newMessage",
      (message) => {
        setConversations((prev) => {
          const conversationId =
            message.conversation;

          const existingIndex =
            prev.findIndex(
              (conversation) =>
                conversation._id?.toString() ===
                conversationId?.toString()
            );

          // If conversation doesn't exist yet,
          // keep existing behaviour.
          if (existingIndex === -1) {
            return prev;
          }

          const updated = [...prev];

          const oldConversation =
            updated[existingIndex];

          const isCurrentConversation =
            selectedConversation?._id?.toString() ===
            conversationId?.toString();

          // Increase unread count only when
          // this conversation is not currently open.
          const oldUnreadCount = Number(
            oldConversation.unreadCount || 0
          );

          const newUnreadCount =
            isCurrentConversation
              ? 0
              : oldUnreadCount + 1;

          const conversation = {
            ...oldConversation,

            lastMessage: message,

            lastMessageText:
              message.text,

            lastMessageAt:
              message.createdAt,

            unreadCount:
              newUnreadCount,
          };

          updated.splice(
            existingIndex,
            1
          );

          return [
            conversation,
            ...updated,
          ];
        });
      }
    );

    return () => {
      newSocket.disconnect();
    };
  }, [
    currentUser,
    selectedConversation,
  ]);

  // =====================================================
  // FETCH CONVERSATIONS
  // =====================================================

  useEffect(() => {
    if (!currentUser) return;

    fetchConversations();
  }, [currentUser]);

  const fetchConversations =
    async () => {
      try {
        setLoading(true);

        const response =
          await axios.get(
            `${API_URL}/messages/conversations`,
            {
              withCredentials: true,
            }
          );

        if (response.data.success) {
          const fetchedConversations =
            response.data.conversations ||
            [];

          setConversations(
            fetchedConversations.map(
              (conversation) => ({
                ...conversation,

                // If backend sends unreadCount,
                // use it. Otherwise default to 0.
                unreadCount: Number(
                  conversation.unreadCount || 0
                ),
              })
            )
          );
        }
      } catch (error) {
        console.error(
          "Fetch conversations error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // AUTOMATICALLY OPEN USER'S CHAT
  // =====================================================

  useEffect(() => {
    if (
      !currentUser ||
      !userIdFromProfile
    ) {
      return;
    }

    openConversation(
      userIdFromProfile
    );
  }, [
    currentUser,
    userIdFromProfile,
  ]);

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

  const searchUsers =
    async () => {
      try {
        const response =
          await axios.get(
            `${API_URL}/users/search`,
            {
              params: {
                query:
                  search.trim(),
              },

              withCredentials: true,
            }
          );

        if (response.data.success) {
          const filtered =
            (
              response.data.users ||
              []
            ).filter(
              (user) =>
                user._id?.toString() !==
                currentUser?._id?.toString()
            );

          setUsers(filtered);
        }
      } catch (error) {
        console.error(
          "Search users error:",
          error
        );
      }
    };

  // =====================================================
  // OPEN CONVERSATION
  // =====================================================

  const openConversation =
    async (userId) => {
      if (!userId) return;

      try {
        const response =
          await axios.get(
            `${API_URL}/messages/conversation/${userId}`,
            {
              withCredentials: true,
            }
          );

        if (response.data.success) {
          const conversation =
            response.data.conversation;

          if (!conversation) {
            console.error(
              "Conversation not returned by backend"
            );

            return;
          }

          // =================================================
          // RESET UNREAD COUNT LOCALLY
          // =================================================

          const conversationWithReadStatus =
            {
              ...conversation,

              unreadCount: 0,
            };

          // Open exact conversation
          setSelectedConversation(
            conversationWithReadStatus
          );

          // Clear search
          setSearch("");

          setUsers([]);

          // =================================================
          // UPDATE CONVERSATION LIST
          // =================================================

          setConversations((prev) => {
            const exists =
              prev.some(
                (item) =>
                  item._id?.toString() ===
                  conversation._id?.toString()
              );

            if (exists) {
              return prev.map(
                (item) =>
                  item._id?.toString() ===
                  conversation._id?.toString()
                    ? {
                        ...conversation,
                        unreadCount: 0,
                      }
                    : item
              );
            }

            return [
              {
                ...conversation,
                unreadCount: 0,
              },
              ...prev,
            ];
          });
        }
      } catch (error) {
        console.error(
          "Open conversation error:",
          error
        );
      }
    };

  // =====================================================
  // GET OTHER USER
  // =====================================================

  const getOtherUser = (
    conversation
  ) => {
    if (!conversation?.participants) {
      return null;
    }

    return conversation.participants.find(
      (user) =>
        user._id?.toString() !==
        currentUser?._id?.toString()
    );
  };

  // =====================================================
  // GET PROFILE IMAGE
  // =====================================================

  const getProfileImage = (user) => {
    return (
      user?.profilePicture ||
      user?.profilePic ||
      user?.profileImage ||
      ""
    );
  };

  // =====================================================
  // GET USER NAME
  // =====================================================

  const getUserName = (user) => {
    return (
      user?.name ||
      user?.username ||
      "User"
    );
  };

  // =====================================================
  // GET USER INITIAL
  // =====================================================

  const getUserInitial = (user) => {
    return getUserName(user)
      .charAt(0)
      .toUpperCase();
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) return "";

    const messageDate =
      new Date(date);

    if (
      Number.isNaN(
        messageDate.getTime()
      )
    ) {
      return "";
    }

    return messageDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // GET TOTAL UNREAD MESSAGES
  // =====================================================

  const totalUnreadMessages =
    conversations.reduce(
      (total, conversation) =>
        total +
        Number(
          conversation.unreadCount || 0
        ),
      0
    );

  // =====================================================
  // CHAT VIEW
  // =====================================================

  if (selectedConversation) {
    return (
      <div className="h-screen bg-white">
        <Chat
          conversation={
            selectedConversation
          }
          currentUser={
            currentUser
          }
          socket={socket}
          onBack={() =>
            setSelectedConversation(
              null
            )
          }
        />
      </div>
    );
  }

  // =====================================================
  // MESSAGES PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">

          {/* TOP HEADER */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              {/* ICON */}

              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

                <FiMessageCircle
                  size={22}
                />

                {totalUnreadMessages >
                  0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-pink-500 px-1 text-[10px] font-bold text-white">
                    {totalUnreadMessages >
                    99
                      ? "99+"
                      : totalUnreadMessages}
                  </span>
                )}

              </div>

              <div>

                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Messages
                </h1>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Stay connected with your
                  friends
                </p>

              </div>

            </div>

            {/* NEW MESSAGE ICON */}

            <button
              type="button"
              onClick={() => {
                const searchInput =
                  document.getElementById(
                    "message-search"
                  );

                searchInput?.focus();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              title="New message"
            >
              <FiEdit3 size={18} />
            </button>

          </div>

          {/* SEARCH */}

          <div className="relative mt-5">

            <FiSearch
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              id="message-search"
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search people..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            {/* SEARCH RESULTS */}

            {search.trim() && (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                {users.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">

                    <div className="border-b border-slate-100 px-4 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        People
                      </p>
                    </div>

                    {users.map(
                      (user) => {
                        const image =
                          getProfileImage(
                            user
                          );

                        return (
                          <button
                            key={
                              user._id
                            }
                            onClick={() =>
                              openConversation(
                                user._id
                              )
                            }
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
                          >

                            {/* PROFILE */}

                            <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-blue-100 ring-2 ring-white">

                              {image ? (
                                <img
                                  src={
                                    image
                                  }
                                  alt={getUserName(
                                    user
                                  )}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-blue-600 font-semibold text-white">
                                  {getUserInitial(
                                    user
                                  )}
                                </div>
                              )}

                            </div>

                            {/* USER INFO */}

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-sm font-semibold text-slate-800">
                                {getUserName(
                                  user
                                )}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                @{user.username ||
                                  "user"}
                              </p>

                            </div>

                            <FiChevronRight
                              size={17}
                              className="text-slate-300"
                            />

                          </button>
                        );
                      }
                    )}

                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">

                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <FiSearch
                        size={20}
                      />
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      No people found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try searching with another
                      username
                    </p>

                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </header>

      {/* =================================================
          CONVERSATION AREA
      ================================================= */}

      <main className="mx-auto max-w-4xl px-0 pb-8 sm:px-6">

        <div className="overflow-hidden bg-white sm:mt-5 sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm">

          {/* CONVERSATION HEADER */}

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">

            <div>

              <h2 className="text-sm font-semibold text-slate-800">
                Recent conversations
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {conversations.length}{" "}
                {conversations.length ===
                1
                  ? "conversation"
                  : "conversations"}
              </p>

            </div>

            {totalUnreadMessages >
              0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5">

                <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />

                <span className="text-xs font-semibold text-pink-600">
                  {totalUnreadMessages >
                  99
                    ? "99+"
                    : totalUnreadMessages}{" "}
                  unread
                </span>

              </div>
            )}

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="px-4 py-6">

              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 border-b border-slate-100 px-1 py-4 last:border-b-0"
                  >

                    <div className="h-14 w-14 flex-shrink-0 animate-pulse rounded-full bg-slate-200" />

                    <div className="min-w-0 flex-1">

                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

                      <div className="mt-2 h-3 w-52 max-w-full animate-pulse rounded bg-slate-100" />

                    </div>

                  </div>
                )
              )}

            </div>
          ) : conversations.length ===
            0 ? (

            /* =================================================
                EMPTY STATE
            ================================================= */

            <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 py-20 text-center">

              <div className="relative mb-5">

                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">

                  <FiMessageCircle
                    size={34}
                    strokeWidth={1.7}
                  />

                </div>

                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-pink-500 text-white">
                  <FiEdit3 size={12} />
                </div>

              </div>

              <h2 className="text-lg font-bold text-slate-800">
                No messages yet
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Start a conversation with
                someone from Vlogify. Search
                their name above and send your
                first message.
              </p>

              <button
                type="button"
                onClick={() => {
                  const searchInput =
                    document.getElementById(
                      "message-search"
                    );

                  searchInput?.focus();
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <FiSearch
                  size={16}
                />
                Find people
              </button>

            </div>

          ) : (

            /* =================================================
                CONVERSATIONS
            ================================================= */

            <div>

              {conversations.map(
                (conversation) => {
                  const otherUser =
                    getOtherUser(
                      conversation
                    );

                  if (!otherUser) {
                    return null;
                  }

                  const image =
                    getProfileImage(
                      otherUser
                    );

                  const unreadCount =
                    Number(
                      conversation.unreadCount ||
                        0
                    );

                  const hasUnread =
                    unreadCount > 0;

                  return (
                    <button
                      key={
                        conversation._id
                      }
                      onClick={() =>
                        openConversation(
                          otherUser._id
                        )
                      }
                      className={`group flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 sm:gap-4 sm:px-5 ${
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
                          className={`h-14 w-14 overflow-hidden rounded-full bg-slate-100 ${
                            hasUnread
                              ? "ring-2 ring-blue-100"
                              : "ring-1 ring-slate-100"
                          }`}
                        >

                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={getUserName(
                                otherUser
                              )}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-600 text-lg font-bold text-white">
                              {getUserInitial(
                                otherUser
                              )}
                            </div>
                          )}

                        </div>

                        {/* NEW MESSAGE DOT */}

                        {hasUnread && (
                          <span className="absolute -right-0.5 bottom-0.5 h-4 w-4 rounded-full border-[3px] border-white bg-pink-500" />
                        )}

                      </div>

                      {/* =================================================
                          MESSAGE INFO
                      ================================================= */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-3">

                          <h3
                            className={`truncate text-sm sm:text-[15px] ${
                              hasUnread
                                ? "font-bold text-slate-900"
                                : "font-semibold text-slate-800"
                            }`}
                          >
                            {getUserName(
                              otherUser
                            )}
                          </h3>

                          <span
                            className={`flex-shrink-0 text-[11px] ${
                              hasUnread
                                ? "font-semibold text-blue-600"
                                : "text-slate-400"
                            }`}
                          >
                            {formatTime(
                              conversation.lastMessageAt
                            )}
                          </span>

                        </div>

                        <div className="mt-1.5 flex items-center gap-2">

                          <p
                            className={`min-w-0 flex-1 truncate text-sm ${
                              hasUnread
                                ? "font-medium text-slate-700"
                                : "text-slate-500"
                            }`}
                          >
                            {conversation.lastMessageText ||
                              "Start a conversation"}
                          </p>

                          {/* UNREAD COUNT */}

                          {hasUnread && (
                            <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                              {unreadCount >
                              99
                                ? "99+"
                                : unreadCount}
                            </span>
                          )}

                        </div>

                      </div>

                      {/* ARROW */}

                      <FiChevronRight
                        size={18}
                        className={`flex-shrink-0 transition ${
                          hasUnread
                            ? "text-blue-400"
                            : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-400"
                        }`}
                      />

                    </button>
                  );
                }
              )}

            </div>
          )}

        </div>

      </main>

    </div>
  );
};

export default Messages;