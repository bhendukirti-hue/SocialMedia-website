import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Link, useNavigate } from "react-router-dom";

import {
  FiPlus,
  FiHeart,
  FiSearch,
  FiSend,
  FiHome,
  FiMoreHorizontal,
  FiMessageCircle,
  FiBookmark,
  FiX,
  FiVideo,
  FiCamera,
} from "react-icons/fi";

const Home = () => {
  const navigate = useNavigate();

  // ==========================================
  // API
  // ==========================================

  const API_URL = "http://localhost:8808/api";

  // ==========================================
  // STATE
  // ==========================================

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // ==========================================
  // DEFAULT PROFILE IMAGE
  // ==========================================

  const defaultProfilePicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkoB0e7_DXKsiZ1Uu5lUCkOjN01NfE9689KEqAOmYNMQ&s=10";

  // ==========================================
  // CURRENT USER IMAGE
  // ==========================================

  const profileImage =
    currentUser?.profilePicture ||
    currentUser?.profilePic ||
    currentUser?.profileImage ||
    defaultProfilePicture;

  // ==========================================
  // FETCH CURRENT USER
  // ==========================================

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/auth/verify-token`, {
        withCredentials: true,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      console.log("CURRENT USER:", response.data);

      if (response.data?.success) {
        setCurrentUser(
          response.data.user ||
            response.data.data?.user ||
            response.data.data ||
            null,
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error.response?.data || error.message,
      );
    }
  };

  // ==========================================
  // FETCH UNREAD MESSAGE COUNT
  // ==========================================

  useEffect(() => {
    fetchUnreadMessageCount();
  }, []);

  const fetchUnreadMessageCount = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/messages/conversations`, {
        withCredentials: true,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (response.data?.success) {
        const conversations = response.data.conversations || [];

        const totalUnread = conversations.reduce(
          (total, conversation) =>
            total + Number(conversation.unreadCount || 0),
          0,
        );

        setUnreadMessageCount(totalUnread);
      }
    } catch (error) {
      console.error(
        "Failed to fetch unread messages:",
        error.response?.data || error.message,
      );
    }
  };

  // ==========================================
  // REAL-TIME MESSAGE COUNT
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const socket = io("http://localhost:8808", {
      auth: {
        token,
      },
    });

    const handleNewMessage = (newMessage) => {
      if (!newMessage) return;

      const senderId = newMessage.sender?._id || newMessage.sender;

      const currentUserId = currentUser?._id || currentUser?.id;

      if (senderId?.toString() === currentUserId?.toString()) {
        return;
      }

      setUnreadMessageCount((current) => current + 1);
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.disconnect();
    };
  }, [currentUser]);

  // ==========================================
  // FETCH POSTS
  // ==========================================

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    try {
      setLoadingPosts(true);
      setPostsError("");

      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/posts/all-posts`, {
        withCredentials: true,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      console.log("ALL POSTS:", response.data);

      if (response.data.success) {
        const allPosts = response.data.posts || [];

        setPosts(allPosts);

        const likedState = {};

        allPosts.forEach((post) => {
          likedState[post._id] = Boolean(post.likedByMe);
        });

        setLikedPosts(likedState);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error(
        "Failed to fetch posts:",
        error.response?.data || error.message,
      );

      setPostsError(error.response?.data?.message || "Unable to load posts.");
    } finally {
      setLoadingPosts(false);
    }
  };

  // ==========================================
  // LIKE POST
  // ==========================================

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_URL}/posts/${postId}/like`,
        {},
        {
          withCredentials: true,
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      console.log("LIKE:", response.data);

      if (response.data.success) {
        const liked = response.data.liked;
        const likeCount = response.data.likeCount;

        setLikedPosts((current) => ({
          ...current,
          [postId]: liked,
        }));

        setPosts((currentPosts) =>
          currentPosts.map((post) => {
            if (post._id !== postId) {
              return post;
            }

            return {
              ...post,
              likeCount,
              likedByMe: liked,
            };
          }),
        );

        setSelectedPost((currentPost) => {
          if (!currentPost || currentPost._id !== postId) {
            return currentPost;
          }

          return {
            ...currentPost,
            likeCount,
            likedByMe: liked,
          };
        });
      }
    } catch (error) {
      console.error("Like error:", error.response?.data || error.message);
    }
  };

  // ==========================================
  // SAVE / UNSAVE
  // ==========================================

  const handleSave = (postId) => {
    setSavedPosts((current) => {
      if (current.includes(postId)) {
        return current.filter((id) => id !== postId);
      }

      return [...current, postId];
    });
  };

  // ==========================================
  // SHARE
  // ==========================================

  const handleShare = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.user?.username || "Vlogify",
          text: post.caption || "Check out this post!",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);

        alert("Post link copied!");
      }
    } catch (error) {
      console.log("Share cancelled.");
    }
  };

  // ==========================================
  // STORIES
  // ==========================================

  const stories = useMemo(() => {
    const storyUsers = [];

    posts.forEach((post) => {
      const user = post.user;

      if (!user) return;

      const existing = storyUsers.find(
        (item) => item.username === user.username || item.id === user._id,
      );

      if (!existing) {
        storyUsers.push({
          id: user._id,
          username: user.username || "User",
          image:
            user.profilePicture ||
            user.profilePic ||
            user.profileImage ||
            defaultProfilePicture,
          post,
        });
      }
    });

    return storyUsers;
  }, [posts]);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredPosts = useMemo(() => {
    if (!searchText.trim()) {
      return posts;
    }

    const search = searchText.toLowerCase();

    return posts.filter((post) => {
      const username = post.user?.username?.toLowerCase() || "";

      const caption = post.caption?.toLowerCase() || "";

      return username.includes(search) || caption.includes(search);
    });
  }, [posts, searchText]);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "Recently";

    const created = new Date(date);
    const now = new Date();

    const difference = Math.floor((now - created) / 1000);

    if (difference < 60) {
      return `${difference}s`;
    }

    if (difference < 3600) {
      return `${Math.floor(difference / 60)}m`;
    }

    if (difference < 86400) {
      return `${Math.floor(difference / 3600)}h`;
    }

    if (difference < 604800) {
      return `${Math.floor(difference / 86400)}d`;
    }

    return created.toLocaleDateString();
  };

  // ==========================================
  // OPEN STORY
  // ==========================================

  const openStory = (story) => {
    setCurrentStory(story);
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loadingPosts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFF]">
        <div className="text-center">
          <div className="relative mx-auto h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />

            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#2563EB] border-r-[#EC4899]" />
          </div>

          <h2 className="mt-5 text-xl font-extrabold tracking-tight text-[#172554]">
            Vlogify
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-400">
            Loading your feed...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F7F9FF] text-[#172033] selection:bg-pink-100 selection:text-pink-700">

      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 shadow-[0_4px_30px_rgba(37,99,235,0.05)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[74px] w-full max-w-[1150px] items-center justify-between px-4 sm:px-6">

          {/* CREATE */}

          <button
            type="button"
            onClick={() => navigate("/profile/createpost")}
            className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-pink-50 text-[#2563EB] shadow-[0_6px_20px_rgba(37,99,235,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:text-pink-500 hover:shadow-[0_10px_25px_rgba(236,72,153,0.12)] active:scale-95"
            aria-label="Create post"
            title="Create post"
          >
            <FiPlus
              size={24}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
          </button>

          {/* LOGO */}

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2"
          >
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] bg-clip-text text-[29px] font-black tracking-[-0.055em] text-transparent">
              Vlogify
            </span>
          </Link>

          {/* RIGHT ACTIONS */}

          <div className="flex items-center gap-2">

            {/* MESSAGES */}

            <button
              type="button"
              onClick={() => navigate("/messages")}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#2563EB] shadow-[0_6px_20px_rgba(37,99,235,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 active:scale-95"
              aria-label="Messages"
              title="Messages"
            >
              <FiMessageCircle size={22} />

              {unreadMessageCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-[#EC4899] to-[#DB2777] px-1 text-[10px] font-extrabold text-white shadow-[0_4px_12px_rgba(236,72,153,0.35)] ring-2 ring-white">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </span>
              )}
            </button>

            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#EC4899] shadow-[0_6px_20px_rgba(236,72,153,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:bg-pink-50 active:scale-95"
              aria-label="Notifications"
              title="Notifications"
            >
              <FiHeart size={22} />

              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#2563EB] ring-2 ring-white" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto w-full max-w-[1150px] px-4 pb-32 sm:px-6">

        {/* =================================================
            SEARCH
        ================================================== */}

        <div className="mx-auto max-w-[680px] pt-7">

          <div className="group relative flex h-[54px] items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(37,99,235,0.06)] transition-all duration-300 focus-within:border-blue-200 focus-within:shadow-[0_10px_35px_rgba(37,99,235,0.10)]">

            <div className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-pink-50 text-[#2563EB]">
              <FiSearch size={19} />
            </div>

            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search people, posts or captions..."
              className="h-full w-full bg-transparent px-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />

            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-pink-50 hover:text-pink-500"
                aria-label="Clear search"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            STORIES
        ================================================== */}

        <section className="mx-auto mt-6 max-w-[680px]">

          <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_35px_rgba(37,99,235,0.06)] sm:p-5">

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold tracking-tight text-[#172554]">
                  Stories
                </h2>

                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  See what your community is sharing
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600">
                {stories.length + 1}
              </span>
            </div>

            <div className="scrollbar-hide flex gap-5 overflow-x-auto pb-1">

              {/* YOUR STORY */}

              <button
                type="button"
                onClick={() => navigate("/profile/createpost")}
                className="group w-[72px] shrink-0 text-center"
              >
                <div className="relative mx-auto h-[66px] w-[66px]">

                  <div className="h-full w-full rounded-full bg-gradient-to-tr from-[#2563EB] via-[#7C3AED] to-[#EC4899] p-[2px] shadow-[0_5px_18px_rgba(236,72,153,0.18)]">

                    <div className="h-full w-full rounded-full bg-white p-[3px]">
                      <img
                        src={profileImage}
                        alt="Your story"
                        className="h-full w-full rounded-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = defaultProfilePicture;
                        }}
                      />
                    </div>
                  </div>

                  <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-[#2563EB] to-[#EC4899] text-white shadow-md">
                    <FiPlus size={12} />
                  </span>
                </div>

                <p className="mt-2 truncate text-[11px] font-bold text-slate-600">
                  Your story
                </p>
              </button>

              {/* OTHER STORIES */}

              {stories.map((story, index) => (
                <button
                  type="button"
                  key={story.id || index}
                  onClick={() => openStory(story)}
                  className="group w-[72px] shrink-0 text-center"
                >
                  <div className="mx-auto h-[66px] w-[66px] rounded-full bg-gradient-to-tr from-[#2563EB] via-[#8B5CF6] to-[#EC4899] p-[2px] shadow-[0_5px_18px_rgba(37,99,235,0.12)]">

                    <div className="h-full w-full rounded-full bg-white p-[3px]">
                      <img
                        src={story.image}
                        alt={story.username}
                        className="h-full w-full rounded-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = defaultProfilePicture;
                        }}
                      />
                    </div>
                  </div>

                  <p className="mt-2 truncate text-[11px] font-semibold text-slate-600">
                    {story.username}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================
            FEED
        ================================================== */}

        <section className="mt-7">

          {/* ERROR */}

          {postsError && (
            <div className="mx-auto max-w-[680px] rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50 p-5 text-center shadow-sm">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
                <FiX size={18} />
              </div>

              <p className="mt-3 text-sm font-semibold text-rose-500">
                {postsError}
              </p>
            </div>
          )}

          {/* NO POSTS */}

          {!postsError && filteredPosts.length === 0 && (
            <div className="mx-auto max-w-[680px] overflow-hidden rounded-[28px] border border-slate-200 bg-white px-5 py-20 text-center shadow-[0_15px_45px_rgba(37,99,235,0.07)]">

              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-50 via-white to-pink-50 text-[#2563EB] shadow-inner">
                <FiCamera size={38} />
              </div>

              <h2 className="mt-7 bg-gradient-to-r from-[#2563EB] to-[#EC4899] bg-clip-text text-2xl font-black text-transparent">
                No posts yet
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Be the first to share something beautiful with the Vlogify community.
              </p>

              <button
                type="button"
                onClick={() => navigate("/profile/createpost")}
                className="mt-7 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#EC4899] px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(37,99,235,0.20)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(236,72,153,0.20)] active:scale-95"
              >
                <span className="flex items-center gap-2">
                  <FiPlus size={18} />
                  Create Your First Post
                </span>
              </button>
            </div>
          )}

          {/* POST FEED */}

          <div className="mx-auto w-full max-w-[680px] space-y-7">

            {filteredPosts.map((post) => {
              const isLiked =
                likedPosts[post._id] ?? post.likedByMe ?? false;

              const isSaved = savedPosts.includes(post._id);

              const likeCount =
                post.likeCount ?? post.likes?.length ?? 0;

              const postProfilePicture =
                post.user?.profilePicture ||
                post.user?.profilePic ||
                post.user?.profileImage ||
                defaultProfilePicture;

              return (
                <article
                  key={post._id}
                  className="group overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(37,99,235,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(37,99,235,0.11)]"
                >

                  {/* POST HEADER */}

                  <div className="flex items-center justify-between px-4 py-4 sm:px-5">

                    <div className="flex items-center gap-3">

                      <button
                        type="button"
                        onClick={() => {
                          if (post.user?._id) {
                            navigate(`/profile/${post.user._id}`);
                          }
                        }}
                        className="relative h-12 w-12 shrink-0 rounded-full bg-gradient-to-tr from-[#2563EB] via-[#8B5CF6] to-[#EC4899] p-[2px]"
                      >
                        <div className="h-full w-full rounded-full bg-white p-[2px]">
                          <img
                            src={postProfilePicture}
                            alt={post.user?.username || "User"}
                            className="h-full w-full rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                defaultProfilePicture;
                            }}
                          />
                        </div>
                      </button>

                      <div className="min-w-0">

                        <button
                          type="button"
                          onClick={() => {
                            if (post.user?._id) {
                              navigate(`/profile/${post.user._id}`);
                            }
                          }}
                          className="block max-w-[200px] truncate text-sm font-extrabold text-[#172033] transition hover:text-[#2563EB]"
                        >
                          {post.user?.username || "Unknown User"}
                        </button>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#EC4899]" />

                          <p className="text-[11px] font-medium text-slate-400">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-[#2563EB]"
                    >
                      <FiMoreHorizontal size={21} />
                    </button>
                  </div>

                  {/* MEDIA */}

                  <button
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className="block w-full"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">

                      {post.mediaType === "video" ? (
                        <video
                          src={post.mediaUrl}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.caption || "Vlogify post"}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}

                      {post.mediaType === "video" && (
                        <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-black/45 text-white backdrop-blur-md">
                          <FiVideo size={17} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* ACTIONS */}

                  <div className="px-4 pb-5 pt-4 sm:px-5">

                    <div className="flex items-center gap-1">

                      {/* LIKE */}

                      <button
                        type="button"
                        onClick={() => handleLike(post._id)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 active:scale-90 ${
                          isLiked
                            ? "bg-pink-50 text-[#EC4899]"
                            : "text-slate-700 hover:bg-pink-50 hover:text-[#EC4899]"
                        }`}
                      >
                        <FiHeart
                          size={23}
                          fill={isLiked ? "currentColor" : "none"}
                        />
                      </button>

                      {/* COMMENT */}

                      <button
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-all hover:bg-blue-50 hover:text-[#2563EB] active:scale-90"
                      >
                        <FiMessageCircle size={23} />
                      </button>

                      {/* SHARE */}

                      <button
                        type="button"
                        onClick={() => handleShare(post)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-all hover:bg-blue-50 hover:text-[#2563EB] active:scale-90"
                      >
                        <FiSend size={22} />
                      </button>

                      {/* SAVE */}

                      <button
                        type="button"
                        onClick={() => handleSave(post._id)}
                        className={`ml-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90 ${
                          isSaved
                            ? "bg-blue-50 text-[#2563EB]"
                            : "text-slate-700 hover:bg-blue-50 hover:text-[#2563EB]"
                        }`}
                      >
                        <FiBookmark
                          size={23}
                          fill={isSaved ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    {/* LIKE COUNT */}

                    <p className="mt-3 text-sm font-extrabold text-[#172033]">
                      {likeCount.toLocaleString()}{" "}
                      {likeCount === 1 ? "like" : "likes"}
                    </p>

                    {/* CAPTION */}

                    {post.caption && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        <span className="font-extrabold text-[#172033]">
                          {post.user?.username || "User"}
                        </span>{" "}
                        {post.caption}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* =====================================================
          BOTTOM NAVIGATION
      ====================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 shadow-[0_-10px_35px_rgba(37,99,235,0.08)] backdrop-blur-2xl">

        <div className="mx-auto flex h-[78px] w-full max-w-[680px] items-center justify-around px-2">

          {/* HOME */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex min-w-[58px] flex-col items-center justify-center gap-1.5"
          >
            <div className="flex h-10 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-pink-50 text-[#2563EB]">
              <FiHome size={22} />
            </div>

            <span className="text-[10px] font-bold text-[#2563EB]">
              Home
            </span>
          </button>

          {/* REELS */}

          <button
            type="button"
            onClick={() => navigate("/reels")}
            className="group flex min-w-[58px] flex-col items-center justify-center gap-1.5"
          >
            <div className="flex h-10 w-12 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-pink-50 hover:text-[#EC4899]">
              <FiVideo size={22} />
            </div>

            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#EC4899]">
              Reels
            </span>
          </button>

          {/* CREATE */}

          <button
            type="button"
            onClick={() => navigate("/profile/createpost")}
            className="group flex min-w-[64px] flex-col items-center justify-center gap-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#2563EB] via-[#7C3AED] to-[#EC4899] text-white shadow-[0_8px_25px_rgba(124,58,237,0.25)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_30px_rgba(236,72,153,0.25)] group-active:scale-95">
              <FiPlus size={25} />
            </div>

            <span className="text-[10px] font-bold text-[#172554]">
              Create
            </span>
          </button>

          {/* SEARCH */}

          <button
            type="button"
            onClick={() => navigate("/search")}
            className="group flex min-w-[58px] flex-col items-center justify-center gap-1.5"
          >
            <div className="flex h-10 w-12 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-blue-50 hover:text-[#2563EB]">
              <FiSearch size={22} />
            </div>

            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#2563EB]">
              Search
            </span>
          </button>

          {/* PROFILE */}

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="group flex min-w-[58px] flex-col items-center justify-center gap-1.5"
          >
            <div className="flex h-10 w-12 items-center justify-center">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#EC4899] p-[2px] transition group-hover:scale-105">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full rounded-full border-2 border-white object-cover"
                  onError={(e) => {
                    e.currentTarget.src = defaultProfilePicture;
                  }}
                />
              </div>
            </div>

            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#2563EB]">
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* =====================================================
          STORY VIEWER
      ====================================================== */}

      {currentStory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#08111F]/90 p-3 backdrop-blur-xl sm:p-5"
          onClick={() => setCurrentStory(null)}
        >

          <button
            type="button"
            onClick={() => setCurrentStory(null)}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <FiX size={23} />
          </button>

          <div
            className="relative h-[88vh] w-full max-w-[440px] overflow-hidden rounded-[28px] bg-black shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >

            <img
              src={currentStory.post?.mediaUrl || currentStory.image}
              alt={currentStory.username}
              className="h-full w-full object-contain"
            />

            {/* TOP GRADIENT */}

            <div className="absolute left-0 right-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />

            {/* USER */}

            <div className="absolute left-4 top-5 flex items-center gap-3">

              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#EC4899] p-[2px]">
                <img
                  src={currentStory.image}
                  alt={currentStory.username}
                  className="h-full w-full rounded-full border-2 border-white object-cover"
                  onError={(e) => {
                    e.currentTarget.src = defaultProfilePicture;
                  }}
                />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  {currentStory.username}
                </p>

                <p className="text-[10px] text-white/70">
                  Vlogify story
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          POST DETAIL MODAL
      ====================================================== */}

      {selectedPost && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#08111F]/80 p-3 backdrop-blur-xl sm:p-5"
          onClick={() => setSelectedPost(null)}
        >

          <div
            className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.25)] lg:flex-row"
            onClick={(e) => e.stopPropagation()}
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 text-slate-700 shadow-xl transition hover:bg-pink-50 hover:text-pink-500"
            >
              <FiX size={22} />
            </button>

            {/* MEDIA */}

            <div className="relative flex max-h-[62vh] flex-1 items-center justify-center overflow-hidden bg-[#F1F5FF] lg:max-h-[94vh]">

              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-pink-50 opacity-70" />

              <div className="relative z-10 flex h-full w-full items-center justify-center">
                {selectedPost.mediaType === "video" ? (
                  <video
                    src={selectedPost.mediaUrl}
                    controls
                    autoPlay
                    className="max-h-[62vh] max-w-full object-contain lg:max-h-[94vh]"
                  />
                ) : (
                  <img
                    src={selectedPost.mediaUrl}
                    alt={selectedPost.caption || "Post"}
                    className="max-h-[62vh] max-w-full object-contain lg:max-h-[94vh]"
                  />
                )}
              </div>
            </div>

            {/* DETAILS */}

            <div className="flex w-full flex-col bg-white lg:w-[410px]">

              {/* USER */}

              <div className="flex items-center gap-3 border-b border-slate-100 p-5">

                <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#2563EB] via-[#8B5CF6] to-[#EC4899] p-[2px]">
                  <img
                    src={
                      selectedPost.user?.profilePicture ||
                      selectedPost.user?.profilePic ||
                      selectedPost.user?.profileImage ||
                      defaultProfilePicture
                    }
                    alt={selectedPost.user?.username || "User"}
                    className="h-full w-full rounded-full border-2 border-white object-cover"
                    onError={(e) => {
                      e.currentTarget.src = defaultProfilePicture;
                    }}
                  />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-[#172033]">
                    {selectedPost.user?.username || "Unknown User"}
                  </p>

                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                    {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
              </div>

              {/* CAPTION */}

              <div className="flex-1 overflow-y-auto p-5">

                {selectedPost.caption ? (
                  <p className="text-sm leading-7 text-slate-600">
                    <span className="font-extrabold text-[#172033]">
                      {selectedPost.user?.username || "User"}
                    </span>{" "}
                    {selectedPost.caption}
                  </p>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-slate-400">
                      No caption for this post.
                    </p>
                  </div>
                )}
              </div>

              {/* ACTIONS */}

              <div className="border-t border-slate-100 p-5">

                <div className="flex items-center gap-2">

                  {/* LIKE */}

                  <button
                    type="button"
                    onClick={() => handleLike(selectedPost._id)}
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                      (likedPosts[selectedPost._id] ??
                        selectedPost.likedByMe)
                        ? "bg-pink-50 text-[#EC4899]"
                        : "text-slate-700 hover:bg-pink-50 hover:text-[#EC4899]"
                    }`}
                  >
                    <FiHeart
                      size={24}
                      fill={
                        (likedPosts[selectedPost._id] ??
                          selectedPost.likedByMe)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  {/* COMMENT */}

                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-blue-50 hover:text-[#2563EB]"
                  >
                    <FiMessageCircle size={24} />
                  </button>

                  {/* SHARE */}

                  <button
                    type="button"
                    onClick={() => handleShare(selectedPost)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-blue-50 hover:text-[#2563EB]"
                  >
                    <FiSend size={23} />
                  </button>

                  {/* SAVE */}

                  <button
                    type="button"
                    onClick={() => handleSave(selectedPost._id)}
                    className={`ml-auto flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                      savedPosts.includes(selectedPost._id)
                        ? "bg-blue-50 text-[#2563EB]"
                        : "text-slate-700 hover:bg-blue-50 hover:text-[#2563EB]"
                    }`}
                  >
                    <FiBookmark
                      size={24}
                      fill={
                        savedPosts.includes(selectedPost._id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>

                {/* LIKES */}

                <p className="mt-4 text-sm font-extrabold text-[#172033]">
                  {(
                    selectedPost.likeCount ??
                    selectedPost.likes?.length ??
                    0
                  ).toLocaleString()}{" "}
                  {(selectedPost.likeCount ??
                    selectedPost.likes?.length ??
                    0) === 1
                    ? "like"
                    : "likes"}
                </p>

                {/* COMMENT */}

                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-[0_5px_20px_rgba(37,99,235,0.08)]">

                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#EC4899] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:shadow-md active:scale-95"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
