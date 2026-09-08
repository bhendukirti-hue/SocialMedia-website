import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiEdit3,
  FiShare2,
  FiMapPin,
  FiCalendar,
  FiGrid,
  FiHeart,
  FiBookmark,
  FiMoreHorizontal,
  FiPlus,
  FiX,
  FiBookmark as FiSaved,
  FiArchive,
  FiActivity,
  FiBell,
  FiClock,
  FiLock,
  FiUsers,
  FiSlash,
  FiHelpCircle,
  FiCheckCircle,
  FiInfo,
  FiUserPlus,
  FiLogOut,
  FiHome,
  FiSearch,
  FiVideo,
} from "react-icons/fi";

import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  const [error, setError] = useState("");
  const [postsError, setPostsError] = useState("");

  // ==========================================
  // DEFAULT PROFILE PICTURE
  // ==========================================

  const defaultProfilePicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkoB0e7_DXKsiZ1Uu5lUCkOjN01NfE9689KEqAOmYNMQ&s=10";

  // ==========================================
  // BACKEND URL
  // ==========================================

  const API_URL = "http://localhost:8808/api";

  // ==========================================
  // FETCH USER PROFILE
  // ==========================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/auth/verify-token`, {
          withCredentials: true,
        });

        console.log("Profile response:", response.data);

        const userData = response.data.user || response.data;

        setUser(userData);
      } catch (err) {
        console.error("Profile error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load profile. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ==========================================
  // FETCH REAL POSTS
  // ==========================================

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);
        setPostsError("");

        const response = await axios.get(`${API_URL}/posts/my-posts`, {
          withCredentials: true,
        });

        console.log("My posts response:", response.data);

        /*
          Expected backend response:

          {
            posts: [...]
          }

          OR

          [...]
        */

        const postData = response.data.posts || response.data;

        setPosts(Array.isArray(postData) ? postData : []);
      } catch (err) {
        console.error("Posts error:", err);

        setPostsError(err.response?.data?.message || "Unable to load posts.");
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // ==========================================
  // PROFILE IMAGE
  // ==========================================

  const profileImage =
    user?.profilePicture || user?.profilePic || defaultProfilePicture;

  // ==========================================
  // LOADING PROFILE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#0B1F33]" />

          <p className="mt-4 text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PROFILE ERROR
  // ==========================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-5">
        <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-5 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  // ==========================================
  // USER NOT FOUND
  // ==========================================

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-sm text-gray-500">User profile not found.</p>
      </div>
    );
  }

  // ==========================================
  // TOTAL LIKES
  // ==========================================

  const totalLikes = posts.reduce((total, post) => {
    return (
      total +
      (Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0)
    );
  }, 0);

  // ==========================================
  // MEDIA URL
  // ==========================================

  const getMediaUrl = (post) => {
    return (
      post.mediaUrl ||
      post.imageUrl ||
      post.videoUrl ||
      post.media ||
      post.image ||
      ""
    );
  };

  // ==========================================
  // MEDIA TYPE
  // ==========================================

  const getMediaType = (post) => {
    if (post.mediaType) {
      return post.mediaType;
    }

    if (post.videoUrl || post.video || post.type === "video") {
      return "video";
    }

    return "image";
  };

  // ==========================================
  // POST LIKES
  // ==========================================

  const getLikes = (post) => {
    if (post.likeCount !== undefined) {
      return post.likeCount;
    }

    if (Array.isArray(post.likes)) {
      return post.likes.length;
    }

    return Number(post.likes) || 0;
  };

  // ==========================================
  // LIKE / UNLIKE POST
  // ==========================================

  const handleLike = async (postId) => {
    try {
      const response = await axios.post(
        `${API_URL}/posts/${postId}/like`,
        {},
        {
          withCredentials: true,
        },
      );

      console.log("Like response:", response.data);

      if (response.data.success) {
        setPosts((currentPosts) =>
          currentPosts.map((post) => {
            if (post._id !== postId) {
              return post;
            }

            return {
              ...post,
              likeCount: response.data.likeCount,
              likedByMe: response.data.liked,
            };
          }),
        );
      }
    } catch (error) {
      console.error("Like error:", error.response?.data || error.message);
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
{/* ==========================================
    SETTINGS SIDEBAR
========================================== */}

{isSidebarOpen && (
  <>
    {/* BACKDROP */}

    <div
      className="fixed inset-0 z-40 bg-black/40"
      onClick={() => setIsSidebarOpen(false)}
    />

    {/* SIDEBAR */}

    <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
      
      {/* SIDEBAR HEADER */}

      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
            Settings
          </p>

          <h2 className="mt-1 text-xl font-bold text-[#0B1F33]">
            Menu
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-[#0B1F33]"
        >
          <FiX size={22} />
        </button>
      </div>

      {/* SIDEBAR LIST */}

      <div className="flex-1 overflow-y-auto px-3 py-4">

        {/* SAVED */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/saved");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiSaved size={20} />
          <span>Saved</span>
        </button>

        {/* ARCHIVED */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/archived");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiArchive size={20} />
          <span>Archived</span>
        </button>

        {/* YOUR ACTIVITY */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/activity");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiActivity size={20} />
          <span>Your Activity</span>
        </button>

        {/* NOTIFICATION */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/notifications");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiBell size={20} />
          <span>Notification</span>
        </button>

        {/* TIME MANAGEMENT */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/time-management");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiClock size={20} />
          <span>Time Management</span>
        </button>

        {/* ACCOUNT PRIVACY */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/account-privacy");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiLock size={20} />
          <span>Account Privacy</span>
        </button>

        {/* CLOSE FRIENDS */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/close-friends");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiUsers size={20} />
          <span>Close Friends</span>
        </button>

        {/* BLOCKED */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/blocked");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiSlash size={20} />
          <span>Blocked</span>
        </button>

        {/* HELP */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/help");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiHelpCircle size={20} />
          <span>Help</span>
        </button>

        {/* ACCOUNT STATUS */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/account-status");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiCheckCircle size={20} />
          <span>Account Status</span>
        </button>

        {/* ABOUT */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/about");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiInfo size={20} />
          <span>About</span>
        </button>

        {/* DIVIDER */}

        <div className="my-4 border-t border-gray-200" />

        {/* ADD ACCOUNT */}

        <button
          type="button"
          onClick={() => {
            setIsSidebarOpen(false);
            navigate("/add-account");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-[#0B1F33] transition hover:bg-gray-100"
        >
          <FiUserPlus size={20} />
          <span>Add Account</span>
        </button>

        {/* LOGOUT */}

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("token");
            setIsSidebarOpen(false);
            navigate("/login");
          }}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>

      </div>
    </aside>
  </>
)}

      {/* ======================================
          TOP BAR
      ====================================== */}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
              Profile
            </p>

            <h1 className="mt-1 text-xl font-bold text-[#0B1F33]">
              {user.username || "Username"}
            </h1>
          </div>

          <button
  type="button"
  onClick={() => setIsSidebarOpen(true)}
  className="rounded-xl p-2.5 text-gray-500 transition hover:bg-gray-100 hover:text-[#0B1F33]"
>
  <FiMoreHorizontal size={22} />
</button>
        </div>
      </div>

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        {/* ====================================
            PROFILE CARD
        ==================================== */}

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
            {/* ==================================
                PROFILE PHOTO
            ================================== */}

            <div className="flex justify-center sm:justify-start">
              <div className="rounded-full bg-white p-1.5 shadow-md ring-1 ring-gray-100">
                <img
                  src={profileImage}
                  alt={`${user.username || "User"} profile`}
                  className="h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32"
                  onError={(e) => {
                    e.currentTarget.src = defaultProfilePicture;
                  }}
                />
              </div>
            </div>

            {/* ==================================
                PROFILE DETAILS
            ================================== */}

            <div className="flex-1">
              {/* Username + buttons */}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#0B1F33]">
                    {user.username || "Username"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {user.name || user.username || "Your Name"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* CREATE POST */}

                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/create-post")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <FiPlus size={16} />

                    <span>Create Post</span>
                  </button>

                  {/* EDIT PROFILE */}

                  <Link
                    to="/profile/editprofile"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#153B5A]"
                  >
                    <FiEdit3 size={16} />
                    Edit Profile
                  </Link>

                  {/* SHARE */}

                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <FiShare2 size={16} />

                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>

              {/* ==================================
                  STATS
              ================================== */}

              <div className="mt-7 grid grid-cols-4 gap-3 border-y border-gray-100 py-5">
                {/* Posts */}

                <div className="text-center sm:text-left">
                  <p className="text-lg font-bold text-[#0B1F33]">
                    {posts.length}
                  </p>

                  <p className="text-xs text-gray-500">Posts</p>
                </div>

                {/* Followers */}

                <div className="text-center sm:text-left">
                  <p className="text-lg font-bold text-[#0B1F33]">
                    {user.followers?.length || 0}
                  </p>

                  <p className="text-xs text-gray-500">Followers</p>
                </div>

                {/* Following */}

                <div className="text-center sm:text-left">
                  <p className="text-lg font-bold text-[#0B1F33]">
                    {user.following?.length || 0}
                  </p>

                  <p className="text-xs text-gray-500">Following</p>
                </div>

                {/* Likes */}

                <div className="text-center sm:text-left">
                  <p className="text-lg font-bold text-[#0B1F33]">
                    {totalLikes.toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-500">Likes</p>
                </div>
              </div>

              {/* ==================================
                  BIO
              ================================== */}

              <div className="mt-5">
                <p className="text-sm font-semibold text-[#0B1F33]">
                  {user.name || user.username || "Your Name"}
                </p>

                <p className="mt-1 max-w-xl text-sm leading-6 text-gray-600">
                  {user.bio || "Add a bio to tell people about yourself."}
                </p>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                  {/* Location */}

                  {user.location && (
                    <span className="flex items-center gap-1.5">
                      <FiMapPin size={14} />
                      {user.location}
                    </span>
                  )}

                  {/* Joined */}

                  {user.joined && (
                    <span className="flex items-center gap-1.5">
                      <FiCalendar size={14} />
                      Joined {user.joined}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================
            POSTS SECTION
        ==================================== */}

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white shadow-sm">
          {/* ==================================
              TABS
          ================================== */}

          <div className="flex items-center justify-center border-b border-gray-100">
            <button
              type="button"
              className="flex items-center gap-2 border-b-2 border-[#0B1F33] px-6 py-4 text-sm font-semibold text-[#0B1F33]"
            >
              <FiGrid size={17} />
              Posts
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-gray-400 transition hover:text-[#0B1F33]"
            >
              <FiHeart size={17} />
              Liked
            </button>

            <button
              type="button"
              className="hidden items-center gap-2 px-6 py-4 text-sm font-medium text-gray-400 transition hover:text-[#0B1F33] sm:flex"
            >
              <FiBookmark size={17} />
              Saved
            </button>
          </div>

          {/* ==================================
              POSTS LOADING
          ================================== */}

          {postsLoading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0B1F33]" />

                <p className="mt-3 text-sm text-gray-500">Loading posts...</p>
              </div>
            </div>
          )}

          {/* ==================================
              POSTS ERROR
          ================================== */}

          {!postsLoading && postsError && (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto max-w-md rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                {postsError}
              </div>
            </div>
          )}

          {/* ==================================
              NO POSTS
          ================================== */}

          {!postsLoading && !postsError && posts.length === 0 && (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FiGrid size={28} className="text-gray-400" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#0B1F33]">
                No posts yet
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Share your first photo or video with your followers.
              </p>

              <button
                type="button"
                onClick={() => navigate("/profile/createpost")}
                className="mt-5 flex items-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#153B5A]"
              >
                <FiPlus size={16} />
                Create your first post
              </button>
            </div>
          )}

          {/* ==================================
              REAL POSTS GRID
          ================================== */}

          {!postsLoading && !postsError && posts.length > 0 && (
            <div className="grid grid-cols-2 gap-1 p-1 sm:grid-cols-3 sm:gap-2 sm:p-2">
              {posts.map((post) => {
                const mediaUrl = getMediaUrl(post);
                const mediaType = getMediaType(post);
                const likes = getLikes(post);

                return (
                  <div
                    key={post._id || post.id}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                  >
                    {/* IMAGE */}

                    {mediaType === "image" && mediaUrl && (
                      <img
                        src={mediaUrl}
                        alt={post.caption || "Post"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    {/* VIDEO */}

                    {mediaType === "video" && mediaUrl && (
                      <video
                        src={mediaUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}

                    {/* NO MEDIA */}

                    {!mediaUrl && (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        No media
                      </div>
                    )}

                    {/* ==================================
                          HOVER OVERLAY
                      ================================== */}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                      <div className="flex items-center gap-5 text-sm font-semibold text-white">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post._id);
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <FiHeart
                            size={20}
                            fill={post.likedByMe ? "currentColor" : "none"}
                          />

                          {likes}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==================================
              VIEW ALL / CREATE POST
          ================================== */}

          {posts.length > 0 && (
            <div className="flex justify-center px-5 py-6">
              <button
                type="button"
                onClick={() => navigate("/profile/createpost")}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-[#0B1F33]"
              >
                <FiPlus size={16} />
                Create New Post
              </button>
            </div>
          )}
        </div>
      </div>

  {/* ==========================================
    BOTTOM NAVIGATION
========================================== */}

<div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">
  <div className="mx-auto flex h-16 max-w-6xl items-center justify-around px-4">

    {/* HOME */}

    <button
      type="button"
      onClick={() => navigate("/")}
      className="flex h-12 w-12 items-center justify-center rounded-full text-[#0B1F33] transition hover:bg-gray-100"
      title="Home"
    >
      <FiHome size={26} strokeWidth={2} />
    </button>

    {/* REELS */}

    <button
      type="button"
      onClick={() => navigate("/reels")}
      className="flex h-12 w-12 items-center justify-center rounded-full text-[#0B1F33] transition hover:bg-gray-100"
      title="Reels"
    >
      <FiVideo size={26} strokeWidth={2} />
    </button>

    {/* CREATE POST */}

    <button
      type="button"
      onClick={() => navigate("/dashboard/create-post")}
      className="flex h-12 w-12 items-center justify-center rounded-full text-[#0B1F33] transition hover:bg-gray-100"
      title="Create Post"
    >
      <FiPlus size={30} strokeWidth={2} />
    </button>

    {/* SEARCH */}

    <button
      type="button"
      onClick={() => navigate("/search")}
      className="flex h-12 w-12 items-center justify-center rounded-full text-[#0B1F33] transition hover:bg-gray-100"
      title="Search"
    >
      <FiSearch size={27} strokeWidth={2} />
    </button>

    {/* PROFILE */}

    <button
      type="button"
      onClick={() => navigate("/profile")}
      className="flex h-12 w-12 items-center justify-center rounded-full transition hover:bg-gray-100"
      title="Profile"
    >
      <img
        src={profileImage}
        alt="Profile"
        className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200"
        onError={(e) => {
          e.currentTarget.src = defaultProfilePicture;
        }}
      />
    </button>

  </div>
</div>
    </div>
  );
};

export default Profile;
