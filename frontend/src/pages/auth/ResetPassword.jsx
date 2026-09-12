import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `http://localhost:8808/api/auth/reset-password/${token}`,
        {
          password,
        }
      );

      setSuccess(
        response.data?.message ||
          "Password reset successful."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      console.error("Reset password error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 px-4 py-10 flex items-center justify-center">

      <div className="w-full max-w-md">

        {/* Logo */}
        <Link
          to="/"
          className="mb-7 flex items-center justify-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-pink-500 text-lg font-bold text-white shadow-md">
            V
          </div>

          <span className="text-2xl font-bold text-gray-900">
            Vlogify
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_15px_45px_rgba(37,99,235,0.10)] sm:p-8">

          {/* Heading */}
          <div className="text-center">

            <span className="inline-block rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
              Password Reset
            </span>

            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Create new password
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Enter your new password below.
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-600">
              <FiAlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-3 py-3 text-sm text-green-600">
              <FiCheckCircle size={17} />
              <span>{success}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                New password
              </label>

              <div className="relative">

                <FiLock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>

              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>

              <div className="relative">

                <FiLock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-500"
                />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>

              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-pink-500 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Updating...
                </>
              ) : (
                <>
                  Reset Password
                  <FiArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          {/* Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-600 hover:text-pink-600"
            >
              Back to Login
            </Link>
          </div>

        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          © 2026 Vlogify. All rights reserved.
        </p>

      </div>
    </main>
  );
};

export default ResetPassword;
