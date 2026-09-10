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
      setError("Please select a valid image or video.");
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <FiLoader
          size={28}
          className="animate-spin text-[#162A46]"
        />
      </div>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">

        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
          >
            <FiArrowLeft size={20} />
          </button>

          <h1 className="text-lg font-semibold text-gray-900">
            Create Post
          </h1>

          <button
            type="submit"
            form="create-post-form"
            disabled={uploading || !selectedFile}
            className="hidden rounded-lg bg-[#162A46] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#203B60] disabled:cursor-not-allowed disabled:opacity-40 sm:block"
          >
            {uploading ? "Sharing..." : "Share"}
          </button>

          <button
            type="submit"
            form="create-post-form"
            disabled={uploading || !selectedFile}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#162A46] text-white disabled:cursor-not-allowed disabled:opacity-40 sm:hidden"
          >
            {uploading ? (
              <FiLoader
                size={18}
                className="animate-spin"
              />
            ) : (
              <FiCheck size={19} />
            )}
          </button>

        </div>

      </header>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="mx-auto max-w-5xl px-4 py-6">

        {/* ==========================================
            MESSAGES
        ========================================== */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-600">
            {success}
          </div>
        )}

        {/* ==========================================
            FORM
        ========================================== */}

        <form
          id="create-post-form"
          onSubmit={handleCreatePost}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >

          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* ==========================================
                MEDIA SECTION
            ========================================== */}

            <div className="border-b border-gray-200 lg:border-b-0 lg:border-r">

              <div className="border-b border-gray-100 px-5 py-4">

                <h2 className="text-sm font-semibold text-gray-900">
                  Photo or video
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Upload a photo or video to share
                </p>

              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="flex min-h-[420px] items-center justify-center bg-gray-50 p-5"
              >

                {!selectedFile ? (
                  <button
                    type="button"
                    onClick={openFileSelector}
                    className="flex min-h-[350px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-5 text-center transition hover:border-[#162A46] hover:bg-gray-50"
                  >

                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-[#162A46]">
                      <FiUploadCloud size={27} />
                    </div>

                    <h3 className="text-base font-semibold text-gray-800">
                      Upload media
                    </h3>

                    <p className="mt-2 max-w-xs text-sm text-gray-400">
                      Drag and drop your photo or video here,
                      or select a file from your device.
                    </p>

                    <span className="mt-5 rounded-lg bg-[#162A46] px-5 py-2.5 text-sm font-medium text-white">
                      Select file
                    </span>

                    <div className="mt-5 flex items-center gap-4 text-xs text-gray-400">

                      <span className="flex items-center gap-1.5">
                        <FiImage size={14} />
                        Photos
                      </span>

                      <span className="h-1 w-1 rounded-full bg-gray-300" />

                      <span className="flex items-center gap-1.5">
                        <FiVideo size={14} />
                        Videos
                      </span>

                    </div>

                  </button>
                ) : (
                  <div className="relative flex h-full w-full items-center justify-center">

                    <div className="relative w-full overflow-hidden rounded-xl bg-black">

                      {mediaType === "image" && (
                        <img
                          src={previewUrl}
                          alt="Post preview"
                          className="max-h-[500px] w-full object-contain"
                        />
                      )}

                      {mediaType === "video" && (
                        <video
                          src={previewUrl}
                          controls
                          playsInline
                          className="max-h-[500px] w-full object-contain"
                        />
                      )}

                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                        {mediaType === "video" ? (
                          <>
                            <FiVideo size={13} />
                            Video
                          </>
                        ) : (
                          <>
                            <FiImage size={13} />
                            Photo
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={removeMedia}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-500"
                      >
                        <FiX size={17} />
                      </button>

                    </div>

                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

              </div>

              {/* FILE INFO */}

              {selectedFile && (
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[#162A46]">
                      {mediaType === "video" ? (
                        <FiVideo size={16} />
                      ) : (
                        <FiImage size={16} />
                      )}
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-xs font-medium text-gray-700">
                        {selectedFile.name}
                      </p>

                      <p className="text-[11px] text-gray-400">
                        {formatFileSize(selectedFile.size)}
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={openFileSelector}
                    className="text-xs font-medium text-[#162A46] hover:underline"
                  >
                    Change
                  </button>

                </div>
              )}

            </div>

            {/* ==========================================
                DETAILS SECTION
            ========================================== */}

            <div>

              {/* USER */}

              <div className="border-b border-gray-100 px-5 py-4">

                <div className="flex items-center gap-3">

                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        defaultProfilePicture;
                    }}
                  />

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-gray-800">
                      {currentUser?.username || "Your account"}
                    </p>

                    <p className="text-xs text-gray-400">
                      New post
                    </p>

                  </div>

                </div>

              </div>

              {/* CAPTION */}

              <div className="border-b border-gray-100 px-5 py-5">

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="caption"
                    className="text-sm font-semibold text-gray-800"
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
                    placeholder="Write something about your post..."
                    rows={6}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                  />

                  <FiSmile
                    size={18}
                    className="absolute right-3 top-3 text-gray-300"
                  />

                </div>

              </div>

              {/* LOCATION */}

              <div className="border-b border-gray-100 px-5 py-5">

                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Location
                </label>

                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">

                  <FiMapPin
                    size={18}
                    className="shrink-0 text-gray-400"
                  />

                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) =>
                      setLocation(e.target.value)
                    }
                    placeholder="Add a location"
                    className="w-full bg-transparent px-3 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  />

                </div>

              </div>

              {/* SHARE */}

              <div className="p-5">

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#162A46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#203B60] disabled:cursor-not-allowed disabled:opacity-40"
                >

                  {uploading ? (
                    <>
                      <FiLoader
                        size={18}
                        className="animate-spin"
                      />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <FiUploadCloud size={18} />
                      Share post
                    </>
                  )}

                </button>

                {!selectedFile && (
                  <p className="mt-2 text-center text-xs text-gray-400">
                    Select a photo or video first
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
