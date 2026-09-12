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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-pink-500 shadow-lg shadow-pink-200">
            <span className="text-lg font-bold text-white">V</span>
          </div>

          <h1 className="mt-2 text-xl font-bold text-slate-800">
            Vlogify
          </h1>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_12px_40px_rgba(59,130,246,0.10)]">

          {/* Heading */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800">
              Create account
            </h2>

            <p className="mt-1.5 text-sm text-slate-500">
              Join Vlogify and share your story
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600">
              <FiAlertCircle
                className="mt-0.5 shrink-0"
                size={16}
              />
              <p>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-green-100 bg-green-50 px-3.5 py-3 text-sm text-green-600">
              <FiCheckCircle
                className="mt-0.5 shrink-0"
                size={16}
              />
              <p>{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Username
              </label>

              <div className="relative">
                <FiUser
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400"
                />

                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <FiMail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <FiLock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-pink-500"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FiEyeOff size={17} />
                  ) : (
                    <FiEye size={17} />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">
                Use at least 6 characters.
              </p>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-pink-500 text-sm font-semibold text-white shadow-md shadow-blue-100 transition-all duration-200 hover:from-blue-700 hover:to-pink-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <FiArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Login */}
          <div className="mt-5 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 transition hover:text-pink-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-4 px-4 text-center text-[10px] leading-4 text-slate-400">
          By creating an account, you agree to our Terms of Service
          and Privacy Policy.
        </p>

        {/* Copyright */}
        <p className="mt-2 text-center text-[10px] text-slate-400">
          © 2026 Vlogify. All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default Register;