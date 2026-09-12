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
  FiX,
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
  const [comments, setComments] = useState([]);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

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
          likedState[reel._id] = Boolean(
            reel.likedByMe
          );

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
            video.play().catch(() => {
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
          if (
            !current ||
            current._id !== reelId
          ) {
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
  // FETCH COMMENTS
  // ==========================================

  const fetchComments = async (reelId) => {
    try {
      setCommentsLoading(true);

      const response = await axios.get(
        `${API_URL}/posts/${reelId}/comments`,
        {
          withCredentials: true,
        }
      );

      console.log(
        "REEL COMMENTS:",
        response.data
      );

      if (response.data?.success) {
        const fetchedComments =
          response.data.comments || [];

        setComments(fetchedComments);

        // Keep comments synchronized
        // with selected reel
        setSelectedReel((current) =>
          current
            ? {
                ...current,
                comments: fetchedComments,
                commentCount:
                  fetchedComments.length,
              }
            : current
        );

        // Keep comments synchronized
        // with reels list
        setReels((current) =>
          current.map((reel) =>
            reel._id === reelId
              ? {
                  ...reel,
                  comments: fetchedComments,
                  commentCount:
                    fetchedComments.length,
                }
              : reel
          )
        );
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error(
        "Fetch comments error:",
        err.response?.data || err.message
      );

      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // ==========================================
  // OPEN COMMENTS
  // ==========================================

  const openComments = async (reel) => {
    setSelectedReel(reel);
    setCommentText("");
    setCommentOpen(true);

    // Clear old comments first
    setComments([]);

    // Fetch latest comments from database
    await fetchComments(reel._id);
  };

  // ==========================================
  // CLOSE COMMENTS
  // ==========================================

  const closeComments = () => {
    setCommentOpen(false);
    setSelectedReel(null);
    setCommentText("");
    setComments([]);
    setCommentSubmitting(false);
    setCommentsLoading(false);
  };

  // ==========================================
  // POST COMMENT
  // ==========================================

  const handleComment = async () => {
    const text = commentText.trim();

    if (
      !text ||
      !selectedReel ||
      commentSubmitting
    ) {
      return;
    }

    try {
      setCommentSubmitting(true);

      const response = await axios.post(
        `${API_URL}/posts/${selectedReel._id}/comment`,
        {
          text,
        },
        {
          withCredentials: true,
        }
      );

      console.log("COMMENT:", response.data);

      if (response.data?.success) {
        const returnedComment =
          response.data.comment ||
          response.data.data?.comment ||
          response.data.data ||
          null;

        const newComment =
          returnedComment || {
            _id: `local-${Date.now()}`,
            text,
            user: {
              username: "You",
              profilePicture:
                defaultProfilePicture,
            },
          };

        // Show new comment immediately
        setComments((current) => [
          ...current,
          newComment,
        ]);

        // Update selected reel
        setSelectedReel((current) =>
          current
            ? {
                ...current,
                comments: [
                  ...(current.comments || []),
                  newComment,
                ],
                commentCount:
                  (current.commentCount || 0) + 1,
              }
            : current
        );

        // Update reel in list
        setReels((current) =>
          current.map((reel) => {
            if (
              reel._id !== selectedReel._id
            ) {
              return reel;
            }

            const updatedComments = [
              ...(reel.comments || []),
              newComment,
            ];

            return {
              ...reel,
              comments: updatedComments,
              commentCount:
                updatedComments.length,
            };
          })
        );

        setCommentText("");
      }
    } catch (err) {
      console.error(
        "Comment error:",
        err.response?.data || err.message
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  // ==========================================
  // PROFILE CLICK
  // ==========================================

  const openUserProfile = (reel) => {
    if (reel?.user?._id) {
      navigate(
        `/profile/${reel.user._id}`
      );
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
      <div className="flex h-screen items-center justify-center bg-[#07111F]">
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
      <div className="flex h-screen items-center justify-center bg-[#07111F] px-5">
        <div className="text-center">
          <p className="text-sm text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchReels}
            className="mt-5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0F2747] shadow-lg transition hover:bg-slate-100"
          >
            Try Again
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-3 block w-full text-sm text-white/75"
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
      <div className="flex h-screen items-center justify-center bg-[#07111F] px-5">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <FiVideoIcon />
          </div>

          <h2 className="mt-5 text-xl font-bold text-white">
            No Reels Yet
          </h2>

          <p className="mt-2 text-sm text-white/65">
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
            className="mt-4 block w-full text-sm text-white/75"
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
    <div className="fixed inset-0 bg-[#07111F]">

      {/* ==========================================
          TOP HEADER
      ========================================== */}

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-40">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-5 py-5">

          <button
            type="button"
            onClick={() => navigate("/")}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#07111F]/40 text-white backdrop-blur transition hover:bg-[#07111F]/60"
          >
            <FiArrowLeft size={23} />
          </button>

          <h1 className="text-base font-semibold tracking-wide text-white">
            Reels
          </h1>

          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#07111F]/40 text-white backdrop-blur transition hover:bg-[#07111F]/60"
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

          const commentCount =
            reel.commentCount ??
            reel.comments?.length ??
            0;

          const profilePicture =
            reel.user?.profilePicture ||
            reel.user?.profilePic ||
            reel.user?.profileImage ||
            defaultProfilePicture;

          return (
            <section
              key={reel._id}
              className="relative h-screen w-full snap-start snap-always bg-[#07111F]"
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
                    className="h-11 w-11 rounded-full border-2 border-white/80 object-cover"
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

                    <p className="text-xs text-white/65">
                      {formatDate(
                        reel.createdAt
                      )}
                    </p>
                  </div>
                </button>

                {reel.caption && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white">
                    {reel.caption}
                  </p>
                )}

              </div>

              {/* ======================================
                  ACTION BUTTONS
              ====================================== */}

              <div className="absolute bottom-8 right-4 z-30 flex flex-col items-center gap-4">

                {/* LIKE */}

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleLike(reel._id)
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07111F]/30 text-white backdrop-blur transition active:scale-90"
                  >
                    <FiHeart
                      size={29}
                      className={
                        isLiked
                          ? "text-rose-400"
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
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07111F]/30 text-white backdrop-blur transition active:scale-90"
                  >
                    <FiMessageCircle
                      size={28}
                    />
                  </button>

                  <span className="mt-1 text-xs font-semibold text-white">
                    {commentCount}
                  </span>
                </div>

                {/* SHARE */}

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleShare(reel)
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07111F]/30 text-white backdrop-blur transition active:scale-90"
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
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07111F]/30 text-white backdrop-blur transition active:scale-90"
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
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07111F]/30 text-white backdrop-blur"
                >
                  <FiMoreVertical size={25} />
                </button>

              </div>
            </section>
          );
        })}
      </div>

      {/* ==========================================
          COMMENT PANEL
      ========================================== */}

      {commentOpen && selectedReel && (
        <div
          className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[2px]"
          onClick={closeComments}
        >

          {/* ======================================
              RIGHT SIDE COMMENT PANEL
          ====================================== */}

          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.20)] sm:w-[440px]"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* ==================================
                COMMENT HEADER
            ================================== */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-[#0F2747]">
                  Comments
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {comments.length}{" "}
                  {comments.length === 1
                    ? "comment"
                    : "comments"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeComments}
                aria-label="Close comments"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#0F2747]"
              >
                <FiX size={21} />
              </button>

            </div>

            {/* ==================================
                REEL PREVIEW
            ================================== */}

            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">

              <div className="flex items-center gap-3">

                <img
                  src={
                    selectedReel.user
                      ?.profilePicture ||
                    selectedReel.user
                      ?.profilePic ||
                    selectedReel.user
                      ?.profileImage ||
                    defaultProfilePicture
                  }
                  alt={
                    selectedReel.user
                      ?.username || "User"
                  }
                  className="h-9 w-9 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      defaultProfilePicture;
                  }}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0F2747]">
                    {selectedReel.user
                      ?.username ||
                      "Unknown User"}
                  </p>

                  {selectedReel.caption && (
                    <p className="truncate text-xs text-slate-500">
                      {selectedReel.caption}
                    </p>
                  )}
                </div>

              </div>

            </div>

            {/* ==================================
                COMMENTS LIST
            ================================== */}

            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5">

              {commentsLoading ? (
                <div className="flex h-full min-h-[300px] items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-[#0F2747]" />

                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Loading comments...
                    </p>

                  </div>

                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-5">

                  {comments.map(
                    (comment, index) => {
                      const commentUser =
                        comment.user ||
                        comment.author ||
                        {};

                      const commentImage =
                        commentUser.profilePicture ||
                        commentUser.profilePic ||
                        commentUser.profileImage ||
                        defaultProfilePicture;

                      return (
                        <div
                          key={
                            comment._id ||
                            `comment-${index}`
                          }
                          className="flex gap-3"
                        >

                          <img
                            src={commentImage}
                            alt={
                              commentUser.username ||
                              "User"
                            }
                            className="h-10 w-10 flex-shrink-0 rounded-full border border-slate-200 object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                defaultProfilePicture;
                            }}
                          />

                          <div className="min-w-0 flex-1">

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">

                              <p className="text-sm font-semibold text-[#0F2747]">
                                {commentUser.username ||
                                  "You"}
                              </p>

                              <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                                {comment.text ||
                                  comment.comment ||
                                  ""}
                              </p>

                            </div>

                            {comment.createdAt && (
                              <p className="mt-1 px-2 text-[11px] text-slate-400">
                                {formatDate(
                                  comment.createdAt
                                )}
                              </p>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-[#0F2747]">
                    <FiMessageCircle
                      size={28}
                    />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-[#0F2747]">
                    No comments yet
                  </h3>

                  <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">
                    Be the first to share your thoughts on this reel.
                  </p>

                </div>
              )}

            </div>

            {/* ==================================
                COMMENT INPUT
            ================================== */}

            <div className="border-t border-slate-200 bg-white p-4">

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 pl-4 transition focus-within:border-[#0F2747] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0F2747]/10">

                <input
                  type="text"
                  value={commentText}
                  onChange={(e) =>
                    setCommentText(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  placeholder="Write a comment..."
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={handleComment}
                  disabled={
                    !commentText.trim() ||
                    commentSubmitting
                  }
                  aria-label="Post comment"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0F2747] text-white shadow-sm transition hover:bg-[#173B68] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiSend size={17} />
                </button>

              </div>

              <p className="mt-2 px-1 text-[11px] text-slate-400">
                Press Enter to post
              </p>

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
