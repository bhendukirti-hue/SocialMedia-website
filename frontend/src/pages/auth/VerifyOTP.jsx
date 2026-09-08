import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiMail,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get email from Register page
  const email = location.state?.email || "";

  // Handle OTP input
  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 6) {
      setOtp(value);
    }

    setError("");
  };

  // Verify OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (!email) {
      setError("Email address is missing. Please register again.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8808/api/auth/verify-otp",
        {
          email: email,
          otp: otp,
        }
      );

      console.log("OTP verification response:", response.data);

      setSuccess(
        response.data?.message ||
          "Email verified successfully!"
      );

      // Go to login after verification
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error("OTP verification error:", err);

      const message =
        err.response?.data?.message ||
        "Invalid or expired OTP. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-5 py-10">

      <div className="w-full max-w-md">

        {/* Logo */}
        

        {/* OTP Card */}
        <div className="rounded-3xl bg-white px-6 py-8 shadow-[0_15px_50px_rgba(15,23,42,0.08)] sm:px-8 mt-[40px]">

          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3F5F7] text-[#0B1F33]">
            <FiMail size={24} />
          </div>

          {/* Heading */}
          <div className="mt-5 text-center">

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B78C35]">
              Email verification
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0B1F33]">
              Verify your email
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              We sent a 6-digit verification code to
            </p>

            {email ? (
              <p className="mt-1 break-all text-sm font-semibold text-[#0B1F33]">
                {email}
              </p>
            ) : (
              <p className="mt-1 text-sm font-semibold text-gray-400">
                your email address
              </p>
            )}

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
            className="mt-8"
          >

            {/* OTP */}
            <label
              htmlFor="otp"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Verification code
            </label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-xl font-semibold tracking-[0.5em] text-[#0B1F33] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:border-[#0B1F33] focus:bg-white focus:ring-4 focus:ring-[#0B1F33]/5"
            />

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#153B5A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Email
                  <FiArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          {/* Back to Register */}
          <div className="mt-7 border-t border-gray-100 pt-6 text-center">

            <p className="text-sm text-gray-500">
              Didn't receive the code?{" "}

              <Link
                to="/register"
                className="font-semibold text-[#0B1F33] transition hover:text-[#B78C35]"
              >
                Register again
              </Link>
            </p>

          </div>

        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-gray-400">
          © 2026 Vlogify. All rights reserved.
        </p>

      </div>

    </main>
  );
};

export default VerifyOTP;
