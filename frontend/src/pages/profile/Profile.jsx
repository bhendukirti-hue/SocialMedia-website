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

  const [currentUser, setCurrentUser] = useState(null);
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

  // User lists
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
  // CHECK OWN PROFILE
  // ==========================================

  const isOwnProfile =
    !userId ||
    (currentUser?._id &&
      user?._id &&
      currentUser._id.toString() === user._id.toString());

  // ==========================================
  // FETCH CURRENT USER
  // ==========================================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/auth/verify-token`,
          {
            withCredentials: true,
          }
        );

        console.log("Current user response:", response.data);

        const userData = response.data.user || response.data;

        setCurrentUser(userData);
      } catch (error) {
        console.error(
          "Current user error:",
          error.response?.data || error.message
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

        if (!userId) {
          response = await axios.get(
            `${API_URL}/auth/verify-token`,
            {
              withCredentials: true,
            }
          );
        } else {
          response = await axios.get(
            `${API_URL}/users/${userId}`,
            {
              withCredentials: true,
            }
          );
        }

        console.log("Profile response:", response.data);

        const userData = response.data.user || response.data;

        if (!userData) {
          throw new Error("User profile not found");
        }

        setUser(userData);

        setFollowersCount(
          Array.isArray(userData.followers)
            ? userData.followers.length
            : Number(userData.followersCount) || 0
        );

        setFollowingCount(
          Array.isArray(userData.following)
            ? userData.following.length
            : Number(userData.followingCount) || 0
        );

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
            "Unable to load profile. Please try again."
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
      if (!user?._id) return;

      if (
        currentUser?._id &&
        currentUser._id.toString() === user._id.toString()
      ) {
        setIsFollowing(false);

        setFollowersCount(
          Array.isArray(user.followers)
            ? user.followers.length
            : Number(user.followersCount) || 0
        );

        setFollowingCount(
          Array.isArray(user.following)
            ? user.following.length
            : Number(user.followingCount) || 0
        );

        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/follows/${user._id}/follow-status`,
          {
            withCredentials: true,
          }
        );

        console.log("Follow status response:", response.data);

        if (response.data?.success) {
          setIsFollowing(Boolean(response.data.isFollowing));

          setFollowersCount(
            Number(response.data.followersCount) || 0
          );

          setFollowingCount(
            Number(response.data.followingCount) || 0
          );
        }
      } catch (error) {
        console.error(
          "Follow status error:",
          error.response?.data || error.message
        );
      }
    };

    fetchFollowStatus();
  }, [user?._id, currentUser?._id]);

  // ==========================================
  // OPEN USER LIST
  // ==========================================

  const openUserList = async (type) => {
    if (!user?._id) return;

    try {
      setUserListLoading(true);
      setUserListType(type);
      setShowUsersModal(true);
      setUserList([]);

      const response = await axios.get(
        `${API_URL}/users/${user._id}/${type}`,
        {
          withCredentials: true,
        }
      );

      setUserList(response.data.users || []);
    } catch (error) {
      console.error(
        `${type} users error:`,
        error.response?.data || error.message
      );

      setUserList([]);
    } finally {
      setUserListLoading(false);
    }
  };

  // ==========================================
  // FOLLOW / UNFOLLOW
  // ==========================================

  const handleFollow = async () => {
    if (!user?._id || followLoading) return;

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

      if (isFollowing) {
        response = await axios.delete(
          `${API_URL}/follows/${user._id}/follow`,
          {
            withCredentials: true,
          }
        );
      } else {
        response = await axios.post(
          `${API_URL}/follows/${user._id}/follow`,
          {},
          {
            withCredentials: true,
          }
        );
      }

      console.log("Follow response:", response.data);

      if (response.data?.success) {
        setIsFollowing(Boolean(response.data.isFollowing));

        setFollowersCount(
          Number(response.data.followersCount) || 0
        );

        setFollowingCount(
          Number(response.data.followingCount) || 0
        );

        setUser((prev) => {
          if (!prev) return prev;

          const currentFollowers = Array.isArray(prev.followers)
            ? [...prev.followers]
            : [];

          if (response.data.isFollowing) {
            if (
              currentUser?._id &&
              !currentFollowers.some(
                (id) =>
                  id.toString() ===
                  currentUser._id.toString()
              )
            ) {
              currentFollowers.push(currentUser._id);
            }
          } else {
            const updatedFollowers =
              currentFollowers.filter(
                (id) =>
                  id.toString() !==
                  currentUser?._id?.toString()
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
      console.error(
        "Follow error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
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

        if (!userId) {
          response = await axios.get(
            `${API_URL}/posts/my-posts`,
            {
              withCredentials: true,
            }
          );
        } else {
          response = await axios.get(
            `${API_URL}/posts/user/${userId}`,
            {
              withCredentials: true,
            }
          );
        }

        console.log("Posts response:", response.data);

        const postData =
          response.data.posts || response.data;

        setPosts(Array.isArray(postData) ? postData : []);
      } catch (err) {
        console.error("Posts error:", err);

        setPostsError(
          err.response?.data?.message ||
            "Unable to load posts."
        );
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
    user?.profilePicture ||
    user?.profilePic ||
    defaultProfilePicture;

  // ==========================================
  // TOTAL LIKES
  // ==========================================

  const totalLikes = posts.reduce((total, post) => {
    return (
      total +
      (Array.isArray(post.likes)
        ? post.likes.length
        : Number(post.likes) || 0)
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

    if (
      post.videoUrl ||
      post.video ||
      post.type === "video"
    ) {
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
  // LIKE POST
  // ==========================================

  const handleLike = async (postId) => {
    try {
      const response = await axios.post(
        `${API_URL}/posts/${postId}/like`,
        {},
        {
          withCredentials: true,
        }
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
          })
        );

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
      console.error(
        "Like error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // OPEN POST + COMMENTS
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
        }
      );

      setComments(
        response.data.comments ||
          response.data ||
          []
      );
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
        }
      );

      const newComment =
        response.data.comment || response.data;

      setComments((prev) => [...prev, newComment]);

      setCommentText("");
    } catch (error) {
      console.error(
        "Comment error:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // SHARE POST
  // ==========================================

  const handleSharePost = async () => {
    if (!selectedPost) return;

    try {
      const shareUrl =
        `${window.location.origin}/post/` +
        selectedPost._id;

      if (navigator.share) {
        await navigator.share({
          title: "Vlogify Post",
          text:
            selectedPost.caption ||
            "Check out this post",
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
      localStorage.removeItem("token");

      setIsSidebarOpen(false);

      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-[#315CFF]" />

          <p className="mt-3 text-sm text-gray-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-5">
        <div className="max-w-md rounded-xl border border-red-100 bg-red-50 px-6 py-5 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-sm text-gray-500">
          User profile not found.
        </p>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 text-gray-900">

      {/* ==========================================
          SETTINGS SIDEBAR
      ========================================== */}

      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#07111F]/40 backdrop-blur-[2px]"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#315CFF]">
                  Vlogify
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#172033]">
                  Settings
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-pink-50 hover:text-pink-500"
              >
                <FiX size={20} />
              </button>

            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">

              {[
                ["Saved", FiBookmark, "/saved"],
                ["Archived", FiArchive, "/archived"],
                ["Your Activity", FiActivity, "/activity"],
                ["Notification", FiBell, "/notifications"],
                ["Time Management", FiClock, "/time-management"],
                ["Account Privacy", FiLock, "/account-privacy"],
                ["Close Friends", FiUsers, "/close-friends"],
                ["Blocked", FiSlash, "/blocked"],
                ["Help", FiHelpCircle, "/help"],
                ["Account Status", FiCheckCircle, "/account-status"],
                ["About", FiInfo, "/about"],
              ].map(([label, Icon, path]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    navigate(path);
                  }}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-[#F5F7FF] hover:text-[#315CFF]"
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </button>
              ))}

              <div className="my-4 border-t border-gray-100" />

              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate("/add-account");
                }}
                className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#315CFF] transition hover:bg-blue-50"
              >
                <FiUserPlus size={19} />
                <span>Add Account</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold text-pink-600 transition hover:bg-pink-50"
              >
                <FiLogOut size={19} />
                <span>Logout</span>
              </button>

            </div>
          </aside>
        </>
      )}

      {/* ==========================================
          TOP BAR
      ========================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#315CFF] text-white shadow-sm">
              <span className="text-sm font-bold">V</span>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Profile
              </p>

              <h1 className="max-w-[180px] truncate text-sm font-bold text-[#172033] sm:max-w-none">
                {user.username || "Username"}
              </h1>
            </div>

          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-pink-50 hover:text-pink-500"
          >
            <FiMoreHorizontal size={22} />
          </button>

        </div>

      </header>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">

        {/* ==========================================
            PROFILE HEADER
        ========================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* SOFT TOP ACCENT */}

          <div className="h-20 bg-gradient-to-r from-[#EEF2FF] via-[#FDF2F8] to-[#EFF6FF] sm:h-24" />

          <div className="px-4 pb-6 sm:px-7 sm:pb-8">

            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end">

              {/* PROFILE IMAGE */}

              <div className="flex justify-center sm:justify-start">

                <div className="rounded-full bg-white p-1.5 shadow-lg">

                  <img
                    src={profileImage}
                    alt={`${user.username || "User"} profile`}
                    className="h-24 w-24 rounded-full object-cover sm:h-28 sm:w-28"
                    onError={(e) => {
                      e.currentTarget.src =
                        defaultProfilePicture;
                    }}
                  />

                </div>

              </div>

              {/* PROFILE INFORMATION */}

              <div className="flex-1 text-center sm:pb-1 sm:text-left">

                <h2 className="text-xl font-bold text-[#172033] sm:text-2xl">
                  {user.username || "Username"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {user.name ||
                    user.username ||
                    "Your Name"}
                </p>

              </div>

              {/* ACTION BUTTONS */}

              <div className="flex flex-wrap justify-center gap-2 sm:justify-end">

                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/profile/createpost")
                      }
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#315CFF] hover:bg-blue-50 hover:text-[#315CFF]"
                    >
                      <FiPlus size={16} />
                      Create
                    </button>

                    <Link
                      to="/profile/editprofile"
                      className="flex items-center gap-2 rounded-xl bg-[#315CFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2548D9]"
                    >
                      <FiEdit3 size={16} />
                      Edit Profile
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                      isFollowing
                        ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        : "bg-[#315CFF] text-white hover:bg-[#2548D9]"
                    } ${
                      followLoading
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                  >
                    {followLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-current" />
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

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const profileUrl =
                        window.location.href;

                      if (navigator.share) {
                        await navigator.share({
                          title: `${user.username} on Vlogify`,
                          text:
                            user.bio ||
                            `Check out ${user.username}'s profile`,
                          url: profileUrl,
                        });
                      } else {
                        await navigator.clipboard.writeText(
                          profileUrl
                        );

                        alert("Profile link copied!");
                      }
                    } catch (error) {
                      console.log("Share cancelled");
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-pink-50 hover:text-pink-500"
                >
                  <FiShare2 size={16} />
                  <span>Share</span>
                </button>

              </div>

            </div>

            {/* ==========================================
                STATS
            ========================================== */}

            <div className="mt-6 grid grid-cols-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">

              <div className="border-r border-gray-100 px-2 py-4 text-center">
                <p className="text-lg font-bold text-[#172033]">
                  {posts.length}
                </p>
                <p className="text-[11px] text-gray-500 sm:text-xs">
                  Posts
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  openUserList("followers")
                }
                className="border-r border-gray-100 px-2 py-4 text-center transition hover:bg-white"
              >
                <p className="text-lg font-bold text-[#172033]">
                  {followersCount}
                </p>
                <p className="text-[11px] text-gray-500 sm:text-xs">
                  Followers
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  openUserList("following")
                }
                className="border-r border-gray-100 px-2 py-4 text-center transition hover:bg-white"
              >
                <p className="text-lg font-bold text-[#172033]">
                  {followingCount}
                </p>
                <p className="text-[11px] text-gray-500 sm:text-xs">
                  Following
                </p>
              </button>

              <div className="px-2 py-4 text-center">
                <p className="text-lg font-bold text-[#172033]">
                  {totalLikes.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-500 sm:text-xs">
                  Likes
                </p>
              </div>

            </div>

            {/* ==========================================
                BIO
            ========================================== */}

            <div className="mt-6">

              <p className="text-sm font-bold text-[#172033]">
                {user.name ||
                  user.username ||
                  "Your Name"}
              </p>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                {user.bio ||
                  "Add a bio to tell people about yourself."}
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-500 sm:justify-start">

                {user.location && (
                  <span className="flex items-center gap-1.5">
                    <FiMapPin
                      size={14}
                      className="text-pink-500"
                    />
                    {user.location}
                  </span>
                )}

                {user.joined && (
                  <span className="flex items-center gap-1.5">
                    <FiCalendar
                      size={14}
                      className="text-[#315CFF]"
                    />
                    Joined {user.joined}
                  </span>
                )}

              </div>

            </div>

          </div>
        </section>

        {/* ==========================================
            POSTS
        ========================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* TABS */}

          <div className="flex items-center justify-center border-b border-gray-100">

            <button
              type="button"
              className="flex items-center gap-2 border-b-2 border-[#315CFF] px-6 py-4 text-xs font-bold text-[#315CFF] sm:text-sm"
            >
              <FiGrid size={16} />
              Posts
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-6 py-4 text-xs font-medium text-gray-400 transition hover:text-pink-500 sm:text-sm"
            >
              <FiHeart size={16} />
              Liked
            </button>

            <button
              type="button"
              className="hidden items-center gap-2 px-6 py-4 text-xs font-medium text-gray-400 transition hover:text-[#315CFF] sm:flex sm:text-sm"
            >
              <FiBookmark size={16} />
              Saved
            </button>

          </div>

          {/* ==========================================
              LOADING
          ========================================== */}

          {postsLoading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#315CFF]" />
                <p className="mt-3 text-sm text-gray-500">
                  Loading posts...
                </p>
              </div>
            </div>
          )}

          {/* ==========================================
              ERROR
          ========================================== */}

          {!postsLoading && postsError && (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto max-w-md rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                {postsError}
              </div>
            </div>
          )}

          {/* ==========================================
              EMPTY
          ========================================== */}

          {!postsLoading &&
            !postsError &&
            posts.length === 0 && (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-pink-50 text-[#315CFF]">
                  <FiGrid size={27} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#172033]">
                  No posts yet
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  {isOwnProfile
                    ? "Share your first photo or video with your followers."
                    : "This user has not shared any posts yet."}
                </p>

                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/profile/createpost")
                    }
                    className="mt-5 flex items-center gap-2 rounded-xl bg-[#315CFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2548D9]"
                  >
                    <FiPlus size={16} />
                    Create Post
                  </button>
                )}

              </div>
            )}

          {/* ==========================================
              POSTS GRID
          ========================================== */}

          {!postsLoading &&
            !postsError &&
            posts.length > 0 && (
              <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 sm:grid-cols-3 sm:gap-2 sm:p-2">

                {posts.map((post) => {
                  const mediaUrl = getMediaUrl(post);
                  const mediaType = getMediaType(post);
                  const likes = getLikes(post);

                  return (
                    <div
                      key={post._id || post.id}
                      onClick={() => openPost(post)}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-200"
                    >

                      {/* IMAGE */}

                      {mediaType === "image" &&
                        mediaUrl && (
                          <img
                            src={mediaUrl}
                            alt={
                              post.caption || "Post"
                            }
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />
                        )}

                      {/* VIDEO */}

                      {mediaType === "video" &&
                        mediaUrl && (
                          <video
                            src={mediaUrl}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        )}

                      {/* VIDEO ICON */}

                      {mediaType === "video" &&
                        mediaUrl && (
                          <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                            <FiVideo size={15} />
                          </div>
                        )}

                      {/* NO MEDIA */}

                      {!mediaUrl && (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No media
                        </div>
                      )}

                      {/* HOVER */}

                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">

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
                              size={21}
                              fill={
                                post.likedByMe
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                            {likes}
                          </button>

                          <span className="flex items-center gap-1.5">
                            <FiMessageCircle size={21} />
                          </span>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          {/* CREATE */}

          {posts.length > 0 && isOwnProfile && (
            <div className="flex justify-center border-t border-gray-100 px-5 py-5">
              <button
                type="button"
                onClick={() =>
                  navigate("/profile/createpost")
                }
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#315CFF] hover:bg-blue-50 hover:text-[#315CFF]"
              >
                <FiPlus size={16} />
                Create New Post
              </button>
            </div>
          )}

        </section>

      </main>

      {/* ==========================================
          MOBILE BOTTOM NAV
      ========================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-around px-4">

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition hover:bg-blue-50 hover:text-[#315CFF]"
          >
            <FiHome size={23} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/reels")}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition hover:bg-pink-50 hover:text-pink-500"
          >
            <FiVideo size={23} />
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/profile/createpost")
            }
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#315CFF] text-white shadow-sm transition hover:bg-[#2548D9]"
          >
            <FiPlus size={25} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/search")}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition hover:bg-blue-50 hover:text-[#315CFF]"
          >
            <FiSearch size={23} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex h-11 w-11 items-center justify-center rounded-xl"
          >
            <img
              src={
                currentUser?.profilePicture ||
                currentUser?.profilePic ||
                defaultProfilePicture
              }
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[#315CFF]/20"
              onError={(e) => {
                e.currentTarget.src =
                  defaultProfilePicture;
              }}
            />
          </button>

        </div>
      </div>

      {/* ==========================================
          POST VIEWER
      ========================================== */}

      {selectedPost && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111F]/80 p-0 backdrop-blur-sm sm:p-5"
          onClick={closePost}
        >

          <div
            className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-[90vh] sm:max-w-6xl sm:flex-row sm:rounded-2xl sm:shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={closePost}
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
            >
              <FiX size={20} />
            </button>

            {/* ==========================================
                MEDIA
            ========================================== */}

            <div className="flex min-h-0 flex-1 items-center justify-center bg-black">

              {getMediaType(selectedPost) ===
              "image" ? (
                <img
                  src={getMediaUrl(selectedPost)}
                  alt={
                    selectedPost.caption || "Post"
                  }
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video
                  src={getMediaUrl(selectedPost)}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
              )}

            </div>

            {/* ==========================================
                COMMENTS PANEL
            ========================================== */}

            <div className="flex h-[52%] w-full flex-col bg-white sm:h-full sm:w-[390px]">

              {/* USER */}

              <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3">

                <img
                  src={
                    selectedPost.user
                      ?.profilePicture ||
                    selectedPost.author
                      ?.profilePicture ||
                    profileImage
                  }
                  alt="Profile"
                  className="h-9 w-9 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      defaultProfilePicture;
                  }}
                />

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-semibold text-[#172033]">
                    {selectedPost.user
                      ?.username ||
                      selectedPost.author
                        ?.username ||
                      user.username}
                  </p>

                  {selectedPost.location && (
                    <p className="truncate text-xs text-gray-400">
                      {selectedPost.location}
                    </p>
                  )}

                </div>

                <FiMoreHorizontal
                  size={20}
                  className="text-gray-400"
                />

              </div>

              {/* ==========================================
                  COMMENTS CONTENT
              ========================================== */}

              <div className="min-h-0 flex-1 overflow-y-auto">

                {/* CAPTION */}

                {selectedPost.caption && (
                  <div className="border-b border-gray-100 px-4 py-4">

                    <div className="flex gap-3">

                      <img
                        src={
                          selectedPost.user
                            ?.profilePicture ||
                          selectedPost.author
                            ?.profilePicture ||
                          profileImage
                        }
                        alt="Profile"
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />

                      <p className="text-sm leading-6 text-gray-700">

                        <span className="mr-1 font-bold text-[#172033]">
                          {selectedPost.user
                            ?.username ||
                            selectedPost.author
                              ?.username ||
                            user.username}
                        </span>

                        {selectedPost.caption}

                      </p>

                    </div>

                  </div>
                )}

                {/* COMMENTS TITLE */}

                <div className="px-4 pt-4">

                  <div className="flex items-center justify-between">

                    <h3 className="text-sm font-bold text-[#172033]">
                      Comments
                    </h3>

                    <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-500">
                      {comments.length}
                    </span>

                  </div>

                </div>

                {/* COMMENTS */}

                <div className="px-4 py-4">

                  {commentsLoading ? (
                    <div className="flex min-h-[180px] items-center justify-center">
                      <div className="text-center">

                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-gray-200 border-t-[#315CFF]" />

                        <p className="mt-3 text-xs text-gray-400">
                          Loading comments...
                        </p>

                      </div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex min-h-[180px] flex-col items-center justify-center text-center">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-pink-50">
                        <FiMessageCircle
                          size={22}
                          className="text-[#315CFF]"
                        />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-[#172033]">
                        No comments yet
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Be the first to comment.
                      </p>

                    </div>
                  ) : (
                    <div className="space-y-5">

                      {comments.map(
                        (comment, index) => (
                          <div
                            key={
                              comment._id ||
                              index
                            }
                            className="flex gap-3"
                          >

                            <img
                              src={
                                comment.user
                                  ?.profilePicture ||
                                comment.author
                                  ?.profilePicture ||
                                defaultProfilePicture
                              }
                              alt="User"
                              className="h-9 w-9 shrink-0 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  defaultProfilePicture;
                              }}
                            />

                            <div className="min-w-0 flex-1">

                              <div className="rounded-2xl bg-gray-50 px-3 py-2.5">

                                <p className="text-xs font-bold text-[#172033]">
                                  {comment.user
                                    ?.username ||
                                    comment.author
                                      ?.username ||
                                    "User"}
                                </p>

                                <p className="mt-1 break-words text-sm leading-5 text-gray-600">
                                  {comment.text ||
                                    comment.comment}
                                </p>

                              </div>

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>

              </div>

              {/* ==========================================
                  ACTIONS + INPUT
              ========================================== */}

              <div className="shrink-0 border-t border-gray-100 bg-white">

                {/* ACTIONS */}

                <div className="flex items-center justify-between px-4 pt-3">

                  <div className="flex items-center gap-5">

                    <button
                      type="button"
                      onClick={() =>
                        handleLike(
                          selectedPost._id
                        )
                      }
                      className="transition hover:scale-110"
                    >
                      <FiHeart
                        size={23}
                        className={
                          selectedPost.likedByMe
                            ? "fill-pink-500 text-pink-500"
                            : "text-[#172033]"
                        }
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById(
                            "comment-input"
                          )
                          ?.focus();
                      }}
                      className="text-[#172033] transition hover:scale-110"
                    >
                      <FiMessageCircle size={23} />
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSharePost
                      }
                      className="text-[#172033] transition hover:scale-110"
                    >
                      <FiShare2 size={23} />
                    </button>

                  </div>

                  <button
                    type="button"
                    className="text-[#172033] transition hover:scale-110"
                  >
                    <FiBookmark size={22} />
                  </button>

                </div>

                {/* LIKES */}

                <div className="px-4 pt-2">

                  <p className="text-sm font-bold text-[#172033]">
                    {getLikes(
                      selectedPost
                    ).toLocaleString()}{" "}
                    {getLikes(
                      selectedPost
                    ) === 1
                      ? "like"
                      : "likes"}
                  </p>

                </div>

                {/* COMMENT INPUT */}

                <div className="flex items-center gap-2 px-4 py-3">

                  <img
                    src={
                      currentUser?.profilePicture ||
                      currentUser?.profilePic ||
                      defaultProfilePicture
                    }
                    alt="You"
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />

                  <div className="flex min-w-0 flex-1 items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1">

                    <input
                      id="comment-input"
                      type="text"
                      value={commentText}
                      onChange={(e) =>
                        setCommentText(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleComment();
                        }
                      }}
                      placeholder="Add a comment..."
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                    />

                    <button
                      type="button"
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      className="px-1 text-xs font-bold text-[#315CFF] disabled:opacity-30"
                    >
                      Post
                    </button>

                  </div>

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
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07111F]/50 px-3 backdrop-blur-sm"
          onClick={() =>
            setShowUsersModal(false)
          }
        >

          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#315CFF]">
                  Community
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#172033]">
                  {userListType ===
                  "followers"
                    ? "Followers"
                    : "Following"}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowUsersModal(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-pink-50 hover:text-pink-500"
              >
                <FiX size={19} />
              </button>

            </div>

            {/* USERS */}

            <div className="max-h-[500px] overflow-y-auto">

              {userListLoading ? (
                <div className="flex min-h-[250px] items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#315CFF]" />

                    <p className="mt-3 text-sm text-gray-500">
                      Loading...
                    </p>

                  </div>

                </div>
              ) : userList.length === 0 ? (
                <div className="flex min-h-[250px] flex-col items-center justify-center px-5 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-pink-50">
                    <FiUser
                      size={24}
                      className="text-[#315CFF]"
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-[#172033]">
                    {userListType ===
                    "followers"
                      ? "No followers yet"
                      : "Not following anyone"}
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-gray-100">

                  {userList.map(
                    (person) => (
                      <div
                        key={person._id}
                        className="flex items-center gap-3 px-5 py-3.5"
                      >

                        <img
                          src={
                            person.profilePicture ||
                            person.profilePic ||
                            defaultProfilePicture
                          }
                          alt={
                            person.username
                          }
                          className="h-11 w-11 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              defaultProfilePicture;
                          }}
                        />

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-semibold text-[#172033]">
                            {person.username}
                          </p>

                          {person.name && (
                            <p className="truncate text-xs text-gray-500">
                              {person.name}
                            </p>
                          )}

                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUsersModal(
                              false
                            );

                            navigate(
                              `/profile/${person._id}`
                            );
                          }}
                          className="rounded-lg bg-[#315CFF] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2548D9]"
                        >
                          View
                        </button>

                      </div>
                    )
                  )}

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
