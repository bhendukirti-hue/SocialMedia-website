import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiImage,
  FiVideo,
  FiMapPin,
  FiX,
  FiCheck,
  FiLoader,
  FiUploadCloud,
  FiUser,
  FiSmile,
} from "react-icons/fi";

const CreatePost = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ==========================================
  // API
  // ==========================================

  const API_URL = "http://localhost:8808/api";

  // ==========================================
  // STATE
  // ==========================================

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mediaType, setMediaType] = useState("");

  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");

  const [currentUser, setCurrentUser] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // DEFAULT PROFILE IMAGE
  // ==========================================

  const defaultProfilePicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkoB0e7_DXKsiZ1Uu5lUCkOjN01NfE9689KEqAOmYNMQ&s=10";

  // ==========================================
  // PROFILE IMAGE
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
      setLoadingUser(true);

      const response = await axios.get(
        `${API_URL}/auth/verify-token`,
        {
          withCredentials: true,
        }
      );

      console.log("CURRENT USER:", response.data);

      if (response.data?.success) {
        setCurrentUser(
          response.data.user ||
            response.data.data?.user ||
            response.data.data ||
            null
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error.response?.data || error.message
      );
    } finally {
      setLoadingUser(false);
    }
  };

  // ==========================================
  // SELECT MEDIA
  // ==========================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    // ==========================================
    // ALLOWED FILE TYPES
    // ==========================================

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-matroska",
    ];

    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    // ==========================================
    // INVALID TYPE
    // ==========================================

    if (!isImage && !isVideo) {
      setError(
        "Please select a JPG, PNG, WEBP image or MP4, WEBM video."
      );

      event.target.value = "";
      return;
    }

    // ==========================================
    // FILE SIZE
    // ==========================================

    const maxSize = isVideo
      ? 100 * 1024 * 1024
      : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        isVideo
          ? "Video size must be less than 100 MB."
          : "Image size must be less than 10 MB."
      );

      event.target.value = "";
      return;
    }

    // ==========================================
    // CREATE PREVIEW
    // ==========================================

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setMediaType(isVideo ? "video" : "image");
  };

  // ==========================================
  // REMOVE MEDIA
  // ==========================================

  const removeMedia = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setMediaType("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================
  // OPEN FILE SELECTOR
  // ==========================================

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // ==========================================
  // DRAG & DROP
  // ==========================================

  const handleDrop = (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-matroska",
    ];

    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      setError(
        "Please select a valid image or video."
      );
      return;
    }

    const maxSize = isVideo
      ? 100 * 1024 * 1024
      : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        isVideo
          ? "Video size must be less than 100 MB."
          : "Image size must be less than 10 MB."
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setMediaType(isVideo ? "video" : "image");
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    const mb = bytes / (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }

    return `${Math.round(bytes / 1024)} KB`;
  };

  // ==========================================
  // SUBMIT POST
  // ==========================================

  const handleCreatePost = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!selectedFile) {
      setError("Please select an image or video first.");
      return;
    }

    if (!caption.trim() && !selectedFile) {
      setError("Please add something to your post.");
      return;
    }

    try {
      setUploading(true);

      // ==========================================
      // FORM DATA
      // ==========================================

      const formData = new FormData();

      formData.append("media", selectedFile);
      formData.append("caption", caption.trim());
      formData.append("location", location.trim());
      formData.append("mediaType", mediaType);

      console.log("Uploading post...");
      console.log("File:", selectedFile);
      console.log("Media Type:", mediaType);
      console.log("Caption:", caption);
      console.log("Location:", location);

      // ==========================================
      // SEND TO BACKEND
      // ==========================================

      const response = await axios.post(
        `${API_URL}/posts`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("CREATE POST RESPONSE:", response.data);

      if (response.data?.success) {
        setSuccess("Post shared successfully!");

        // ==========================================
        // REDIRECT TO HOME
        // ==========================================

        setTimeout(() => {
          navigate("/");
        }, 800);
      } else {
        setError(
          response.data?.message ||
            "Unable to create post."
        );
      }
    } catch (error) {
      console.error(
        "CREATE POST ERROR:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Something went wrong while creating your post."
      );
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // CLEAN PREVIEW URL
  // ==========================================

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ==========================================
  // LOADING USER
  // ==========================================

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#162A46]" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033]">

      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-[70px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* BACK */}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#162A46] shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <FiArrowLeft size={22} />
          </button>

          {/* TITLE */}

          <h1 className="text-xl font-bold text-[#162A46] sm:text-2xl">
            Create new post
          </h1>

          {/* SHARE */}

          <button
            type="submit"
            form="create-post-form"
            disabled={uploading || !selectedFile}
            className="hidden rounded-xl bg-[#162A46] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#203B60] disabled:cursor-not-allowed disabled:opacity-40 sm:block"
          >
            {uploading ? "Sharing..." : "Share"}
          </button>

          {/* MOBILE CHECK */}

          <button
            type="submit"
            form="create-post-form"
            disabled={uploading || !selectedFile}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#162A46] text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:hidden"
          >
            {uploading ? (
              <FiLoader
                size={20}
                className="animate-spin"
              />
            ) : (
              <FiCheck size={21} />
            )}
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-12 sm:px-6 sm:py-8 lg:px-8">

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mx-auto mb-5 max-w-5xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mx-auto mb-5 max-w-5xl rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-600">
            {success}
          </div>
        )}

        {/* =================================================
            CREATE POST CARD
        ================================================== */}

        <form
          id="create-post-form"
          onSubmit={handleCreatePost}
          className="mx-auto overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
        >

          <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">

            {/* =================================================
                LEFT — MEDIA
            ================================================== */}

            <div className="border-b border-gray-200 lg:border-b-0 lg:border-r">

              <div className="flex h-full min-h-[450px] flex-col">

                {/* MEDIA HEADER */}

                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">

                  <div>
                    <h2 className="text-base font-bold text-[#172033]">
                      Add photo or video
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      Share your moment with Vlogify
                    </p>
                  </div>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <FiX size={18} />
                    </button>
                  )}

                </div>

                {/* =================================================
                    MEDIA PREVIEW
                ================================================== */}

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="relative flex flex-1 items-center justify-center bg-[#F4F6F8] p-4 sm:p-8"
                >

                  {!selectedFile ? (
                    <div className="w-full max-w-xl">

                      <button
                        type="button"
                        onClick={openFileSelector}
                        className="group flex min-h-[430px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white px-6 text-center transition hover:border-[#162A46] hover:bg-gray-50"
                      >

                        {/* ICON */}

                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF2F7] text-[#162A46] transition group-hover:scale-105">

                          <FiUploadCloud size={36} />

                        </div>

                        <h3 className="text-xl font-bold text-[#172033]">
                          Drag photos and videos here
                        </h3>

                        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                          Or choose a photo or video from
                          your device to create a new post.
                        </p>

                        <span className="mt-6 inline-flex rounded-xl bg-[#162A46] px-6 py-3 text-sm font-semibold text-white shadow-sm transition group-hover:bg-[#203B60]">
                          Select from computer
                        </span>

                        <div className="mt-6 flex items-center gap-5 text-xs text-gray-400">

                          <span className="flex items-center gap-1.5">
                            <FiImage size={15} />
                            Images
                          </span>

                          <span className="h-1 w-1 rounded-full bg-gray-300" />

                          <span className="flex items-center gap-1.5">
                            <FiVideo size={15} />
                            Videos
                          </span>

                        </div>

                      </button>

                    </div>
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center">

                      <div className="relative h-full max-h-[620px] w-full overflow-hidden rounded-2xl bg-black shadow-xl">

                        {/* IMAGE */}

                        {mediaType === "image" && (
                          <img
                            src={previewUrl}
                            alt="Post preview"
                            className="h-full max-h-[620px] w-full object-contain"
                          />
                        )}

                        {/* VIDEO */}

                        {mediaType === "video" && (
                          <video
                            src={previewUrl}
                            controls
                            playsInline
                            className="h-full max-h-[620px] w-full object-contain"
                          />
                        )}

                        {/* MEDIA TYPE */}

                        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur">

                          {mediaType === "video" ? (
                            <>
                              <FiVideo size={14} />
                              Video
                            </>
                          ) : (
                            <>
                              <FiImage size={14} />
                              Photo
                            </>
                          )}

                        </div>

                        {/* REMOVE */}

                        <button
                          type="button"
                          onClick={removeMedia}
                          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-red-500"
                        >
                          <FiX size={20} />
                        </button>

                      </div>

                    </div>
                  )}

                  {/* FILE INPUT */}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                </div>

                {/* MEDIA INFO */}

                {selectedFile && (
                  <div className="flex items-center justify-between border-t border-gray-100 bg-white px-5 py-3 sm:px-6">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2F7] text-[#162A46]">

                        {mediaType === "video" ? (
                          <FiVideo size={18} />
                        ) : (
                          <FiImage size={18} />
                        )}

                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-gray-700">
                          {selectedFile.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          {formatFileSize(
                            selectedFile.size
                          )}
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={openFileSelector}
                      className="shrink-0 text-xs font-semibold text-[#162A46] hover:underline"
                    >
                      Change
                    </button>

                  </div>
                )}

              </div>

            </div>

            {/* =================================================
                RIGHT — POST DETAILS
            ================================================== */}

            <div className="flex flex-col bg-white">

              {/* USER */}

              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">

                <div className="flex items-center gap-3">

                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-100"
                    onError={(e) => {
                      e.currentTarget.src =
                        defaultProfilePicture;
                    }}
                  />

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-[#172033]">
                      {currentUser?.username ||
                        "Your account"}
                    </p>

                    <p className="text-xs text-gray-400">
                      Create a new post
                    </p>

                  </div>

                </div>

              </div>

              {/* CAPTION */}

              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">

                <div className="mb-3 flex items-center justify-between">

                  <label
                    htmlFor="caption"
                    className="text-sm font-bold text-[#172033]"
                  >
                    Caption
                  </label>

                  <span className="text-xs text-gray-400">
                    {caption.length}/2,200
                  </span>

                </div>

                <div className="relative">

                  <textarea
                    id="caption"
                    value={caption}
                    maxLength={2200}
                    onChange={(e) =>
                      setCaption(e.target.value)
                    }
                    placeholder="Write a caption..."
                    rows={7}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-[#FAFBFC] px-4 py-4 pr-11 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#9AA8BA] focus:bg-white focus:ring-4 focus:ring-[#162A46]/5"
                  />

                  <FiSmile
                    size={20}
                    className="absolute right-4 top-4 text-gray-300"
                  />

                </div>

              </div>

              {/* LOCATION */}

              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">

                <label
                  htmlFor="location"
                  className="mb-3 block text-sm font-bold text-[#172033]"
                >
                  Location
                </label>

                <div className="flex items-center rounded-2xl border border-gray-200 bg-[#FAFBFC] px-4 transition focus-within:border-[#9AA8BA] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#162A46]/5">

                  <FiMapPin
                    size={19}
                    className="shrink-0 text-gray-400"
                  />

                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) =>
                      setLocation(e.target.value)
                    }
                    placeholder="Add location"
                    className="w-full bg-transparent px-3 py-3.5 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  />

                </div>

              </div>

              {/* POST TIPS */}

              <div className="flex-1 px-5 py-5 sm:px-7">

                <div className="rounded-2xl bg-[#F6F8FA] p-5">

                  <h3 className="text-sm font-bold text-[#172033]">
                    Create a great post ✨
                  </h3>

                  <ul className="mt-3 space-y-2 text-xs leading-5 text-gray-500">

                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#162A46]" />
                      Use a clear and attractive photo or video.
                    </li>

                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#162A46]" />
                      Add a caption to tell your story.
                    </li>

                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#162A46]" />
                      Add a location when it is relevant.
                    </li>

                  </ul>

                </div>

              </div>

              {/* DESKTOP SHARE */}

              <div className="border-t border-gray-100 p-5 sm:p-7">

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#162A46] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#203B60] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >

                  {uploading ? (
                    <>
                      <FiLoader
                        size={19}
                        className="animate-spin"
                      />
                      Sharing your post...
                    </>
                  ) : (
                    <>
                      <FiUploadCloud size={19} />
                      Share post
                    </>
                  )}

                </button>

                {!selectedFile && (
                  <p className="mt-3 text-center text-xs text-gray-400">
                    Select a photo or video to continue
                  </p>
                )}

              </div>

            </div>

          </div>

        </form>

      </main>

    </div>
  );
};

export default CreatePost;