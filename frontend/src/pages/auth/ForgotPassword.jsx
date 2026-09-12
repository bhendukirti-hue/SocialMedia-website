import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FiMail,
  FiArrowLeft,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8808/api/auth/forgot-password",
        {
          email,
        }
      );

      setSuccess(
        response.data?.message ||
          "Password reset instructions have been sent to your email."
      );
    } catch (err) {
      console.error("Forgot password error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to process your request. Please try again."
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

            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Account Recovery
            </span>

            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Forgot your password?
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Enter your registered email address and we'll help you reset
              your password.
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
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-3 py-3 text-sm text-green-600">
              <FiCheckCircle
                size={17}
                className="mt-0.5 shrink-0"
              />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <div className="relative">

                <FiMail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

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
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <FiArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-blue-600"
            >
              <FiArrowLeft size={16} />
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

export default ForgotPassword;
