import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiArrowLeft,
  FiUser,
  FiX,
} from "react-icons/fi";

const API_URL = "http://localhost:8808/api";

const Search = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (search.trim()) {
        searchUsers(search.trim());
      } else {
        setUsers([]);
        setSearched(false);
        setError("");
      }
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [search]);

  const searchUsers = async (value) => {
    try {
      setLoading(true);
      setError("");
      setSearched(true);

      const response = await axios.get(
        `${API_URL}/users/search`,
        {
          params: {
            search: value,
          },
          withCredentials: true,
        }
      );

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Search users error:", error);

      setUsers([]);

      setError(
        error.response?.data?.message ||
          "Failed to search users."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setUsers([]);
    setSearched(false);
    setError("");
  };

  const openProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#162A46]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <FiArrowLeft size={22} />
          </button>

          <h1 className="text-xl font-bold">
            Search
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Search Box */}
        <div className="relative">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={20}
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or user ID..."
            className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-12 pr-12 outline-none focus:ring-2 focus:ring-[#162A46] focus:border-transparent transition"
            autoFocus
          />

          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#162A46] rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-10 text-red-500">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && !error && users.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {users.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => openProfile(user._id)}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition text-left border-b last:border-b-0 border-gray-100"
              >
                {/* Profile Image */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#162A46] text-white">
                      <FiUser size={22} />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#162A46] truncate">
                    {user.username}
                  </h3>

                  {user.name && (
                    <p className="text-sm text-gray-500 truncate">
                      {user.name}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-0.5">
                    ID: {user._id}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Result */}
        {!loading &&
          !error &&
          searched &&
          search.trim() &&
          users.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FiSearch
                  size={28}
                  className="text-gray-400"
                />
              </div>

              <h2 className="font-semibold text-lg">
                No users found
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Try searching with another username or ID.
              </p>
            </div>
          )}

        {/* Initial State */}
        {!search.trim() && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FiSearch
                size={28}
                className="text-[#162A46]"
              />
            </div>

            <h2 className="font-semibold text-lg">
              Find People
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Search by username or user ID.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;