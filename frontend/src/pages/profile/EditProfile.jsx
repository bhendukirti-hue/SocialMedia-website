import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiArrowLeft, FiCamera, FiSave } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const navigate = useNavigate();

  // ==========================================
  // API URL
  // ==========================================

  const API_URL = "http://localhost:8808/api";

  // ==========================================
  // DEFAULT PROFILE PICTURE
  // ==========================================

  const defaultProfilePicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkoB0e7_DXKsiZ1Uu5lUCkOjN01NfE9689KEqAOmYNMQ&s=10";

  // ==========================================
  // STATES
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileFile, setProfileFile] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    bio: "",
    location: "",
    profilePicture: "",
  });

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ==========================================
  // FETCH PROFILE
  // ==========================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        const response = await axios.get(
          `${API_URL}/auth/verify-token`,
          {
            withCredentials: true,
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          }
        );

        console.log("Edit profile response:", response.data);

        const userData = response.data.user || response.data;

        setFormData({
          username: userData.username || "",
          name: userData.name || "",
          bio: userData.bio || "",
          location: userData.location || "",
          profilePicture:
            userData.profilePicture ||
            userData.profilePic ||
            "",
        });
      } catch (err) {
        console.error("Fetch profile error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // HANDLE PROFILE IMAGE
  // ==========================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Allow only images
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      return;
    }

    setError("");
    setSuccess("");

    setProfileFile(file);

    // Preview image
    const previewUrl = URL.createObjectURL(file);

    setFormData((previous) => ({
      ...previous,
      profilePicture: previewUrl,
    }));
  };

  // ==========================================
  // UPLOAD IMAGE TO CLOUDINARY
  // ==========================================

  const uploadProfileImage = async () => {
    if (!profileFile) {
      return formData.profilePicture;
    }

    try {
      const token = getToken();

      const imageData = new FormData();

      imageData.append("profileimage", profileFile);

      const response = await axios.post(
        `${API_URL}/auth/upload-profile`,
        imageData,
        {
          withCredentials: true,
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Cloudinary upload response:", response.data);

      /*
        Your backend may return the Cloudinary URL
        using different property names.
      */

      const imageUrl =
        response.data.url ||
        response.data.profilePicture ||
        response.data.profilePic ||
        response.data.imageUrl ||
        response.data.secure_url ||
        response.data.data?.url ||
        response.data.data?.secure_url;

      if (!imageUrl) {
        throw new Error(
          "Image uploaded but URL was not returned by backend."
        );
      }

      return imageUrl;
    } catch (err) {
      console.error("Image upload error:", err);

      throw new Error(
        err.response?.data?.message ||
          "Profile image upload failed."
      );
    }
  };

  // ==========================================
  // HANDLE SAVE PROFILE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = getToken();

      // ----------------------------------------
      // STEP 1: Upload image if selected
      // ----------------------------------------

      let profilePicture = formData.profilePicture;

      if (profileFile) {
        profilePicture = await uploadProfileImage();
      }

      // ----------------------------------------
      // STEP 2: Update profile
      // ----------------------------------------

      const updateData = {
        username: formData.username,
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        profilePicture: profilePicture,
      };

      console.log("Update profile data:", updateData);

      const response = await axios.put(
        `${API_URL}/auth/update-profile`,
        updateData,
        {
          withCredentials: true,
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      console.log("Update profile response:", response.data);

      setSuccess("Profile updated successfully!");

      // ----------------------------------------
      // STEP 3: Go back to Profile page
      // ----------------------------------------

      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (err) {
      console.error("Update profile error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#0B1F33]" />

          <p className="mt-4 text-sm text-gray-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-5">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-100"
          >
            <FiArrowLeft size={20} />
          </button>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
              Profile
            </p>

            <h1 className="mt-1 text-xl font-bold text-[#0B1F33]">
              Edit Profile
            </h1>
          </div>
        </div>
      </div>

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="mx-auto max-w-3xl px-5 py-8">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* ==================================
              PROFILE IMAGE
          ================================== */}

          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={
                  formData.profilePicture ||
                  defaultProfilePicture
                }
                alt="Profile"
                className="h-32 w-32 rounded-full object-cover ring-4 ring-gray-100"
                onError={(e) => {
                  e.currentTarget.src =
                    defaultProfilePicture;
                }}
              />

              <label
                htmlFor="profileImage"
                className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#0B1F33] text-white shadow-lg transition hover:bg-[#153B5A]"
              >
                <FiCamera size={18} />

                <input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <p className="mt-3 text-xs text-gray-400">
              JPG, PNG or WEBP · Maximum 5 MB
            </p>
          </div>

          {/* ==================================
              ERROR MESSAGE
          ================================== */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ==================================
              SUCCESS MESSAGE
          ================================== */}

          {success && (
            <div className="mt-6 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* ==================================
              FORM FIELDS
          ================================== */}

          <div className="mt-8 space-y-6">
            {/* USERNAME */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                Username
              </label>

              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#0B1F33] focus:ring-2 focus:ring-[#0B1F33]/10"
              />
            </div>

            {/* NAME */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#0B1F33] focus:ring-2 focus:ring-[#0B1F33]/10"
              />
            </div>

            {/* BIO */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                Bio
              </label>

              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell people about yourself..."
                rows={4}
                maxLength={250}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#0B1F33] focus:ring-2 focus:ring-[#0B1F33]/10"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {formData.bio.length}/250
              </p>
            </div>

            {/* LOCATION */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0B1F33]">
                Location
              </label>

              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter your location"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#0B1F33] focus:ring-2 focus:ring-[#0B1F33]/10"
              />
            </div>
          </div>

          {/* ==================================
              BUTTONS
          ================================== */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                navigate("/profile")
              }
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#153B5A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSave size={17} />

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditProfile;
