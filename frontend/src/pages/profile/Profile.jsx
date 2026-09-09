import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  FiEdit3,
  FiShare2,
  FiMapPin,
  FiCalendar,
  FiGrid,
  FiHeart,
  FiUserCheck,
  FiMessageCircle,
  FiBookmark,
  FiMoreHorizontal,
  FiPlus,
  FiX,
  FiArchive,
  FiActivity,
  FiBell,
  FiClock,
  FiLock,
  FiUsers,
  FiUser,
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

import { Link, useNavigate, useParams } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  // ==========================================
  // STATES
  // ==========================================

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Logged-in user
  const [currentUser, setCurrentUser] = useState(null);

  // Profile being viewed
  const [user, setUser] = useState(null);

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  const [error, setError] = useState("");
  const [postsError, setPostsError] = useState("");

  // Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Post modal
  const [selectedPost, setSelectedPost] = useState(null);

  // Comments
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // see current user follows
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [userListType, setUserListType] = useState("");
  const [userList, setUserList] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);

  // ==========================================
  // CONSTANTS
  // ==========================================

  const API_URL = "http://localhost:8808/api";

  const defaultProfilePicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkoB0e7_DXKsiZ1Uu5lUCkOjN01NfE9689KEqAOmYNMQ&s=10";

  // ==========================================
  // CHECK IF OWN PROFILE
  // ==========================================

  const isOwnProfile =
    !userId ||
    (currentUser?._id &&
      user?._id &&
      currentUser._id.toString() === user._id.toString());

  // ==========================================
  // FETCH LOGGED-IN USER
  // ==========================================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/verify-token`, {
          withCredentials: true,
        });

        console.log("Current user response:", response.data);

        const userData = response.data.user || response.data;

        setCurrentUser(userData);
      } catch (error) {
        console.error(
          "Current user error:",
          error.response?.data || error.message,
        );
      }
    };

    fetchCurrentUser();
  }, []);

  // ==========================================
  // FETCH PROFILE
  // ==========================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        let response;

        // ======================================
        // OWN PROFILE
        // ======================================

        if (!userId) {
          response = await axios.get(`${API_URL}/auth/verify-token`, {
            withCredentials: true,
          });
        }

        // ======================================
        // OTHER USER PROFILE
        // ======================================
        else {
          response = await axios.get(`${API_URL}/users/${userId}`, {
            withCredentials: true,
          });
        }

        console.log("Profile response:", response.data);

        const userData = response.data.user || response.data;

        if (!userData) {
          throw new Error("User profile not found");
        }

        setUser(userData);

        // ======================================
        // INITIAL COUNTS
        // ======================================

        setFollowersCount(
          Array.isArray(userData.followers)
            ? userData.followers.length
            : Number(userData.followersCount) || 0,
        );

        setFollowingCount(
          Array.isArray(userData.following)
            ? userData.following.length
            : Number(userData.followingCount) || 0,
        );

        // Own profile should never be following itself
        if (
          currentUser?._id &&
          userData?._id &&
          currentUser._id.toString() === userData._id.toString()
        ) {
          setIsFollowing(false);
        }
      } catch (err) {
        console.error("Profile error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load profile. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // ==========================================
  // FETCH FOLLOW STATUS
  // ==========================================

  useEffect(() => {
    const fetchFollowStatus = async () => {
      // No target user
      if (!user?._id) return;

      // Own profile
      if (
        currentUser?._id &&
        currentUser._id.toString() === user._id.toString()
      ) {
        setIsFollowing(false);

        setFollowersCount(
          Array.isArray(user.followers)
            ? user.followers.length
            : Number(user.followersCount) || 0,
        );

        setFollowingCount(
          Array.isArray(user.following)
            ? user.following.length
            : Number(user.followingCount) || 0,
        );

        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/follows/${user._id}/follow-status`,
          {
            withCredentials: true,
          },
        );

        console.log("Follow status response:", response.data);

        if (response.data?.success) {
          setIsFollowing(Boolean(response.data.isFollowing));

          setFollowersCount(Number(response.data.followersCount) || 0);

          setFollowingCount(Number(response.data.followingCount) || 0);
        }
      } catch (error) {
        console.error(
          "Follow status error:",
          error.response?.data || error.message,
        );
      }
    };

    fetchFollowStatus();
  }, [user?._id, currentUser?._id]);

  // ==========================================
  // Open user list
  // ==========================================
  const openUserList = async (type) => {
    if (!user?._id) return;

    try {
      setUserListLoading(true);
      setUserListType(type);
      setShowUsersModal(true);
      setUserList([]);

      const response = await axios.get(`${API_URL}/users/${user._id}/${type}`, {
        withCredentials: true,
      });

      setUserList(response.data.users || []);
    } catch (error) {
      console.error(
        `${type} users error:`,
        error.response?.data || error.message,
      );

      setUserList([]);
    } finally {
      setUserListLoading(false);
    }
  };

  // ==========================================
  // HANDLE FOLLOW / UNFOLLOW
  // ==========================================

  const handleFollow = async () => {
    // Safety checks
    if (!user?._id || followLoading) return;

    // Never allow following yourself
    if (
      currentUser?._id &&
      currentUser._id.toString() === user._id.toString()
    ) {
      alert("You cannot follow yourself.");
      return;
    }

    try {
      setFollowLoading(true);

      let response;

      // ======================================
      // UNFOLLOW
      // ======================================

      if (isFollowing) {
        response = await axios.delete(`${API_URL}/follows/${user._id}/follow`, {
          withCredentials: true,
        });
      }

      // ======================================
      // FOLLOW
      // ======================================
      else {
        response = await axios.post(
          `${API_URL}/follows/${user._id}/follow`,
          {},
          {
            withCredentials: true,
          },
        );
      }

      console.log("Follow response:", response.data);

      if (response.data?.success) {
        setIsFollowing(Boolean(response.data.isFollowing));

        setFollowersCount(Number(response.data.followersCount) || 0);

        // Following count returned by your backend
        // is the target user's following count.
        setFollowingCount(Number(response.data.followingCount) || 0);

        // Update profile object as well
        setUser((prev) => {
          if (!prev) return prev;

          const currentFollowers = Array.isArray(prev.followers)
            ? [...prev.followers]
            : [];

          if (response.data.isFollowing) {
            if (
              currentUser?._id &&
              !currentFollowers.some(
                (id) => id.toString() === currentUser._id.toString(),
              )
            ) {
              currentFollowers.push(currentUser._id);
            }
          } else {
            const updatedFollowers = currentFollowers.filter(
              (id) => id.toString() !== currentUser?._id?.toString(),
            );

            return {
              ...prev,
              followers: updatedFollowers,
            };
          }

          return {
            ...prev,
            followers: currentFollowers,
          };
        });
      }
    } catch (error) {
      console.error("Follow error:", error.response?.data || error.message);

      alert(
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // ==========================================
  // FETCH POSTS
  // ==========================================

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);
        setPostsError("");

        let response;

        // ======================================
        // OWN POSTS
        // ======================================

        if (!userId) {
          response = await axios.get(`${API_URL}/posts/my-posts`, {
            withCredentials: true,
          });
        }

        // ======================================
        // OTHER USER POSTS
        // ======================================
        else {
          response = await axios.get(`${API_URL}/posts/user/${userId}`, {
            withCredentials: true,
          });
        }

        console.log("Posts response:", response.data);

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
  }, [userId]);

  // ==========================================
  // PROFILE IMAGE
  // ==========================================

  const profileImage =
    user?.profilePicture || user?.profilePic || defaultProfilePicture;

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
      return Number(post.likeCount) || 0;
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

        // Update modal post too
        setSelectedPost((prev) => {
          if (!prev || prev._id !== postId) {
            return prev;
          }

          return {
            ...prev,
            likeCount: response.data.likeCount,
            likedByMe: response.data.liked,
          };
        });
      }
    } catch (error) {
      console.error("Like error:", error.response?.data || error.message);
    }
  };

  // ==========================================
  // OPEN POST
  // ==========================================

  const openPost = async (post) => {
    setSelectedPost(post);
    setComments([]);
    setCommentText("");

    try {
      setCommentsLoading(true);

      const response = await axios.get(
        `${API_URL}/posts/${post._id}/comments`,
        {
          withCredentials: true,
        },
      );

      setComments(response.data.comments || response.data || []);
    } catch (error) {
      console.error("Comments error:", error);

      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // ==========================================
  // CLOSE POST
  // ==========================================

  const closePost = () => {
    setSelectedPost(null);
    setComments([]);
    setCommentText("");
  };

  // ==========================================
  // ADD COMMENT
  // ==========================================

  const handleComment = async () => {
    if (!commentText.trim() || !selectedPost) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/posts/${selectedPost._id}/comment`,
        {
          text: commentText,
        },
        {
          withCredentials: true,
        },
      );

      const newComment = response.data.comment || response.data;

      setComments((prev) => [...prev, newComment]);

      setCommentText("");
    } catch (error) {
      console.error("Comment error:", error.response?.data || error.message);
    }
  };

  // ==========================================
  // SHARE POST
  // ==========================================

  const handleSharePost = async () => {
    if (!selectedPost) return;

    try {
      const shareUrl = `${window.location.origin}/post/` + selectedPost._id;

      if (navigator.share) {
        await navigator.share({
          title: "Vlogify Post",
          text: selectedPost.caption || "Check out this post",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);

        alert("Post link copied!");
      }
    } catch (error) {
      console.log("Share cancelled");
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      // If your backend has logout endpoint,
      // call it here.
      //
      // await axios.post(
      //   `${API_URL}/auth/logout`,
      //   {},
      //   { withCredentials: true }
      // );

      localStorage.removeItem("token");

      setIsSidebarOpen(false);

      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                  Settings
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#0B1F33]">Menu</h2>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-[#0B1F33]"
              >
                <FiX size={22} />
              </button>
            </div>

            {/* LIST */}

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
                <FiBookmark size={20} />
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

              {/* ACTIVITY */}

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
                onClick={handleLogout}
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
            {/* PROFILE PHOTO */}

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

            {/* PROFILE DETAILS */}

            <div className="flex-1">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#0B1F33]">
                    {user.username || "Username"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {user.name || user.username || "Your Name"}
                  </p>
                </div>

                {/* ==================================
                    BUTTONS
                ================================== */}

                <div className="flex flex-wrap gap-2">
                  {/* =================================
                      OWN PROFILE
                  ================================= */}

                  {isOwnProfile && (
                    <>
                      {/* CREATE POST */}

                      <button
                        type="button"
                        onClick={() => navigate("/profile/createpost")}
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
                    </>
                  )}

                  {/* =================================
                      OTHER USER
                  ================================= */}

                  {!isOwnProfile && (
                    <button
                      type="button"
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`flex min-w-[125px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                        isFollowing
                          ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          : "bg-[#0B1F33] text-white hover:bg-[#153B5A]"
                      } ${
                        followLoading ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    >
                      {followLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-current" />
                          Please wait
                        </>
                      ) : isFollowing ? (
                        <>
                          <FiUserCheck size={16} />
                          Following
                        </>
                      ) : (
                        <>
                          <FiUserPlus size={16} />
                          Follow
                        </>
                      )}
                    </button>
                  )}

                  {/* SHARE PROFILE */}

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const profileUrl = window.location.href;

                        if (navigator.share) {
                          await navigator.share({
                            title: `${user.username} on Vlogify`,
                            text:
                              user.bio ||
                              `Check out ${user.username}'s profile`,
                            url: profileUrl,
                          });
                        } else {
                          await navigator.clipboard.writeText(profileUrl);

                          alert("Profile link copied!");
                        }
                      } catch (error) {
                        console.log("Share cancelled");
                      }
                    }}
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
                {/* POSTS */}

                <div className="text-center sm:text-left">
                  <p className="text-lg font-bold text-[#0B1F33]">
                    {posts.length}
                  </p>

                  <p className="text-xs text-gray-500">Posts</p>
                </div>

                {/* FOLLOWERS */}

                <button
                  type="button"
                  onClick={() => openUserList("followers")}
                  className="text-center sm:text-left hover:opacity-70 transition cursor-pointer"
                >
                  <p className="text-lg font-bold text-[#0B1F33]">
                    {followersCount}
                  </p>

                  <p className="text-xs text-gray-500">Followers</p>
                </button>

                {/* FOLLOWING */}

                <button
                  type="button"
                  onClick={() => openUserList("following")}
                  className="text-center sm:text-left hover:opacity-70 transition cursor-pointer"
                >
                  <p className="text-lg font-bold text-[#0B1F33]">
                    {followingCount}
                  </p>

                  <p className="text-xs text-gray-500">Following</p>
                </button>

                {/* LIKES */}

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
                  {user.location && (
                    <span className="flex items-center gap-1.5">
                      <FiMapPin size={14} />
                      {user.location}
                    </span>
                  )}

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
          {/* TABS */}

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

          {/* POSTS LOADING */}

          {postsLoading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0B1F33]" />

                <p className="mt-3 text-sm text-gray-500">Loading posts...</p>
              </div>
            </div>
          )}

          {/* POSTS ERROR */}

          {!postsLoading && postsError && (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto max-w-md rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                {postsError}
              </div>
            </div>
          )}

          {/* NO POSTS */}

          {!postsLoading && !postsError && posts.length === 0 && (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FiGrid size={28} className="text-gray-400" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#0B1F33]">
                No posts yet
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                {isOwnProfile
                  ? "Share your first photo or video with your followers."
                  : "This user has not shared any posts yet."}
              </p>

              {/* Only own profile can create */}

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => navigate("/profile/createpost")}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#153B5A]"
                >
                  <FiPlus size={16} />
                  Create your first post
                </button>
              )}
            </div>
          )}

          {/* REAL POSTS GRID */}

          {!postsLoading && !postsError && posts.length > 0 && (
            <div className="grid grid-cols-2 gap-1 p-1 sm:grid-cols-3 sm:gap-2 sm:p-2">
              {posts.map((post) => {
                const mediaUrl = getMediaUrl(post);

                const mediaType = getMediaType(post);

                const likes = getLikes(post);

                return (
                  <div
                    key={post._id || post.id}
                    onClick={() => openPost(post)}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100"
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

                    {/* HOVER */}

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

          {/* CREATE NEW POST */}

          {posts.length > 0 && isOwnProfile && (
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
            onClick={() => navigate("/profile/createpost")}
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
              src={
                currentUser?.profilePicture ||
                currentUser?.profilePic ||
                defaultProfilePicture
              }
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200"
              onError={(e) => {
                e.currentTarget.src = defaultProfilePicture;
              }}
            />
          </button>
        </div>
      </div>

      {/* ==========================================
          POST VIEWER MODAL
      ========================================== */}

      {selectedPost && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={closePost}
        >
          <div
            className="relative flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}

            <button
              type="button"
              onClick={closePost}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            >
              <FiX size={22} />
            </button>

            {/* MEDIA */}

            <div className="flex flex-1 items-center justify-center bg-black">
              {getMediaType(selectedPost) === "image" ? (
                <img
                  src={getMediaUrl(selectedPost)}
                  alt={selectedPost.caption || "Post"}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video
                  src={getMediaUrl(selectedPost)}
                  controls
                  autoPlay
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>

            {/* RIGHT SIDE */}

            <div className="flex w-full max-w-md flex-col bg-white">
              {/* USER HEADER */}

              <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
                <img
                  src={
                    selectedPost.user?.profilePicture ||
                    selectedPost.author?.profilePicture ||
                    profileImage
                  }
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover"
                />

                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0B1F33]">
                    {selectedPost.user?.username ||
                      selectedPost.author?.username ||
                      user.username}
                  </p>

                  {selectedPost.location && (
                    <p className="text-xs text-gray-500">
                      {selectedPost.location}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="text-gray-500 hover:text-[#0B1F33]"
                >
                  <FiMoreHorizontal size={21} />
                </button>
              </div>

              {/* COMMENTS */}

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {/* CAPTION */}

                {selectedPost.caption && (
                  <div className="mb-6 flex gap-3">
                    <img
                      src={
                        selectedPost.user?.profilePicture ||
                        selectedPost.author?.profilePicture ||
                        profileImage
                      }
                      alt="Profile"
                      className="h-9 w-9 rounded-full object-cover"
                    />

                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-[#0B1F33]">
                          {selectedPost.user?.username ||
                            selectedPost.author?.username ||
                            user.username}
                        </span>{" "}
                        {selectedPost.caption}
                      </p>
                    </div>
                  </div>
                )}

                {/* COMMENTS LIST */}

                {commentsLoading ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-10 text-center">
                    <FiMessageCircle
                      size={30}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm font-medium text-gray-500">
                      No comments yet
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Start the conversation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {comments.map((comment, index) => (
                      <div key={comment._id || index} className="flex gap-3">
                        <img
                          src={
                            comment.user?.profilePicture ||
                            comment.author?.profilePicture ||
                            defaultProfilePicture
                          }
                          alt="User"
                          className="h-9 w-9 rounded-full object-cover"
                        />

                        <div className="flex-1">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-[#0B1F33]">
                              {comment.user?.username ||
                                comment.author?.username ||
                                "User"}
                            </span>{" "}
                            {comment.text || comment.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ACTIONS */}

              <div className="border-t border-gray-200">
                {/* ACTION BUTTONS */}

                <div className="flex items-center justify-between px-5 pt-4">
                  <div className="flex items-center gap-5">
                    {/* LIKE */}

                    <button
                      type="button"
                      onClick={() => handleLike(selectedPost._id)}
                      className="transition hover:scale-110"
                    >
                      <FiHeart
                        size={25}
                        className={
                          selectedPost.likedByMe
                            ? "fill-red-500 text-red-500"
                            : "text-[#0B1F33]"
                        }
                      />
                    </button>

                    {/* COMMENT */}

                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById("comment-input")?.focus();
                      }}
                      className="transition hover:scale-110"
                    >
                      <FiMessageCircle size={25} className="text-[#0B1F33]" />
                    </button>

                    {/* SHARE */}

                    <button
                      type="button"
                      onClick={handleSharePost}
                      className="transition hover:scale-110"
                    >
                      <FiShare2 size={25} className="text-[#0B1F33]" />
                    </button>
                  </div>

                  {/* SAVE */}

                  <button type="button" className="transition hover:scale-110">
                    <FiBookmark size={24} className="text-[#0B1F33]" />
                  </button>
                </div>

                {/* LIKE COUNT */}

                <div className="px-5 pt-3">
                  <p className="text-sm font-semibold text-[#0B1F33]">
                    {getLikes(selectedPost).toLocaleString()}{" "}
                    {getLikes(selectedPost) === 1 ? "like" : "likes"}
                  </p>
                </div>

                {/* COMMENT INPUT */}

                <div className="mt-3 flex items-center gap-3 border-t border-gray-100 px-5 py-4">
                  <img
                    src={
                      currentUser?.profilePicture ||
                      currentUser?.profilePic ||
                      defaultProfilePicture
                    }
                    alt="You"
                    className="h-8 w-8 rounded-full object-cover"
                  />

                  <input
                    id="comment-input"
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleComment();
                      }
                    }}
                    placeholder="Add a comment..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />

                  <button
                    type="button"
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="text-sm font-semibold text-[#0B1F33] disabled:opacity-30"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ==========================================
    FOLLOWERS / FOLLOWING MODAL
========================================== */}

{showUsersModal && (
  <div
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4"
    onClick={() => setShowUsersModal(false)}
  >
    <div
      className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

        <h2 className="text-lg font-bold text-[#0B1F33]">
          {userListType === "followers"
            ? "Followers"
            : "Following"}
        </h2>

        <button
          type="button"
          onClick={() =>
            setShowUsersModal(false)
          }
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
        >
          <FiX size={20} />
        </button>

      </div>

      {/* USERS */}

      <div className="max-h-[500px] overflow-y-auto">

        {userListLoading ? (
          <div className="flex min-h-[250px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0B1F33]" />

              <p className="mt-3 text-sm text-gray-500">
                Loading...
              </p>

            </div>

          </div>
        ) : userList.length === 0 ? (

          <div className="flex min-h-[250px] flex-col items-center justify-center px-5 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <FiUser
                size={25}
                className="text-gray-400"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-[#0B1F33]">
              {userListType === "followers"
                ? "No followers yet"
                : "Not following anyone"}
            </p>

          </div>

        ) : (

          <div className="divide-y divide-gray-100">

            {userList.map((person) => (

              <div
                key={person._id}
                className="flex items-center gap-3 px-5 py-4"
              >

                {/* PROFILE IMAGE */}

                <img
                  src={
                    person.profilePicture ||
                    person.profilePic ||
                    defaultProfilePicture
                  }
                  alt={person.username}
                  className="h-11 w-11 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      defaultProfilePicture;
                  }}
                />

                {/* USER INFO */}

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-semibold text-[#0B1F33]">
                    {person.username}
                  </p>

                  {person.name && (
                    <p className="truncate text-xs text-gray-500">
                      {person.name}
                    </p>
                  )}

                </div>

                {/* VIEW PROFILE */}

                <button
                  type="button"
                  onClick={() => {
                    setShowUsersModal(false);
                    navigate(
                      `/profile/${person._id}`
                    );
                  }}
                  className="rounded-lg bg-[#0B1F33] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#153B5A]"
                >
                  View
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  </div>
)}
    </div>
  );
};

export default Profile;
