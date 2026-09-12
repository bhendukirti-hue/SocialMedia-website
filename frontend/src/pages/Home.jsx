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

      // Don't count messages sent by yourself
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
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FB]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#2563EB]" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading Vlogify...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F172A] selection:bg-blue-100 selection:text-[#0F2747]">
      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] w-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          {/* LEFT - CREATE */}

          <button
            type="button"
            onClick={() => navigate("/profile/createpost")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F2747] shadow-[0_4px_18px_rgba(15,39,71,0.06)] transition hover:bg-slate-50 active:scale-95"
            aria-label="Create post"
            title="Create post"
          >
            <FiPlus size={24} />
          </button>

          {/* LOGO */}

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 text-[27px] font-extrabold tracking-[-0.04em] text-[#0F2747]"
          >
            Vlogify
          </Link>

          {/* RIGHT ACTIONS */}

          <div className="flex items-center gap-2">
            {/* ==========================================
                MESSAGES
            ========================================== */}

            <button
              type="button"
              onClick={() => navigate("/messages")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0F2747] shadow-[0_4px_18px_rgba(15,39,71,0.06)] transition hover:bg-slate-50 active:scale-95"
              aria-label="Messages"
              title="Messages"
            >
              <FiMessageCircle size={22} />

              {unreadMessageCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-w-[19px] h-[19px] items-center justify-center rounded-full bg-[#EC4899] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </span>
              )}
            </button>

            {/* ==========================================
                NOTIFICATIONS
            ========================================== */}

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0F2747] shadow-[0_4px_18px_rgba(15,39,71,0.06)] transition hover:bg-slate-50 active:scale-95"
              aria-label="Notifications"
              title="Notifications"
            >
              <FiHeart size={22} />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <main className="mx-auto w-full max-w-[1100px] px-4 pb-28 sm:px-6">
        {/* =================================================
            SEARCH
        ================================================== */}

        <div className="mx-auto max-w-[650px] pt-6">
          <div className="flex h-[50px] items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-[0_4px_18px_rgba(15,39,71,0.06)] transition focus-within:border-[#94A3B8] focus-within:ring-2 focus-within:ring-[#0F2747]/5">
            <FiSearch size={20} className="shrink-0 text-slate-400" />

            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search posts or users..."
              className="w-full bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />

            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="text-slate-400 transition hover:text-slate-700"
                aria-label="Clear search"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            STORIES
        ================================================== */}

        <section className="mx-auto mt-5 max-w-[650px]">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_18px_rgba(15,39,71,0.06)] ring-1 ring-slate-100">
            <div className="flex gap-5 overflow-x-auto scrollbar-hide">
              {/* YOUR STORY */}

              <button
                type="button"
                onClick={() => navigate("/profile/createpost")}
                className="w-[70px] shrink-0 text-center"
              >
                <div className="relative mx-auto h-[62px] w-[62px]">
                  <div className="h-full w-full rounded-full border-2 border-dashed border-gray-300 p-[3px]">
                    <img
                      src={profileImage}
                      alt="Your story"
                      className="h-full w-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = defaultProfilePicture;
                      }}
                    />
                  </div>

                  <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#0F2747] text-white">
                    <FiPlus size={11} />
                  </span>
                </div>

                <p className="mt-2 truncate text-xs font-medium text-slate-600">
                  Your story
                </p>
              </button>

              {/* OTHER STORIES */}

              {stories.map((story, index) => (
                <button
                  type="button"
                  key={story.id || index}
                  onClick={() => openStory(story)}
                  className="w-[70px] shrink-0 text-center"
                >
                  <div className="mx-auto h-[62px] w-[62px] rounded-full border-2 border-[#0F2747] p-[3px]">
                    <img
                      src={story.image}
                      alt={story.username}
                      className="h-full w-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = defaultProfilePicture;
                      }}
                    />
                  </div>

                  <p className="mt-2 truncate text-xs font-medium text-slate-600">
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

        <section className="mt-6">
          {/* ERROR */}

          {postsError && (
            <div className="mx-auto max-w-[650px] rounded-2xl border border-rose-100 bg-rose-50 p-4 text-center text-sm text-rose-500">
              {postsError}
            </div>
          )}

          {/* NO POSTS */}

          {!postsError && filteredPosts.length === 0 && (
            <div className="mx-auto max-w-[650px] rounded-2xl border border-slate-200 bg-white px-5 py-20 text-center shadow-[0_4px_18px_rgba(15,39,71,0.06)]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                <FiCamera size={32} className="text-slate-400" />
              </div>

              <h2 className="mt-5 text-xl font-bold">No posts yet</h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Be the first to share your story with the Vlogify community.
              </p>

              <button
                type="button"
                onClick={() => navigate("/profile/createpost")}
                className="mt-6 rounded-xl bg-[#0F2747] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,39,71,0.10)] transition hover:bg-[#173B68] active:scale-95"
              >
                Create Post
              </button>
            </div>
          )}

          {/* =============================================
              POST FEED
          ============================================== */}

          <div className="mx-auto w-full max-w-[650px] space-y-6">
            {filteredPosts.map((post) => {
              const isLiked = likedPosts[post._id] ?? post.likedByMe ?? false;

              const isSaved = savedPosts.includes(post._id);

              const likeCount = post.likeCount ?? post.likes?.length ?? 0;

              const postProfilePicture =
                post.user?.profilePicture ||
                post.user?.profilePic ||
                post.user?.profileImage ||
                defaultProfilePicture;

              return (
                <article
                  key={post._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,39,71,0.07)] transition-shadow duration-300 hover:shadow-[0_14px_36px_rgba(15,39,71,0.10)]"
                >
                  {/* ================================
                      POST HEADER
                  ================================= */}

                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (post.user?._id) {
                            navigate(`/profile/${post.user._id}`);
                          }
                        }}
                        className="h-11 w-11 shrink-0 rounded-full border border-slate-200 p-[2px]"
                      >
                        <img
                          src={postProfilePicture}
                          alt={post.user?.username || "User"}
                          className="h-full w-full rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = defaultProfilePicture;
                          }}
                        />
                      </button>

                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            if (post.user?._id) {
                              navigate(`/profile/${post.user._id}`);
                            }
                          }}
                          className="text-sm font-bold text-[#0F172A] hover:underline"
                        >
                          {post.user?.username || "Unknown User"}
                        </button>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <FiMoreHorizontal size={21} />
                    </button>
                  </div>

                  {/* ================================
                      SINGLE POST IMAGE / VIDEO
                  ================================= */}

                  <button
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className="block w-full"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-slate-100">
                      {post.mediaType === "video" ? (
                        <video
                          src={post.mediaUrl}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.caption || "Vlogify post"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                  </button>

                  {/* ================================
                      ACTIONS
                  ================================= */}

                  <div className="px-4 pb-4 pt-4">
                    <div className="flex items-center">
                      {/* LIKE */}

                      <button
                        type="button"
                        onClick={() => handleLike(post._id)}
                        className="mr-4 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 active:scale-90"
                      >
                        <FiHeart
                          size={24}
                          className={
                            isLiked ? "text-rose-500" : "text-[#0F172A]"
                          }
                          fill={isLiked ? "currentColor" : "none"}
                        />
                      </button>

                      {/* COMMENT */}

                      <button
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className="mr-4 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 active:scale-90"
                      >
                        <FiMessageCircle size={24} />
                      </button>

                      {/* SHARE */}

                      <button
                        type="button"
                        onClick={() => handleShare(post)}
                        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 active:scale-90"
                      >
                        <FiSend size={23} />
                      </button>

                      {/* SAVE */}

                      <button
                        type="button"
                        onClick={() => handleSave(post._id)}
                        className="ml-auto flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 active:scale-90"
                      >
                        <FiBookmark
                          size={24}
                          fill={isSaved ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    {/* LIKE COUNT */}

                    <p className="mt-3 text-sm font-bold text-[#0F172A]">
                      {likeCount.toLocaleString()}{" "}
                      {likeCount === 1 ? "like" : "likes"}
                    </p>

                    {/* CAPTION */}

                    {post.caption && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        <span className="font-bold text-[#0F172A]">
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-5px_25px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex h-[72px] w-full max-w-[650px] items-center justify-around px-3">
          {/* HOME */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex flex-col items-center justify-center gap-1"
          >
            <div className="flex h-9 w-12 items-center justify-center rounded-xl bg-[#EEF3F8] text-[#0F2747] transition group-hover:bg-[#E2E8F0]">
              <FiHome size={22} />
            </div>

            <span className="text-[10px] font-semibold text-[#0F2747]">
              Home
            </span>
          </button>

          {/* REELS */}

          <button
            type="button"
            onClick={() => navigate("/reels")}
            className="group flex flex-col items-center justify-center gap-1"
          >
            <div className="flex h-9 w-12 items-center justify-center rounded-xl text-slate-500 transition group-hover:bg-slate-100 group-hover:text-[#0F2747]">
              <FiVideo size={22} />
            </div>

            <span className="text-[10px] font-medium text-slate-500">
              Reels
            </span>
          </button>

          {/* CREATE */}

          <button
            type="button"
            onClick={() => navigate("/profile/createpost")}
            className="group flex flex-col items-center justify-center gap-1"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F2747] text-white shadow-[0_8px_24px_rgba(15,39,71,0.10)] transition group-hover:bg-[#173B68] group-active:scale-95">
              <FiPlus size={25} />
            </div>

            <span className="text-[10px] font-semibold text-[#0F2747]">
              Create
            </span>
          </button>

          {/* SEARCH */}

          <button
            type="button"
            onClick={() => navigate("/search")}
            className="group flex flex-col items-center justify-center gap-1"
          >
            <div className="flex h-9 w-12 items-center justify-center rounded-xl text-slate-500 transition group-hover:bg-slate-100 group-hover:text-[#0F2747]">
              <FiSearch size={22} />
            </div>

            <span className="text-[10px] font-medium text-slate-500">
              Search
            </span>
          </button>

          {/* PROFILE */}

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="group flex flex-col items-center justify-center gap-1"
          >
            <div className="flex h-9 w-12 items-center justify-center">
              <img
                src={profileImage}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200 transition group-hover:ring-[#0F2747]"
                onError={(e) => {
                  e.currentTarget.src = defaultProfilePicture;
                }}
              />
            </div>

            <span className="text-[10px] font-medium text-slate-500">
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={() => setCurrentStory(null)}
        >
          <button
            type="button"
            onClick={() => setCurrentStory(null)}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_16px_40px_rgba(15,39,71,0.16)] transition hover:bg-slate-100"
          >
            <FiX size={24} />
          </button>

          <div
            className="relative h-[82vh] w-full max-w-[430px] overflow-hidden rounded-2xl bg-black shadow-[0_24px_60px_rgba(15,39,71,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentStory.post?.mediaUrl || currentStory.image}
              alt={currentStory.username}
              className="h-full w-full object-contain"
            />

            <div className="absolute left-4 top-4 flex items-center gap-3 rounded-full bg-black/50 px-3 py-2 backdrop-blur">
              <img
                src={currentStory.image}
                alt={currentStory.username}
                className="h-9 w-9 rounded-full border-2 border-white object-cover"
                onError={(e) => {
                  e.currentTarget.src = defaultProfilePicture;
                }}
              />

              <p className="text-sm font-semibold text-white">
                {currentStory.username}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          POST DETAIL MODAL
      ====================================================== */}

      {selectedPost && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,39,71,0.18)] lg:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}

            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
            >
              <FiX size={22} />
            </button>

            {/* MEDIA */}

            <div className="flex max-h-[65vh] flex-1 items-center justify-center bg-slate-100 lg:max-h-[94vh]">
              {selectedPost.mediaType === "video" ? (
                <video
                  src={selectedPost.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-[65vh] max-w-full object-contain lg:max-h-[94vh]"
                />
              ) : (
                <img
                  src={selectedPost.mediaUrl}
                  alt={selectedPost.caption || "Post"}
                  className="max-h-[65vh] max-w-full object-contain lg:max-h-[94vh]"
                />
              )}
            </div>

            {/* DETAILS */}

            <div className="flex w-full flex-col bg-white lg:w-[390px]">
              {/* USER */}

              <div className="flex items-center gap-3 border-b border-slate-200 p-5">
                <img
                  src={
                    selectedPost.user?.profilePicture ||
                    selectedPost.user?.profilePic ||
                    selectedPost.user?.profileImage ||
                    defaultProfilePicture
                  }
                  alt={selectedPost.user?.username || "User"}
                  className="h-11 w-11 rounded-full border border-slate-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = defaultProfilePicture;
                  }}
                />

                <div>
                  <p className="text-sm font-bold text-[#0F172A]">
                    {selectedPost.user?.username || "Unknown User"}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
              </div>

              {/* CAPTION */}

              <div className="flex-1 overflow-y-auto p-5">
                {selectedPost.caption && (
                  <p className="text-sm leading-7 text-slate-600">
                    <span className="font-bold text-[#0F172A]">
                      {selectedPost.user?.username || "User"}
                    </span>{" "}
                    {selectedPost.caption}
                  </p>
                )}
              </div>

              {/* ACTIONS */}

              <div className="border-t border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  {/* LIKE */}

                  <button
                    type="button"
                    onClick={() => handleLike(selectedPost._id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                  >
                    <FiHeart
                      size={25}
                      className={
                        (likedPosts[selectedPost._id] ?? selectedPost.likedByMe)
                          ? "text-rose-500"
                          : "text-[#0F172A]"
                      }
                      fill={
                        (likedPosts[selectedPost._id] ?? selectedPost.likedByMe)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  {/* COMMENT */}

                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                  >
                    <FiMessageCircle size={25} />
                  </button>

                  {/* SHARE */}

                  <button
                    type="button"
                    onClick={() => handleShare(selectedPost)}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                  >
                    <FiSend size={24} />
                  </button>

                  {/* SAVE */}

                  <button
                    type="button"
                    onClick={() => handleSave(selectedPost._id)}
                    className="ml-auto flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                  >
                    <FiBookmark
                      size={25}
                      fill={
                        savedPosts.includes(selectedPost._id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>

                {/* LIKES */}

                <p className="mt-4 text-sm font-bold text-[#0F172A]">
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

                <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-sm font-bold text-[#0F2747] transition hover:bg-white"
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
