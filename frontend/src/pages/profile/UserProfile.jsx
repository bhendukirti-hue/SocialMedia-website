import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiGrid,
  FiHeart,
} from "react-icons/fi";

const API_URL = "http://localhost:8808/api";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

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

      setUser(response.data.user || null);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error("Fetch user profile error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#162A46] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-5">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FiUser size={35} className="text-gray-400" />
        </div>

        <h2 className="text-xl font-bold text-[#162A46]">
          User Not Found
        </h2>

        <p className="text-gray-500 mt-2 text-center">
          {error || "This user profile does not exist."}
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#162A46]">
      {/* Header */}
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

      {/* Profile */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white px-5 py-8 border-b border-gray-200">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
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

            {/* User Info */}
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

          {/* Stats */}
          <div className="flex gap-8 mt-7">
            <div className="text-center">
              <p className="font-bold text-lg">
                {posts.length}
              </p>
              <p className="text-sm text-gray-500">
                Posts
              </p>
            </div>

            <div className="text-center">
              <p className="font-bold text-lg">
                {user.followers?.length || 0}
              </p>
              <p className="text-sm text-gray-500">
                Followers
              </p>
            </div>

            <div className="text-center">
              <p className="font-bold text-lg">
                {user.following?.length || 0}
              </p>
              <p className="text-sm text-gray-500">
                Following
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 space-y-1 text-sm text-gray-500">
            {user.location && (
              <p>
                📍 {user.location}
              </p>
            )}

            <p className="text-xs">
              User ID: {user._id}
            </p>
          </div>
        </div>

        {/* Posts Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex justify-center py-4">
            <FiGrid size={21} />
          </div>
        </div>

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 mt-1">
            {posts.map((post) => (
              <div
                key={post._id}
                className="aspect-square bg-gray-100 overflow-hidden relative group"
              >
                {post.mediaType === "video" ? (
                  <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption || "Post"}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Like count */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                  <FiHeart size={14} />
                  {post.likeCount || post.likes?.length || 0}
                </div>
              </div>
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
    </div>
  );
};

export default UserProfile;