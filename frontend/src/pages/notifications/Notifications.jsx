import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiHeart,
  FiUserPlus,
  FiMessageCircle,
  FiBell,
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

      console.log("NOTIFICATIONS:", response.data);

      if (response.data.success) {
        setNotifications(
          response.data.notifications || []
        );
      }
    } catch (error) {
      console.error(
        "Notification error:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MARK ALL AS READ
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
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // MARK SINGLE NOTIFICATION AS READ
  // ==========================================

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          withCredentials: true,
        }
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error.response?.data || error.message
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
          <strong className="text-gray-900">
            {username}
          </strong>{" "}
          liked your post.
        </>
      );
    }

    if (notification.type === "follow") {
      return (
        <>
          <strong className="text-gray-900">
            {username}
          </strong>{" "}
          started following you.
        </>
      );
    }

    if (notification.type === "comment") {
      return (
        <>
          <strong className="text-gray-900">
            {username}
          </strong>{" "}
          commented on your post.
        </>
      );
    }

    return (
      <>
        <strong className="text-gray-900">
          {username}
        </strong>{" "}
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
          <FiHeart
            size={19}
            fill="currentColor"
          />
        </div>
      );
    }

    if (type === "follow") {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <FiUserPlus size={19} />
        </div>
      );
    }

    if (type === "comment") {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
          <FiMessageCircle size={19} />
        </div>
      );
    }

    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <FiBell size={19} />
      </div>
    );
  };

  // ==========================================
  // CLICK NOTIFICATION
  // ==========================================

  const handleNotificationClick = async (
    notification
  ) => {
    // Mark as read
    if (!notification.isRead) {
      await markNotificationAsRead(
        notification._id
      );
    }

    // FOLLOW notification
    if (
      notification.type === "follow" &&
      notification.sender?._id
    ) {
      navigate(
        `/profile/${notification.sender._id}`
      );
      return;
    }

    // LIKE / COMMENT notification
    if (
      (notification.type === "like" ||
        notification.type === "comment") &&
      notification.post?._id
    ) {
      navigate(
        `/profile/${notification.sender._id}`
      );
      return;
    }

    // If sender exists, open sender profile
    if (notification.sender?._id) {
      navigate(
        `/profile/${notification.sender._id}`
      );
    }
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

      {/* ======================================
          HEADER
      ====================================== */}

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
            className="text-sm font-semibold text-[#162A46] transition hover:opacity-70"
          >
            Read all
          </button>

        </div>

      </header>

      {/* ======================================
          CONTENT
      ====================================== */}

      <main className="mx-auto w-full max-w-[700px] px-4 py-5 pb-10">

        {notifications.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              <FiBell
                size={34}
                className="text-gray-400"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#162A46]">
              No notifications yet
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              When someone likes or comments
              on your posts, or follows you,
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
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-gray-50 ${
                      !notification.isRead
                        ? "bg-blue-50/40"
                        : "bg-white"
                    }`}
                  >

                    {/* ==================================
                        PROFILE PICTURE
                    ================================== */}

                    <img
                      src={profilePicture}
                      alt={
                        notification.sender
                          ?.username || "User"
                      }
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          defaultProfilePicture;
                      }}
                    />

                    {/* ==================================
                        MESSAGE
                    ================================== */}

                    <div className="min-w-0 flex-1">

                      <p className="text-sm leading-6 text-gray-700">
                        {getMessage(
                          notification
                        )}
                      </p>

                      {/* COMMENT PREVIEW */}

                      {notification.type ===
                        "comment" &&
                        notification.comment && (
                          <p className="mt-1 truncate text-xs text-gray-500">
                            "{notification.comment}"
                          </p>
                        )}

                      <p className="mt-1 text-xs text-gray-400">
                        {notification.createdAt
                          ? new Date(
                              notification.createdAt
                            ).toLocaleString()
                          : ""}
                      </p>

                    </div>

                    {/* ==================================
                        TYPE ICON
                    ================================== */}

                    {getIcon(
                      notification.type
                    )}

                    {/* ==================================
                        UNREAD DOT
                    ================================== */}

                    {!notification.isRead && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#162A46]" />
                    )}

                  </button>
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


