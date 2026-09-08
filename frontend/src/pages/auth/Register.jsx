import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // Register
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8808/api/auth/register",
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }
      );

      console.log("Register response:", response.data);

      setSuccess(
        response.data?.message ||
          "Registration successful! Please verify your email."
      );

      // If your backend sends OTP after registration
      setTimeout(() => {
        navigate("/verify-otp", {
          state: {
            email: formData.email,
          },
        });
      }, 1000);
    } catch (err) {
      console.error("Register error:", err);

      const message =
        err.response?.data?.message ||
        "Unable to create account. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-5 py-10">

      <div className="w-full max-w-md">

        {/* Logo */}
        
        {/* Register Card */}
        <div className="rounded-3xl bg-white px-6 py-8 shadow-[0_15px_50px_rgba(15,23,42,0.08)] sm:px-8 mt-[90px]">

          {/* Heading */}
          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B78C35]">
              Create account
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0B1F33]">
              Join Vlogify
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Create your account and start sharing your story.
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">

              <FiAlertCircle
                className="mt-0.5 shrink-0"
                size={17}
              />

              <p>{error}</p>

            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">

              <FiCheckCircle size={17} />

              <p>{success}</p>

            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >

            {/* Username */}
            <div>

              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Username
              </label>

              <div className="relative">

                <FiUser
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#0B1F33] focus:bg-white focus:ring-4 focus:ring-[#0B1F33]/5"
                />

              </div>

            </div>

            {/* Email */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <div className="relative">

                <FiMail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#0B1F33] focus:bg-white focus:ring-4 focus:ring-[#0B1F33]/5"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <div className="relative">

                <FiLock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm text-gray-800 outline-none transition focus:border-[#0B1F33] focus:bg-white focus:ring-4 focus:ring-[#0B1F33]/5"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-800"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>

              </div>

              <p className="mt-2 text-xs text-gray-400">
                Use at least 6 characters.
              </p>

            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#153B5A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <FiArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          {/* Login */}
          <div className="mt-7 border-t border-gray-100 pt-6 text-center">

            <p className="text-sm text-gray-500">
              Already have an account?{" "}

              <Link
                to="/login"
                className="font-semibold text-[#0B1F33] transition hover:text-[#B78C35]"
              >
                Sign in
              </Link>
            </p>

          </div>

        </div>

        {/* Terms */}
        <p className="mt-5 px-5 text-center text-xs leading-5 text-gray-400">
          By creating an account, you agree to our Terms of Service
          and Privacy Policy.
        </p>

        {/* Copyright */}
        <p className="mt-3 text-center text-xs text-gray-400">
          © 2026 Vlogify. All rights reserved.
        </p>

      </div>

    </main>
  );
};

export default Register;

