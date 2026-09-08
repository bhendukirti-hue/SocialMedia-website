import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiHeart,
  FiUserPlus,
  FiMessageCircle,
  FiCheck,
} from "react-icons/fi";

const Notifications = () => {
  const navigate = useNavigate();

  const API_URL = "http://localhost:8808/api";

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultProfilePicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkoB0e7_DXKsiZ1Uu5lUCkOjN01NfE9689KEqAOmYNMQ&s=10";

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/notifications`,
        {
          withCredentials: true,
        }
      );

      console.log(
        "NOTIFICATIONS:",
        response.data
      );

      if (response.data.success) {
        setNotifications(
          response.data.notifications || []
        );
      }
    } catch (error) {
      console.error(
        "Notification error:",
        error.response?.data ||
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MARK ALL READ
  // ==========================================

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API_URL}/notifications/read-all`,
        {},
        {
          withCredentials: true,
        }
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "Mark read error:",
        error.response?.data ||
          error.message
      );
    }
  };

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ==========================================
  // MESSAGE
  // ==========================================

  const getMessage = (notification) => {
    const username =
      notification.sender?.username ||
      notification.sender?.name ||
      "Someone";

    if (notification.type === "like") {
      return (
        <>
          <strong>{username}</strong>{" "}
          liked your post.
        </>
      );
    }

    if (notification.type === "follow") {
      return (
        <>
          <strong>{username}</strong>{" "}
          started following you.
        </>
      );
    }

    if (notification.type === "comment") {
      return (
        <>
          <strong>{username}</strong>{" "}
          commented on your post.
        </>
      );
    }

    return (
      <>
        <strong>{username}</strong>{" "}
        interacted with you.
      </>
    );
  };

  // ==========================================
  // ICON
  // ==========================================

  const getIcon = (type) => {
    if (type === "like") {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
          <FiHeart
            size={18}
            fill="currentColor"
          />
        </div>
      );
    }

    if (type === "follow") {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <FiUserPlus size={18} />
        </div>
      );
    }

    if (type === "comment") {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">
          <FiMessageCircle size={18} />
        </div>
      );
    }

    return null;
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#162A46]" />

          <p className="mt-4 text-sm text-gray-500">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-[70px] w-full max-w-[700px] items-center justify-between px-4">

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
          >
            <FiArrowLeft size={23} />
          </button>

          <h1 className="text-xl font-bold text-[#162A46]">
            Notifications
          </h1>

          <button
            type="button"
            onClick={markAllAsRead}
            className="text-sm font-semibold text-[#162A46]"
          >
            Read all
          </button>

        </div>

      </header>

      {/* CONTENT */}

      <main className="mx-auto w-full max-w-[700px] px-4 py-5 pb-10">

        {notifications.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              <FiHeart
                size={34}
                className="text-gray-400"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#162A46]">
              No notifications yet
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              When someone likes, comments
              on your posts or follows you,
              you'll see it here.
            </p>

          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {notifications.map(
              (notification) => {

                const profilePicture =
                  notification.sender
                    ?.profilePicture ||
                  notification.sender
                    ?.profilePic ||
                  notification.sender
                    ?.profileImage ||
                  defaultProfilePicture;

                return (
                  <div
                    key={notification._id}
                    className={`flex items-center gap-3 border-b border-gray-100 px-4 py-4 transition last:border-b-0 hover:bg-gray-50 ${
                      !notification.isRead
                        ? "bg-blue-50/40"
                        : "bg-white"
                    }`}
                  >

                    {/* PROFILE */}

                    <img
                      src={profilePicture}
                      alt="User"
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          defaultProfilePicture;
                      }}
                    />

                    {/* MESSAGE */}

                    <div className="min-w-0 flex-1">

                      <p className="text-sm leading-6 text-gray-700">
                        {getMessage(
                          notification
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(
                          notification.createdAt
                        ).toLocaleString()}
                      </p>

                    </div>

                    {/* ICON */}

                    {getIcon(
                      notification.type
                    )}

                    {/* UNREAD */}

                    {!notification.isRead && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#162A46]" />
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}

      </main>

    </div>
  );
};

export default Notifications;