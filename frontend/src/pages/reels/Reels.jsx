import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiBookmark,
  FiArrowLeft,
  FiVolume2,
  FiVolumeX,
  FiMoreVertical,
} from "react-icons/fi";

const Reels = () => {
  const navigate = useNavigate();

  const API_URL = "http://localhost:8808/api";

  // ==========================================
  // STATE
  // ==========================================

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [likedReels, setLikedReels] = useState({});
  const [savedReels, setSavedReels] = useState({});

  const [muted, setMuted] = useState(true);

  const [commentOpen, setCommentOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [commentText, setCommentText] = useState("");

  const videoRefs = useRef({});

  // ==========================================
  // DEFAULT PROFILE IMAGE
  // ==========================================

  const defaultProfilePicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkoB0e7_DXKsiZ1Uu5lUCkOjN01NfE9689KEqAOmYNMQ&s=10";

  // ==========================================
  // FETCH REELS
  // ==========================================

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/posts/all-posts`,
        {
          withCredentials: true,
        }
      );

      console.log("ALL POSTS FOR REELS:", response.data);

      if (response.data?.success) {
        const allPosts = response.data.posts || [];

        // Only videos will appear in Reels
        const videoPosts = allPosts.filter(
          (post) =>
            post.mediaType === "video" &&
            post.mediaUrl
        );

        setReels(videoPosts);

        const likedState = {};
        const savedState = {};

        videoPosts.forEach((reel) => {
          likedState[reel._id] = Boolean(reel.likedByMe);
          savedState[reel._id] = false;
        });

        setLikedReels(likedState);
        setSavedReels(savedState);
      } else {
        setReels([]);
      }
    } catch (err) {
      console.error(
        "Failed to load reels:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load reels."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // AUTO PLAY / PAUSE
  // ==========================================

  useEffect(() => {
    if (!reels.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (entry.isIntersecting) {
            video
              .play()
              .catch(() => {
                console.log(
                  "Autoplay blocked by browser."
                );
              });
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.7,
      }
    );

    Object.values(videoRefs.current).forEach(
      (video) => {
        if (video) {
          observer.observe(video);
        }
      }
    );

    return () => {
      observer.disconnect();
    };
  }, [reels]);

  // ==========================================
  // LIKE
  // ==========================================

  const handleLike = async (reelId) => {
    try {
      const response = await axios.post(
        `${API_URL}/posts/${reelId}/like`,
        {},
        {
          withCredentials: true,
        }
      );

      console.log("REEL LIKE:", response.data);

      if (response.data?.success) {
        const liked = response.data.liked;
        const likeCount = response.data.likeCount;

        setLikedReels((current) => ({
          ...current,
          [reelId]: liked,
        }));

        setReels((current) =>
          current.map((reel) => {
            if (reel._id !== reelId) {
              return reel;
            }

            return {
              ...reel,
              likedByMe: liked,
              likeCount,
            };
          })
        );

        setSelectedReel((current) => {
          if (!current || current._id !== reelId) {
            return current;
          }

          return {
            ...current,
            likedByMe: liked,
            likeCount,
          };
        });
      }
    } catch (err) {
      console.error(
        "Like error:",
        err.response?.data || err.message
      );
    }
  };

  // ==========================================
  // SAVE
  // ==========================================

  const handleSave = (reelId) => {
    setSavedReels((current) => ({
      ...current,
      [reelId]: !current[reelId],
    }));
  };

  // ==========================================
  // SHARE
  // ==========================================

  const handleShare = async (reel) => {
    try {
      const shareUrl =
        `${window.location.origin}/reels/${reel._id}`;

      if (navigator.share) {
        await navigator.share({
          title:
            reel.user?.username || "Vlogify Reel",
          text:
            reel.caption ||
            "Check out this reel on Vlogify!",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          shareUrl
        );

        alert("Reel link copied!");
      }
    } catch (err) {
      console.log("Share cancelled.");
    }
  };

  // ==========================================
  // OPEN COMMENTS
  // ==========================================

  const openComments = (reel) => {
    setSelectedReel(reel);
    setCommentOpen(true);
  };

  // ==========================================
  // CLOSE COMMENTS
  // ==========================================

  const closeComments = () => {
    setCommentOpen(false);
    setSelectedReel(null);
    setCommentText("");
  };

  // ==========================================
  // POST COMMENT
  // ==========================================

  const handleComment = async () => {
    if (!commentText.trim() || !selectedReel) {
      return;
    }

    /*
      IMPORTANT:

      This frontend expects this backend endpoint:

      POST /api/posts/:postId/comment

      If your backend comment route has a different
      URL, change the URL below.
    */

    try {
      const response = await axios.post(
        `${API_URL}/posts/${selectedReel._id}/comment`,
        {
          text: commentText.trim(),
        },
        {
          withCredentials: true,
        }
      );

      console.log("COMMENT:", response.data);

      if (response.data?.success) {
        setCommentText("");

        alert("Comment added!");

        closeComments();
      }
    } catch (err) {
      console.error(
        "Comment error:",
        err.response?.data || err.message
      );

      alert(
        err.response?.data?.message ||
          "Comment feature is not connected yet."
      );
    }
  };

  // ==========================================
  // PROFILE CLICK
  // ==========================================

  const openUserProfile = (reel) => {
    if (reel?.user?._id) {
      navigate(`/profile/${reel.user._id}`);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "";

    const created = new Date(date);
    const now = new Date();

    const difference = Math.floor(
      (now - created) / 1000
    );

    if (difference < 60) {
      return `${difference}s`;
    }

    if (difference < 3600) {
      return `${Math.floor(
        difference / 60
      )}m`;
    }

    if (difference < 86400) {
      return `${Math.floor(
        difference / 3600
      )}h`;
    }

    if (difference < 604800) {
      return `${Math.floor(
        difference / 86400
      )}d`;
    }

    return created.toLocaleDateString();
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />

          <p className="mt-4 text-sm font-medium text-white">
            Loading Reels...
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
      <div className="flex h-screen items-center justify-center bg-black px-5">
        <div className="text-center">
          <p className="text-sm text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchReels}
            className="mt-5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black"
          >
            Try Again
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-3 block w-full text-sm text-white/70"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO REELS
  // ==========================================

  if (reels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black px-5">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <FiVideoIcon />
          </div>

          <h2 className="mt-5 text-xl font-bold text-white">
            No Reels Yet
          </h2>

          <p className="mt-2 text-sm text-white/60">
            Upload a video post to see it here.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/profile/createpost")
            }
            className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black"
          >
            Create Reel
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 block w-full text-sm text-white/70"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN REELS
  // ==========================================

  return (
    <div className="fixed inset-0 bg-black">
      {/* ==========================================
          TOP HEADER
      ========================================== */}

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-40">
        <div className="mx-auto flex max-w-[700px] items-center justify-between px-5 py-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <FiArrowLeft size={23} />
          </button>

          <h1 className="text-lg font-bold text-white">
            Reels
          </h1>

          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            {muted ? (
              <FiVolumeX size={21} />
            ) : (
              <FiVolume2 size={21} />
            )}
          </button>
        </div>
      </div>

      {/* ==========================================
          VERTICAL REELS CONTAINER
      ========================================== */}

      <div
        className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-none"
        style={{
          scrollbarWidth: "none",
        }}
      >
        {reels.map((reel) => {
          const isLiked =
            likedReels[reel._id] ??
            reel.likedByMe ??
            false;

          const isSaved =
            savedReels[reel._id] ?? false;

          const likeCount =
            reel.likeCount ??
            reel.likes?.length ??
            0;

          const profilePicture =
            reel.user?.profilePicture ||
            reel.user?.profilePic ||
            reel.user?.profileImage ||
            defaultProfilePicture;

          return (
            <section
              key={reel._id}
              className="relative h-screen w-full snap-start snap-always bg-black"
            >
              {/* ======================================
                  VIDEO
              ====================================== */}

              <video
                ref={(element) => {
                  videoRefs.current[reel._id] =
                    element;
                }}
                src={reel.mediaUrl}
                className="h-full w-full object-contain"
                muted={muted}
                loop
                playsInline
                preload="metadata"
                onClick={(e) => {
                  if (e.currentTarget.paused) {
                    e.currentTarget.play();
                  } else {
                    e.currentTarget.pause();
                  }
                }}
              />

              {/* ======================================
                  DARK GRADIENT
              ====================================== */}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

              {/* ======================================
                  USER INFO
              ====================================== */}

              <div className="absolute bottom-8 left-5 right-20 z-20">
                <button
                  type="button"
                  onClick={() =>
                    openUserProfile(reel)
                  }
                  className="flex items-center gap-3 text-left"
                >
                  <img
                    src={profilePicture}
                    alt={
                      reel.user?.username ||
                      "User"
                    }
                    className="h-11 w-11 rounded-full border-2 border-white object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        defaultProfilePicture;
                    }}
                  />

                  <div>
                    <p className="text-sm font-bold text-white">
                      {reel.user?.username ||
                        "Unknown User"}
                    </p>

                    <p className="text-xs text-white/60">
                      {formatDate(
                        reel.createdAt
                      )}
                    </p>
                  </div>
                </button>

                {/* CAPTION */}

                {reel.caption && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white">
                    {reel.caption}
                  </p>
                )}
              </div>

              {/* ======================================
                  ACTION BUTTONS
              ====================================== */}

              <div className="absolute bottom-8 right-4 z-30 flex flex-col items-center gap-5">
                {/* LIKE */}

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleLike(reel._id)
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition active:scale-90"
                  >
                    <FiHeart
                      size={29}
                      className={
                        isLiked
                          ? "text-red-500"
                          : "text-white"
                      }
                      fill={
                        isLiked
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  <span className="mt-1 text-xs font-semibold text-white">
                    {likeCount}
                  </span>
                </div>

                {/* COMMENT */}

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() =>
                      openComments(reel)
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition active:scale-90"
                  >
                    <FiMessageCircle
                      size={28}
                    />
                  </button>

                  <span className="mt-1 text-xs font-semibold text-white">
                    Comment
                  </span>
                </div>

                {/* SHARE */}

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleShare(reel)
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition active:scale-90"
                  >
                    <FiSend size={27} />
                  </button>

                  <span className="mt-1 text-xs font-semibold text-white">
                    Share
                  </span>
                </div>

                {/* SAVE */}

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleSave(reel._id)
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition active:scale-90"
                  >
                    <FiBookmark
                      size={27}
                      fill={
                        isSaved
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  <span className="mt-1 text-xs font-semibold text-white">
                    {isSaved
                      ? "Saved"
                      : "Save"}
                  </span>
                </div>

                {/* MORE */}

                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur"
                >
                  <FiMoreVertical size={25} />
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* ==========================================
          COMMENT MODAL
      ========================================== */}

      {commentOpen && selectedReel && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeComments}
        >
          <div
            className="w-full max-w-[650px] rounded-t-3xl bg-white"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold text-[#172033]">
                Comments
              </h2>

              <button
                type="button"
                onClick={closeComments}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700"
              >
                ×
              </button>
            </div>

            {/* COMMENT AREA */}

            <div className="min-h-[180px] px-5 py-6">
              <p className="text-center text-sm text-gray-400">
                Comments will appear here.
              </p>
            </div>

            {/* INPUT */}

            <div className="flex items-center gap-3 border-t border-gray-200 p-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) =>
                  setCommentText(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleComment();
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#162A46]/10"
              />

              <button
                type="button"
                onClick={handleComment}
                className="rounded-full bg-[#162A46] px-5 py-3 text-sm font-semibold text-white"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SMALL VIDEO ICON COMPONENT
// ==========================================

const FiVideoIcon = () => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-white"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect
        x="1"
        y="5"
        width="15"
        height="14"
        rx="2"
        ry="2"
      />
    </svg>
  );
};

export default Reels;
