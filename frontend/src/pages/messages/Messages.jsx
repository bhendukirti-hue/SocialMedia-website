import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import { io } from "socket.io-client";

import {
  FiMessageCircle,
  FiSearch,
} from "react-icons/fi";

import {
  useSearchParams,
} from "react-router-dom";

import Chat from "./Chat";

const API_URL =
  "http://localhost:8808/api";

const SOCKET_URL =
  "http://localhost:8808";

const Messages = () => {
  const [searchParams] =
    useSearchParams();

  // User ID received from UserProfile
  const userIdFromProfile =
    searchParams.get("user");

  const [currentUser, setCurrentUser] =
    useState(null);

  const [conversations, setConversations] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [socket, setSocket] =
    useState(null);

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response =
          await axios.get(
            `${API_URL}/auth/verify-token`,
            {
              withCredentials: true,
            }
          );

        if (response.data.success) {
          setCurrentUser(
            response.data.user
          );
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

    const token =
      localStorage.getItem("token");

    if (!token) {
      console.warn(
        "JWT token not found in localStorage"
      );

      return;
    }

    const newSocket = io(
      SOCKET_URL,
      {
        auth: {
          token,
        },
        withCredentials: true,
      }
    );

    setSocket(newSocket);

    newSocket.on(
      "connect",
      () => {
        console.log(
          "Socket connected:",
          newSocket.id
        );
      }
    );

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
        setConversations(
          (prev) => {
            const conversationId =
              message.conversation;

            const existingIndex =
              prev.findIndex(
                (conversation) =>
                  conversation._id?.toString() ===
                  conversationId?.toString()
              );

            if (
              existingIndex === -1
            ) {
              return prev;
            }

            const updated =
              [...prev];

            const conversation =
              {
                ...updated[
                  existingIndex
                ],
                lastMessage:
                  message,
                lastMessageText:
                  message.text,
                lastMessageAt:
                  message.createdAt,
              };

            updated.splice(
              existingIndex,
              1
            );

            return [
              conversation,
              ...updated,
            ];
          }
        );
      }
    );

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

        if (
          response.data.success
        ) {
          setConversations(
            response.data.conversations ||
              []
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

    const timer =
      setTimeout(() => {
        searchUsers();
      }, 400);

    return () =>
      clearTimeout(timer);
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

        if (
          response.data.success
        ) {
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

        if (
          response.data.success
        ) {
          const conversation =
            response.data.conversation;

          if (!conversation) {
            console.error(
              "Conversation not returned by backend"
            );

            return;
          }

          // Open this exact conversation
          setSelectedConversation(
            conversation
          );

          // Clear search
          setSearch("");
          setUsers([]);

          // Add conversation to list
          setConversations(
            (prev) => {
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
                      ? conversation
                      : item
                );
              }

              return [
                conversation,
                ...prev,
              ];
            }
          );
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
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    date
  ) => {
    if (!date) return "";

    return new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}

      <div className="bg-white border-b px-5 py-4">

        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-3">

            <FiMessageCircle
              size={25}
              className="text-[#0F4C5C]"
            />

            <h1 className="text-xl font-bold text-gray-900">
              Messages
            </h1>

          </div>

          {/* SEARCH */}

          <div className="relative mt-4">

            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search people to message..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 border border-transparent outline-none focus:border-[#0F4C5C] focus:bg-white"
            />

            {/* SEARCH RESULTS */}

            {search.trim() &&
              users.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg overflow-hidden">

                  {users.map(
                    (user) => (
                      <button
                        key={
                          user._id
                        }
                        onClick={() =>
                          openConversation(
                            user._id
                          )
                        }
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                      >

                        <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">

                          {user.profilePicture ||
                          user.profilePic ||
                          user.profileImage ? (
                            <img
                              src={
                                user.profilePicture ||
                                user.profilePic ||
                                user.profileImage
                              }
                              alt={
                                user.username
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#0F4C5C] text-white font-semibold">
                              {(
                                user.username ||
                                user.name ||
                                "U"
                              )
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>
                          )}

                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">
                            {user.name ||
                              user.username}
                          </p>

                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                        </div>

                      </button>
                    )
                  )}

                </div>
              )}

          </div>

        </div>

      </div>

      {/* CONVERSATIONS */}

      <div className="max-w-4xl mx-auto bg-white min-h-[calc(100vh-140px)]">

        {loading ? (
          <div className="flex justify-center py-10">
            <p className="text-gray-500">
              Loading conversations...
            </p>
          </div>
        ) : conversations.length ===
          0 ? (

          <div className="flex flex-col items-center justify-center py-24 text-center px-5">

            <div className="w-20 h-20 rounded-full bg-[#0F4C5C]/10 flex items-center justify-center mb-4">

              <FiMessageCircle
                size={35}
                className="text-[#0F4C5C]"
              />

            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              No messages yet
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Search for a user above to
              start a conversation.
            </p>

          </div>

        ) : (

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

                return (
                  <button
                    key={
                      conversation._id
                    }
                    onClick={() =>
                      setSelectedConversation(
                        conversation
                      )
                    }
                    className="w-full flex items-center gap-4 px-5 py-4 border-b hover:bg-gray-50 text-left transition"
                  >

                    {/* PROFILE */}

                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">

                      {otherUser.profilePicture ||
                      otherUser.profilePic ||
                      otherUser.profileImage ? (
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
                        <div className="w-full h-full flex items-center justify-center bg-[#0F4C5C] text-white text-lg font-semibold">
                          {(
                            otherUser.username ||
                            otherUser.name ||
                            "U"
                          )
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>
                      )}

                    </div>

                    {/* INFO */}

                    <div className="flex-1 min-w-0">

                      <div className="flex items-center justify-between">

                        <h3 className="font-semibold text-gray-900 truncate">
                          {otherUser.name ||
                            otherUser.username}
                        </h3>

                        <span className="text-xs text-gray-400 ml-2">
                          {formatTime(
                            conversation.lastMessageAt
                          )}
                        </span>

                      </div>

                      <p className="text-sm text-gray-500 truncate mt-1">

                        {conversation.lastMessageText ||
                          "Start a conversation"}

                      </p>

                    </div>

                  </button>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default Messages;