import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  // Login
  const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  if (!formData.email || !formData.password) {
    setError("Please enter your email and password.");
    return;
  }

  try {
    setLoading(true);

    const response = await axios.post(
      "http://localhost:8808/api/auth/login",
      {
        email: formData.email,
        password: formData.password,
      },
      {
        withCredentials: true,
      }
    );

    console.log("Login response:", response.data);

    // Cookie is already set by the backend.
    // No localStorage required.

    setSuccess("Login successful! Redirecting...");

    setTimeout(() => {
      navigate("/");
    }, 800);

  } catch (err) {
    console.error("Login error:", err);

    const message =
      err.response?.data?.message ||
      "Unable to login. Please check your email and password.";

    setError(message);
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-5 py-12">

      {/* Login Container */}
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link
          to="/"
          className="mb-10 flex flex-col items-center"
        >
        </Link>

        {/* Login Card */}
        <div className="rounded-3xl bg-white px-6 py-8 shadow-[0_15px_50px_rgba(15,23,42,0.08)] sm:px-8">

          {/* Heading */}
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B78C35]">
              Welcome back
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0B1F33]">
              Sign in
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Enter your details to continue your journey.
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
            className="mt-8 space-y-5"
          >

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

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#B78C35] transition hover:text-[#0B1F33]"
                >
                  Forgot password?
                </Link>

              </div>

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
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#153B5A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          {/* Register */}
          <div className="mt-7 text-center">

            <p className="text-sm text-gray-500">
              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-[#0B1F33] transition hover:text-[#B78C35]"
              >
                Create account
              </Link>
            </p>

          </div>

        </div>

        {/* Bottom Text */}
        <p className="mt-6 text-center text-xs text-gray-400">
          © 2026 Vlogify. All rights reserved.
        </p>

      </div>

    </main>
  );
};

export default Login;