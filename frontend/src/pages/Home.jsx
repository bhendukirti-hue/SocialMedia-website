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

  const API_URL = "https://pixora-backend-2eai.onrender.com/api";

  // ==========================================
  // STATE
  // ==========================================

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // ==========================================
  // DEFAULT PROFILE IMAGE
  // ==========================================

  const defaultProfilePicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkoB0e7_DXKsiZ1Uu5lUCkOjN01NfE9689KEqAOmYNMQ&s=10";

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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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

    const socket = io("https://pixora-backend-2eai.onrender.com", {
      auth: { token },
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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

            return { ...post, likeCount, likedByMe: liked };
          }),
        );

        setSelectedPost((currentPost) => {
          if (!currentPost || currentPost._id !== postId) {
            return currentPost;
          }

          return { ...currentPost, likeCount, likedByMe: liked };
        });
      }
    } catch (error) {
      console.error("Like error:", error.response?.data || error.message);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost?._id) return;

    try {
      setCommentLoading(true);

      const token = localStorage.getItem("token");

      // IMPORTANT:
      // We will put your actual comment API URL here
      const response = await axios.post(
        `${API_URL}/comments/${selectedPost._id}`,
        {
          text: commentText.trim(),
        },
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      console.log("COMMENT RESPONSE:", response.data);

      setCommentText("");
    } catch (error) {
      console.error(
        "ADD COMMENT ERROR:",
        error.response?.data || error.message,
      );
    } finally {
      setCommentLoading(false);
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
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "Recently";

    const created = new Date(date);
    const now = new Date();

    const difference = Math.floor((now - created) / 1000);

    if (difference < 60) return `${difference}s`;
    if (difference < 3600) return `${Math.floor(difference / 60)}m`;
    if (difference < 86400) return `${Math.floor(difference / 3600)}h`;
    if (difference < 604800) return `${Math.floor(difference / 86400)}d`;

    return created.toLocaleDateString();
  };

  const openStory = (story) => {
    setCurrentStory(story);
  };

  // ==========================================
  // SMALL UI HELPERS (presentation only)
  // ==========================================

  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition duration-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-90";

  const avatarFallback = (e) => {
    e.currentTarget.src = defaultProfilePicture;
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loadingPosts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-blue-600 border-r-pink-500" />
          </div>

          <h2 className="mt-5 bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-2xl font-black tracking-tight text-transparent">
            Pixora 
          </h2>

          <p className="mt-1 text-sm text-slate-400">Loading your feed…</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-pink-100 selection:text-pink-700">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 w-full max-w-[640px] items-center justify-between px-4">
          <button
            type="button"
            onClick={() => navigate("/profile/createpost")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95"
            aria-label="Create post"
            title="Create post"
          >
            <FiPlus size={22} />
          </button>

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-[26px] font-black tracking-tight text-transparent"
          >
            Pixora 
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate("/messages")}
              className={`${iconBtn} relative`}
              aria-label="Messages"
              title="Messages"
            >
              <FiMessageCircle size={22} />

              {unreadMessageCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className={`${iconBtn} relative hover:bg-pink-50 hover:text-pink-500`}
              aria-label="Notifications"
              title="Notifications"
            >
              <FiHeart size={22} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto w-full max-w-[640px] px-4 pb-32 pt-5">
        {/* STORIES */}

        <section
          aria-label="Stories"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
        >
          <div className="scrollbar-hide flex gap-4 overflow-x-auto">
            {/* YOUR STORY */}

            <button
              type="button"
              onClick={() => navigate("/profile/createpost")}
              className="group w-[70px] shrink-0 text-center focus:outline-none"
            >
              <div className="relative mx-auto h-[66px] w-[66px]">
                <div className="h-full w-full rounded-full border-2 border-dashed border-blue-300 p-[3px] transition group-hover:border-blue-500">
                  <img
                    src={profileImage}
                    alt="Your story"
                    className="h-full w-full rounded-full object-cover"
                    onError={avatarFallback}
                  />
                </div>

                <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white">
                  <FiPlus size={13} />
                </span>
              </div>

              <p className="mt-2 truncate text-[11px] font-semibold text-slate-500">
                Your story
              </p>
            </button>

            {/* OTHER STORIES */}

            {stories.map((story, index) => (
              <button
                type="button"
                key={story.id || index}
                onClick={() => openStory(story)}
                className="group w-[70px] shrink-0 text-center focus:outline-none"
              >
                <div className="mx-auto h-[66px] w-[66px] rounded-full bg-gradient-to-tr from-blue-600 via-violet-500 to-pink-500 p-[2.5px] transition group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-blue-400">
                  <div className="h-full w-full rounded-full bg-white p-[2.5px]">
                    <img
                      src={story.image}
                      alt={story.username}
                      className="h-full w-full rounded-full object-cover"
                      onError={avatarFallback}
                    />
                  </div>
                </div>

                <p className="mt-2 truncate text-[11px] font-semibold text-slate-700">
                  {story.username}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* =================================================
            FEED
        ================================================== */}

        <section className="mt-5">
          {/* ERROR */}

          {postsError && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-2xl border border-pink-200 bg-pink-50 p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-pink-500">
                <FiX size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-pink-700">
                  {postsError}
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAllPosts}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-pink-600 shadow-sm transition hover:bg-pink-100"
              >
                Try again
              </button>
            </div>
          )}

          {/* NO POSTS */}

          {!postsError && posts.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FiCamera size={32} />
              </div>

              <h2 className="mt-6 text-xl font-extrabold text-slate-900">
                No posts yet
              </h2>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                Share a photo or video to start your feed.
              </p>

              <button
                type="button"
                onClick={() => navigate("/profile/createpost")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
              >
                <FiPlus size={18} />
                Create your first post
              </button>
            </div>
          )}

          {/* POST FEED */}

          <div className="space-y-5">
            {posts.map((post) => {
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
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* POST HEADER */}

                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (post.user?._id) {
                            navigate(`/profile/${post.user._id}`);
                          }
                        }}
                        className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-pink-500 p-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        <span className="block h-full w-full rounded-full bg-white p-[2px]">
                          <img
                            src={postProfilePicture}
                            alt={post.user?.username || "User"}
                            className="h-full w-full rounded-full object-cover"
                            onError={avatarFallback}
                          />
                        </span>
                      </button>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (post.user?._id) {
                              navigate(`/profile/${post.user._id}`);
                            }
                          }}
                          className="block max-w-[220px] truncate text-sm font-bold text-slate-900 transition hover:text-blue-600"
                        >
                          {post.user?.username || "Unknown User"}
                        </button>

                        <p className="text-xs text-slate-400">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={iconBtn}
                      aria-label="More options"
                    >
                      <FiMoreHorizontal size={20} />
                    </button>
                  </div>

                  {/* MEDIA */}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPost(post);
                      setCommentText("");
                    }}
                    className="block w-full focus:outline-none"
                    aria-label="Open post"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
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

                      {post.mediaType === "video" && (
                        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur">
                          <FiVideo size={15} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* ACTIONS */}

                  <div className="px-3 pb-4 pt-2">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleLike(post._id)}
                        aria-label="Like"
                        aria-pressed={isLiked}
                        className={`${iconBtn} ${
                          isLiked
                            ? "text-pink-500 hover:bg-pink-50 hover:text-pink-500"
                            : "hover:bg-pink-50 hover:text-pink-500"
                        }`}
                      >
                        <FiHeart
                          size={23}
                          fill={isLiked ? "currentColor" : "none"}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPost(post);
                          setCommentText("");
                        }}
                        aria-label="Comment"
                        className={iconBtn}
                      >
                        <FiMessageCircle size={23} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShare(post)}
                        aria-label="Share"
                        className={iconBtn}
                      >
                        <FiSend size={22} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSave(post._id)}
                        aria-label="Save"
                        aria-pressed={isSaved}
                        className={`${iconBtn} ml-auto ${
                          isSaved ? "text-blue-600" : ""
                        }`}
                      >
                        <FiBookmark
                          size={23}
                          fill={isSaved ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    <div className="px-2">
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {likeCount.toLocaleString()}{" "}
                        {likeCount === 1 ? "like" : "likes"}
                      </p>

                      {post.caption && (
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          <span className="font-bold text-slate-900">
                            {post.user?.username || "User"}
                          </span>{" "}
                          {post.caption}
                        </p>
                      )}
                    </div>
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-[640px] items-center justify-around px-2">
          {/* HOME */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-[56px] flex-col items-center gap-1 text-blue-600"
          >
            <FiHome size={22} />
            <span className="text-[10px] font-bold">Home</span>
            <span className="h-1 w-1 rounded-full bg-blue-600" />
          </button>

          {/* REELS */}

          <button
            type="button"
            onClick={() => navigate("/reels")}
            className="flex min-w-[56px] flex-col items-center gap-1 text-slate-400 transition hover:text-pink-500"
          >
            <FiVideo size={22} />
            <span className="text-[10px] font-semibold">Reels</span>
            <span className="h-1 w-1" />
          </button>

          {/* CREATE */}

          <button
            type="button"
            onClick={() => navigate("/profile/createpost")}
            aria-label="Create"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-pink-500 text-white shadow-lg shadow-pink-500/25 ring-4 ring-white transition hover:scale-105 active:scale-95"
          >
            <FiPlus size={26} />
          </button>

          {/* SEARCH */}

          <button
            type="button"
            onClick={() => navigate("/search")}
            className="flex min-w-[56px] flex-col items-center gap-1 text-slate-400 transition hover:text-blue-600"
          >
            <FiSearch size={22} />
            <span className="text-[10px] font-semibold">Search</span>
            <span className="h-1 w-1" />
          </button>

          {/* PROFILE */}

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex min-w-[56px] flex-col items-center gap-1 text-slate-400 transition hover:text-blue-600"
          >
            <span className="h-[22px] w-[22px] rounded-full bg-gradient-to-tr from-blue-600 to-pink-500 p-[1.5px]">
              <img
                src={profileImage}
                alt="Profile"
                className="h-full w-full rounded-full border border-white object-cover"
                onError={avatarFallback}
              />
            </span>
            <span className="text-[10px] font-semibold">Profile</span>
            <span className="h-1 w-1" />
          </button>
        </div>
      </nav>

      {/* =====================================================
          STORY VIEWER
      ====================================================== */}

      {currentStory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-md"
          onClick={() => setCurrentStory(null)}
        >
          <button
            type="button"
            onClick={() => setCurrentStory(null)}
            aria-label="Close story"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <FiX size={22} />
          </button>

          <div
            className="relative h-[88vh] w-full max-w-[420px] overflow-hidden rounded-3xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentStory.post?.mediaUrl || currentStory.image}
              alt={currentStory.username}
              className="h-full w-full object-contain"
            />

            <div className="absolute left-0 right-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />

            <div className="absolute left-4 right-4 top-4">
              <div className="mb-3 h-[3px] w-full overflow-hidden rounded-full bg-white/30">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400" />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-pink-500 p-[2px]">
                  <img
                    src={currentStory.image}
                    alt={currentStory.username}
                    className="h-full w-full rounded-full border-2 border-white object-cover"
                    onError={avatarFallback}
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    {currentStory.username}
                  </p>
                  <p className="text-[11px] text-white/70">Vlogify story</p>
                </div>
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-6"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-pink-50 hover:text-pink-500"
            >
              <FiX size={20} />
            </button>

            {/* MEDIA */}

            <div className="relative flex max-h-[58vh] flex-1 items-center justify-center overflow-hidden bg-slate-950 lg:max-h-[92vh]">
              {selectedPost.mediaType === "video" ? (
                <video
                  src={selectedPost.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-[58vh] max-w-full object-contain lg:max-h-[92vh]"
                />
              ) : (
                <img
                  src={selectedPost.mediaUrl}
                  alt={selectedPost.caption || "Post"}
                  className="max-h-[58vh] max-w-full object-contain lg:max-h-[92vh]"
                />
              )}
            </div>

            {/* DETAILS */}

            <div className="flex w-full flex-col bg-white lg:w-[380px]">
              {/* USER */}

              <div className="flex items-center gap-3 border-b border-slate-100 p-4 pr-16">
                <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-pink-500 p-[2px]">
                  <img
                    src={
                      selectedPost.user?.profilePicture ||
                      selectedPost.user?.profilePic ||
                      selectedPost.user?.profileImage ||
                      defaultProfilePicture
                    }
                    alt={selectedPost.user?.username || "User"}
                    className="h-full w-full rounded-full border-2 border-white object-cover"
                    onError={avatarFallback}
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {selectedPost.user?.username || "Unknown User"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
              </div>

              {/* CAPTION */}

              <div className="min-h-[90px] flex-1 overflow-y-auto p-4">
                {selectedPost.caption ? (
                  <p className="text-sm leading-7 text-slate-600">
                    <span className="font-bold text-slate-900">
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

              <div className="border-t border-slate-100 p-4">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleLike(selectedPost._id)}
                    aria-label="Like"
                    className={`${iconBtn} ${
                      (likedPosts[selectedPost._id] ?? selectedPost.likedByMe)
                        ? "text-pink-500 hover:bg-pink-50 hover:text-pink-500"
                        : "hover:bg-pink-50 hover:text-pink-500"
                    }`}
                  >
                    <FiHeart
                      size={23}
                      fill={
                        (likedPosts[selectedPost._id] ?? selectedPost.likedByMe)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  <button
                    type="button"
                    aria-label="Comment"
                    className={iconBtn}
                  >
                    <FiMessageCircle size={23} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(selectedPost)}
                    aria-label="Share"
                    className={iconBtn}
                  >
                    <FiSend size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave(selectedPost._id)}
                    aria-label="Save"
                    className={`${iconBtn} ml-auto ${
                      savedPosts.includes(selectedPost._id)
                        ? "text-blue-600"
                        : ""
                    }`}
                  >
                    <FiBookmark
                      size={23}
                      fill={
                        savedPosts.includes(selectedPost._id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>

                <p className="mt-2 px-2 text-sm font-bold text-slate-900">
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

                {/* COMMENT INPUT */}

                <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1.5 pl-4 transition focus-within:border-blue-300 focus-within:bg-white">
                  <input
                    type="text"
                    placeholder="Add a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment();
                      }
                    }}
                    className="flex-1 bg-transparent py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={commentLoading || !commentText.trim()}
                    className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {commentLoading ? "Posting..." : "Post"}
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
