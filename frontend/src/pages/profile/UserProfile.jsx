import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiGrid,
  FiHeart,
  FiUserPlus,
  FiUserCheck,
  FiShare2,
  FiMessageCircle,
  FiBookmark,
  FiX,
  FiSend,
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
} from "react-icons/fi";

const API_URL = "http://localhost:8808/api";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FOLLOWERS / FOLLOWING MODAL
  // ==========================================
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [userListType, setUserListType] = useState("");
  const [userList, setUserList] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);

  // ==========================================
  // POST VIEWER
  // ==========================================
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostIndex, setSelectedPostIndex] =
    useState(-1);

  // ==========================================
  // LIKE / SAVE
  // ==========================================
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);

  // ==========================================
  // COMMENTS
  // ==========================================
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);

  // ==========================================
  // FETCH CURRENT USER
  // ==========================================
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/auth/verify-token`,
        {
          withCredentials: true,
        }
      );

      setCurrentUser(response.data.user || null);
    } catch (error) {
      console.error("Current user error:", error);
    }
  };

  // ==========================================
  // FETCH USER PROFILE
  // ==========================================
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/users/${userId}`,
        {
          withCredentials: true,
        }
      );

      const fetchedUser = response.data.user || null;

      setUser(fetchedUser);
      setPosts(response.data.posts || []);

      setFollowersCount(
        fetchedUser?.followers?.length || 0
      );

      setFollowingCount(
        fetchedUser?.following?.length || 0
      );
    } catch (error) {
      console.error(
        "Fetch user profile error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CHECK FOLLOW STATUS
  // ==========================================
  const fetchFollowStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/follows/${userId}/follow-status`,
        {
          withCredentials: true,
        }
      );

      setIsFollowing(
        response.data.isFollowing || false
      );

      setFollowersCount(
        response.data.followersCount || 0
      );

      if (
        response.data.followingCount !== undefined
      ) {
        setFollowingCount(
          response.data.followingCount
        );
      }
    } catch (error) {
      console.error(
        "Follow status error:",
        error
      );
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    if (!userId) return;

    fetchCurrentUser();
    fetchUserProfile();
    fetchFollowStatus();
  }, [userId]);

  // ==========================================
  // FOLLOW USER
  // ==========================================
  const handleFollow = async () => {
    if (!userId || followLoading) return;

    try {
      setFollowLoading(true);

      const response = await axios.post(
        `${API_URL}/follows/${userId}/follow`,
        {},
        {
          withCredentials: true,
        }
      );

      setIsFollowing(true);

      setFollowersCount(
        response.data.followersCount ??
          followersCount + 1
      );
    } catch (error) {
      console.error("Follow error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to follow user."
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // ==========================================
  // UNFOLLOW USER
  // ==========================================
  const handleUnfollow = async () => {
    if (!userId || followLoading) return;

    try {
      setFollowLoading(true);

      const response = await axios.delete(
        `${API_URL}/follows/${userId}/follow`,
        {
          withCredentials: true,
        }
      );

      setIsFollowing(false);

      setFollowersCount(
        response.data.followersCount ??
          Math.max(followersCount - 1, 0)
      );
    } catch (error) {
      console.error(
        "Unfollow error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to unfollow user."
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // ==========================================
  // SHARE PROFILE
  // ==========================================
  const handleShareProfile = async () => {
    try {
      const profileUrl =
        window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: `${user.username}'s Profile`,
          text: `Check out ${user.username}'s profile`,
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
  };

  // ==========================================
  // OPEN FOLLOWERS / FOLLOWING
  // ==========================================
  const openUserList = async (type) => {
    if (!user?._id) return;

    try {
      setUserListType(type);
      setShowUsersModal(true);
      setUserList([]);
      setUserListLoading(true);

      const response = await axios.get(
        `${API_URL}/users/${user._id}/${type}`,
        {
          withCredentials: true,
        }
      );

      setUserList(
        response.data.users || []
      );
    } catch (error) {
      console.error(
        `Get ${type} error:`,
        error.response?.data ||
          error.message
      );

      setUserList([]);

      alert(
        error.response?.data?.message ||
          `Failed to load ${type}.`
      );
    } finally {
      setUserListLoading(false);
    }
  };

  // ==========================================
  // CLOSE FOLLOWERS / FOLLOWING MODAL
  // ==========================================
  const closeUsersModal = () => {
    setShowUsersModal(false);
    setUserListType("");
    setUserList([]);
  };

  // ==========================================
  // OPEN USER PROFILE FROM LIST
  // ==========================================
  const openUserProfile = (personId) => {
    closeUsersModal();
    navigate(`/profile/${personId}`);
  };

  // ==========================================
  // OPEN POST
  // ==========================================
  const openPost = (post, index) => {
    setSelectedPost(post);
    setSelectedPostIndex(index);

    setLikeCount(
      post.likeCount ||
        post.likes?.length ||
        0
    );

    if (currentUser?._id && post.likes) {
      const alreadyLiked = post.likes.some(
        (id) =>
          id?.toString() ===
          currentUser._id.toString()
      );

      setLiked(alreadyLiked);
    } else {
      setLiked(false);
    }

    setSaved(false);

    setComments(
      post.comments || []
    );

    setCommentText("");

    document.body.style.overflow = "hidden";
  };

  // ==========================================
  // CLOSE POST
  // ==========================================
  const closePost = () => {
    setSelectedPost(null);
    setSelectedPostIndex(-1);
    setCommentText("");

    document.body.style.overflow = "auto";
  };

  // ==========================================
  // PREVIOUS POST
  // ==========================================
  const previousPost = () => {
    if (selectedPostIndex <= 0) return;

    const newIndex =
      selectedPostIndex - 1;

    openPost(posts[newIndex], newIndex);
  };

  // ==========================================
  // NEXT POST
  // ==========================================
  const nextPost = () => {
    if (
      selectedPostIndex >=
      posts.length - 1
    )
      return;

    const newIndex =
      selectedPostIndex + 1;

    openPost(posts[newIndex], newIndex);
  };

  // ==========================================
  // LIKE POST
  // ==========================================
  const handleLike = async () => {
    if (!selectedPost || !currentUser) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/posts/${selectedPost._id}/like`,
        {},
        {
          withCredentials: true,
        }
      );

      const newLiked =
        response.data.liked ??
        response.data.isLiked ??
        !liked;

      const newCount =
        response.data.likeCount ??
        response.data.likesCount ??
        (newLiked
          ? likeCount + 1
          : Math.max(likeCount - 1, 0));

      setLiked(newLiked);
      setLikeCount(newCount);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === selectedPost._id
            ? {
                ...post,
                likeCount: newCount,
              }
            : post
        )
      );

      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              likeCount: newCount,
            }
          : prev
      );
    } catch (error) {
      console.error(
        "Like post error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to like post."
      );
    }
  };

  // ==========================================
  // SAVE POST
  // ==========================================
  const handleSave = () => {
    setSaved((prev) => !prev);
  };

  // ==========================================
  // SHARE POST
  // ==========================================
  const handleSharePost = async () => {
    if (!selectedPost) return;

    try {
      const postUrl =
        `${window.location.origin}/profile/${userId}?post=${selectedPost._id}`;

      if (navigator.share) {
        await navigator.share({
          title: `${user.username}'s post`,
          text:
            selectedPost.caption ||
            "Check out this post",
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          postUrl
        );

        alert("Post link copied!");
      }
    } catch (error) {
      console.log("Share cancelled");
    }
  };

  // ==========================================
  // ADD COMMENT
  // ==========================================
  const handleComment = async () => {
    if (!commentText.trim()) return;

    if (!currentUser) {
      alert("Please login to comment.");
      return;
    }

    const newComment = {
      _id: Date.now().toString(),
      text: commentText.trim(),
      user: {
        _id: currentUser._id,
        username: currentUser.username,
        profilePicture:
          currentUser.profilePicture || "",
      },
    };

    setComments((prev) => [
      ...prev,
      newComment,
    ]);

    setCommentText("");
  };

  // ==========================================
  // ESC KEY
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showUsersModal) {
        if (event.key === "Escape") {
          closeUsersModal();
        }

        return;
      }

      if (!selectedPost) return;

      if (event.key === "Escape") {
        closePost();
      }

      if (event.key === "ArrowLeft") {
        previousPost();
      }

      if (event.key === "ArrowRight") {
        nextPost();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    selectedPost,
    selectedPostIndex,
    posts,
    showUsersModal,
  ]);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#162A46] rounded-full animate-spin"></div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-5">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FiUser
            size={35}
            className="text-gray-400"
          />
        </div>

        <h2 className="text-xl font-bold text-[#162A46]">
          User Not Found
        </h2>

        <p className="text-gray-500 mt-2 text-center">
          {error ||
            "This user profile does not exist."}
        </p>

        <button
          onClick={() => navigate(-1)}
          className="mt-5 px-5 py-2.5 bg-[#162A46] text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ==========================================
  // OWN PROFILE
  // ==========================================
  const isOwnProfile =
    currentUser?._id &&
    user?._id &&
    currentUser._id.toString() ===
      user._id.toString();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#162A46]">

      {/* ======================================
          HEADER
      ====================================== */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">

          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <FiArrowLeft size={22} />
          </button>

          <div>
            <h1 className="font-bold text-lg">
              {user.username}
            </h1>

            <p className="text-xs text-gray-500">
              Profile
            </p>
          </div>

        </div>
      </div>

      {/* ======================================
          PROFILE
      ====================================== */}
      <div className="max-w-3xl mx-auto">

        <div className="bg-white px-5 py-8 border-b border-gray-200">

          <div className="flex items-center gap-6">

            {/* PROFILE PICTURE */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">

              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#162A46] text-white">
                  <FiUser size={42} />
                </div>
              )}

            </div>

            {/* USER INFO */}
            <div className="flex-1">

              <h2 className="text-xl md:text-2xl font-bold">
                {user.username}
              </h2>

              {user.name && (
                <p className="text-gray-600 mt-1">
                  {user.name}
                </p>
              )}

              {user.bio && (
                <p className="text-gray-600 text-sm mt-2">
                  {user.bio}
                </p>
              )}

            </div>

          </div>

          {/* ACTION BUTTONS */}
{!isOwnProfile && currentUser && (
  <div className="flex gap-3 mt-6">

    {/* FOLLOW / UNFOLLOW */}
    {isFollowing ? (
      <button
        onClick={handleUnfollow}
        disabled={followLoading}
        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-[#162A46] font-semibold hover:bg-gray-50 transition disabled:opacity-60"
      >
        <FiUserCheck size={18} />

        {followLoading
          ? "Please wait..."
          : "Following"}
      </button>
    ) : (
      <button
        onClick={handleFollow}
        disabled={followLoading}
        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#162A46] text-white font-semibold hover:bg-[#20395F] transition disabled:opacity-60"
      >
        <FiUserPlus size={18} />

        {followLoading
          ? "Please wait..."
          : "Follow"}
      </button>
    )}

    {/* MESSAGE BUTTON */}
    <button
      type="button"
      onClick={() => navigate(`/messages?user=${user._id}`)}
      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#162A46] bg-white text-[#162A46] font-semibold hover:bg-gray-50 transition"
    >
      <FiMessageCircle size={18} />
      <span className="hidden sm:inline">
        Message
      </span>
    </button>

    {/* SHARE */}
    <button
      onClick={handleShareProfile}
      className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
    >
      <FiShare2 size={18} />
    </button>

  </div>
)}

          {/* ======================================
              STATS
          ====================================== */}
          <div className="flex gap-8 mt-7">

            {/* POSTS */}
            <div className="text-center">
              <p className="font-bold text-lg">
                {posts.length}
              </p>

              <p className="text-sm text-gray-500">
                Posts
              </p>
            </div>

            {/* FOLLOWERS */}
            <button
              type="button"
              onClick={() =>
                openUserList("followers")
              }
              className="text-center hover:opacity-70 transition cursor-pointer"
            >
              <p className="font-bold text-lg">
                {followersCount}
              </p>

              <p className="text-sm text-gray-500">
                Followers
              </p>
            </button>

            {/* FOLLOWING */}
            <button
              type="button"
              onClick={() =>
                openUserList("following")
              }
              className="text-center hover:opacity-70 transition cursor-pointer"
            >
              <p className="font-bold text-lg">
                {followingCount}
              </p>

              <p className="text-sm text-gray-500">
                Following
              </p>
            </button>

          </div>

          {/* LOCATION */}
          <div className="mt-6 space-y-1 text-sm text-gray-500">

            {user.location && (
              <p>
                📍 {user.location}
              </p>
            )}

          </div>

        </div>

        {/* ======================================
            POSTS HEADER
        ====================================== */}
        <div className="bg-white border-b border-gray-200">

          <div className="flex justify-center py-4">
            <FiGrid size={21} />
          </div>

        </div>

        {/* ======================================
            POSTS GRID
        ====================================== */}
        {posts.length > 0 ? (

          <div className="grid grid-cols-3 gap-1 mt-1">

            {posts.map((post, index) => (

              <button
                key={post._id}
                type="button"
                onClick={() =>
                  openPost(post, index)
                }
                className="aspect-square bg-gray-100 overflow-hidden relative group cursor-pointer"
              >

                {post.mediaType === "video" ? (
                  <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={
                      post.caption || "Post"
                    }
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">

                  <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-5 text-white">

                    <span className="flex items-center gap-1">
                      <FiHeart
                        size={18}
                        fill="white"
                      />

                      {post.likeCount ||
                        post.likes?.length ||
                        0}
                    </span>

                    <span className="flex items-center gap-1">
                      <FiMessageCircle
                        size={18}
                      />

                      {post.comments?.length ||
                        0}
                    </span>

                  </div>

                </div>

                {post.mediaType === "video" && (
                  <div className="absolute top-2 right-2 text-white">
                    ▶
                  </div>
                )}

              </button>

            ))}

          </div>

        ) : (

          <div className="bg-white text-center py-16">

            <FiGrid
              size={35}
              className="mx-auto text-gray-300 mb-3"
            />

            <h3 className="font-semibold">
              No Posts Yet
            </h3>

            <p className="text-gray-500 text-sm mt-1">
              This user hasn't posted anything yet.
            </p>

          </div>

        )}

      </div>

      {/* ======================================
          FOLLOWERS / FOLLOWING MODAL
      ====================================== */}
      {showUsersModal && (

        <div
          className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center px-4"
          onClick={closeUsersModal}
        >

          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">

              <div>

                <h2 className="text-lg font-bold text-[#162A46]">
                  {userListType ===
                  "followers"
                    ? "Followers"
                    : "Following"}
                </h2>

                <p className="text-xs text-gray-500 mt-0.5">
                  {userList.length}{" "}
                  {userListType ===
                  "followers"
                    ? "followers"
                    : "following"}
                </p>

              </div>

              <button
                type="button"
                onClick={closeUsersModal}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
              >
                <FiX size={20} />
              </button>

            </div>

            {/* USERS */}
            <div className="max-h-[500px] overflow-y-auto">

              {userListLoading ? (

                <div className="min-h-[250px] flex flex-col items-center justify-center">

                  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#162A46] rounded-full animate-spin"></div>

                  <p className="text-sm text-gray-500 mt-3">
                    Loading...
                  </p>

                </div>

              ) : userList.length === 0 ? (

                <div className="min-h-[250px] flex flex-col items-center justify-center px-5 text-center">

                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">

                    <FiUser
                      size={28}
                      className="text-gray-400"
                    />

                  </div>

                  <h3 className="font-semibold text-[#162A46] mt-4">
                    {userListType ===
                    "followers"
                      ? "No followers yet"
                      : "Not following anyone"}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {userListType ===
                    "followers"
                      ? "This user doesn't have any followers yet."
                      : "This user isn't following anyone yet."}
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-gray-100">

                  {userList.map(
                    (person) => (

                      <div
                        key={person._id}
                        className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition"
                      >

                        {/* PROFILE IMAGE */}
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">

                          {person.profilePicture ||
                          person.profilePic ||
                          person.profileImage ? (

                            <img
                              src={
                                person.profilePicture ||
                                person.profilePic ||
                                person.profileImage
                              }
                              alt={
                                person.username ||
                                "User"
                              }
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />

                          ) : (

                            <div className="w-full h-full bg-[#162A46] text-white flex items-center justify-center">
                              <FiUser
                                size={19}
                              />
                            </div>

                          )}

                        </div>

                        {/* USER INFO */}
                        <button
                          type="button"
                          onClick={() =>
                            openUserProfile(
                              person._id
                            )
                          }
                          className="flex-1 min-w-0 text-left"
                        >

                          <p className="font-semibold text-sm text-[#162A46] truncate">
                            {person.username}
                          </p>

                          {person.name && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {person.name}
                            </p>
                          )}

                        </button>

                        {/* VIEW PROFILE */}
                        <button
                          type="button"
                          onClick={() =>
                            openUserProfile(
                              person._id
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-[#162A46] text-white text-xs font-semibold hover:bg-[#20395F] transition"
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

      {/* ======================================
          LARGE POST VIEWER
      ====================================== */}
      {selectedPost && (

        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center">

          {/* CLOSE */}
          <button
            onClick={closePost}
            className="absolute top-5 right-5 z-[220] w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
          >
            <FiX size={24} />
          </button>

          {/* PREVIOUS */}
          {selectedPostIndex > 0 && (
            <button
              onClick={previousPost}
              className="absolute left-4 md:left-8 z-[210] w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            >
              <FiChevronLeft size={25} />
            </button>
          )}

          {/* NEXT */}
          {selectedPostIndex <
            posts.length - 1 && (
            <button
              onClick={nextPost}
              className="absolute right-4 md:right-8 z-[210] w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            >
              <FiChevronRight size={25} />
            </button>
          )}

          {/* POST CONTAINER */}
          <div className="w-full max-w-6xl h-full md:h-[90vh] flex flex-col md:flex-row bg-white md:rounded-xl overflow-hidden">

            {/* MEDIA */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-[45vh] md:min-h-0">

              {selectedPost.mediaType ===
              "video" ? (
                <video
                  src={selectedPost.mediaUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={selectedPost.mediaUrl}
                  alt={
                    selectedPost.caption ||
                    "Post"
                  }
                  className="max-w-full max-h-full object-contain"
                />
              )}

            </div>

            {/* RIGHT SIDE */}
            <div className="w-full md:w-[380px] bg-white flex flex-col max-h-[55vh] md:max-h-full">

              {/* USER HEADER */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">

                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">

                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#162A46] text-white flex items-center justify-center">
                      <FiUser size={18} />
                    </div>
                  )}

                </div>

                <div className="flex-1">

                  <p className="font-semibold text-sm">
                    {user.username}
                  </p>

                  {user.name && (
                    <p className="text-xs text-gray-500">
                      {user.name}
                    </p>
                  )}

                </div>

                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <FiMoreHorizontal
                    size={20}
                  />
                </button>

              </div>

              {/* COMMENTS */}
              <div className="flex-1 overflow-y-auto px-4 py-4">

                {/* CAPTION */}
                {selectedPost.caption && (
                  <div className="flex gap-3 mb-5">

                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">

                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#162A46] text-white flex items-center justify-center">
                          <FiUser size={15} />
                        </div>
                      )}

                    </div>

                    <p className="text-sm">

                      <span className="font-semibold mr-2">
                        {user.username}
                      </span>

                      {selectedPost.caption}

                    </p>

                  </div>
                )}

                {/* COMMENTS */}
                {comments.length > 0 ? (
                  <div className="space-y-4">

                    {comments.map(
                      (comment) => (

                        <div
                          key={comment._id}
                          className="flex gap-3"
                        >

                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">

                            {comment.user
                              ?.profilePicture ? (
                              <img
                                src={
                                  comment.user
                                    .profilePicture
                                }
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <FiUser
                                  size={14}
                                  className="text-gray-500"
                                />
                              </div>
                            )}

                          </div>

                          <div>

                            <p className="text-sm">

                              <span className="font-semibold mr-2">
                                {comment.user
                                  ?.username ||
                                  "User"}
                              </span>

                              {comment.text ||
                                comment.comment}

                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>
                ) : (
                  <div className="text-center py-10">

                    <FiMessageCircle
                      size={30}
                      className="mx-auto text-gray-300 mb-3"
                    />

                    <p className="text-sm font-semibold">
                      No comments yet
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Be the first to comment.
                    </p>

                  </div>
                )}

              </div>

              {/* ACTIONS */}
              <div className="border-t border-gray-200">

                <div className="flex items-center justify-between px-4 py-3">

                  <div className="flex items-center gap-4">

                    {/* LIKE */}
                    <button
                      onClick={handleLike}
                      className="hover:scale-110 transition"
                    >
                      <FiHeart
                        size={24}
                        className={
                          liked
                            ? "text-red-500"
                            : "text-[#162A46]"
                        }
                        fill={
                          liked
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>

                    {/* COMMENT */}
                    <button
                      onClick={() => {
                        document
                          .getElementById(
                            "comment-input"
                          )
                          ?.focus();
                      }}
                    >
                      <FiMessageCircle
                        size={24}
                      />
                    </button>

                    {/* SHARE */}
                    <button
                      onClick={
                        handleSharePost
                      }
                    >
                      <FiShare2
                        size={23}
                      />
                    </button>

                  </div>

                  {/* SAVE */}
                  <button
                    onClick={handleSave}
                  >
                    <FiBookmark
                      size={24}
                      fill={
                        saved
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                </div>

                {/* LIKE COUNT */}
                <div className="px-4">

                  <p className="font-semibold text-sm">
                    {likeCount}{" "}
                    {likeCount === 1
                      ? "like"
                      : "likes"}
                  </p>

                </div>

                {/* COMMENT INPUT */}
                <div className="flex items-center gap-2 px-4 py-3">

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
                      if (
                        e.key === "Enter"
                      ) {
                        handleComment();
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 outline-none text-sm bg-gray-50 rounded-full px-4 py-2.5"
                  />

                  <button
                    onClick={handleComment}
                    disabled={
                      !commentText.trim()
                    }
                    className="w-10 h-10 rounded-full bg-[#162A46] text-white flex items-center justify-center disabled:opacity-40"
                  >
                    <FiSend size={17} />
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

export default UserProfile;