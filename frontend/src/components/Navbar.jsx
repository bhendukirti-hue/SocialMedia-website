import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  FiSearch,
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiPlus,
  FiCompass,
} from "react-icons/fi";

const Navbar = () => {
  const navigate = useNavigate();

  const API_URL = "http://localhost:8808/api";

  // ==========================================
  // STATES
  // ==========================================

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ==========================================
  // FETCH LOGGED-IN USER PROFILE
  // ==========================================

  const fetchProfile = async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      setProfile(null);
      return;
    }

    try {
      setProfileLoading(true);

      const response = await axios.get(
        `${API_URL}/auth/verify-token`,
        {
          withCredentials: true,

          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      console.log("NAVBAR PROFILE RESPONSE:", response.data);

      if (response.data.success) {
        setProfile(response.data.user);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error(
        "Navbar profile error:",
        error.response?.data || error.message
      );

      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // ==========================================
  // CHECK LOGIN
  // ==========================================

  useEffect(() => {
    const currentToken = localStorage.getItem("token");

    setToken(currentToken);

    if (currentToken) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    // Remove token
    localStorage.removeItem("token");

    // Clear states
    setToken(null);
    setProfile(null);
    setMenuOpen(false);
    setSearchOpen(false);

    // Go to login
    navigate("/login");
  };

  // ==========================================
  // NAV LINK STYLE
  // ==========================================

  const navLinkClass = ({ isActive }) =>
    `relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-gray-100 text-gray-900"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    }`;

  // ==========================================
  // PROFILE IMAGE
  // ==========================================

  const profileImage =
    profile?.profilePicture ||
    profile?.profilePic ||
    profile?.image ||
    null;

  // ==========================================
  // RETURN
  // ==========================================

  return (
    <>
      {/* =====================================================
          DESKTOP / MAIN NAVBAR
      ====================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-5 sm:px-6 lg:px-8">

        <nav className="mx-auto flex h-[68px] max-w-6xl items-center justify-between rounded-full border border-gray-100 bg-white px-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-4">

          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="group flex items-center gap-2.5"
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">

              <span className="text-base font-bold">
                V
              </span>

            </div>

            <div className="hidden sm:block">

              <span className="block text-lg font-bold tracking-tight text-gray-900">
                Vlogify
              </span>

              <span className="block text-[9px] font-medium uppercase tracking-[0.2em] text-gray-400">
                Your story
              </span>

            </div>

          </Link>


          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <div className="hidden items-center gap-1 md:flex">

            <NavLink
              to="/"
              className={navLinkClass}
            >
              Home
            </NavLink>

            <NavLink
              to="/vlogs"
              className={navLinkClass}
            >
              Explore
            </NavLink>

            {token && (
              <NavLink
                to="/dashboard"
                className={navLinkClass}
              >
                Dashboard
              </NavLink>
            )}

          </div>


          {/* =================================================
              RIGHT SECTION
          ================================================= */}

          <div className="hidden items-center gap-2 md:flex">

            {/* ===============================================
                SEARCH
            =============================================== */}

            {searchOpen ? (

              <div className="flex h-10 items-center rounded-full border border-gray-200 bg-gray-50 px-3 transition-all duration-300">

                <FiSearch
                  size={17}
                  className="mr-2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Search vlogs..."
                  autoFocus
                  className="w-32 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                />

                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="ml-2 rounded-full p-1 text-gray-400 transition hover:bg-white hover:text-gray-900"
                  aria-label="Close search"
                >
                  <FiX size={16} />
                </button>

              </div>

            ) : (

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Search"
              >
                <FiSearch size={19} />
              </button>

            )}


            {/* ===============================================
                LOGGED IN
            =============================================== */}

            {token ? (

              <>

                {/* CREATE VLOG */}

                <Link
                  to="/profile/createpost"
                  className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md"
                >

                  <FiPlus size={16} />

                  <span>
                    Create Vlog
                  </span>

                </Link>


                {/* ==========================================
                    PROFILE PHOTO
                ========================================== */}

                <Link
                  to="/dashboard/profile"
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50 transition-all duration-200 hover:border-gray-400 hover:bg-gray-100"
                  aria-label="Profile"
                  title={
                    profile?.username
                      ? profile.username
                      : "Profile"
                  }
                >

                  {profileLoading ? (

                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />

                  ) : profileImage ? (

                    <img
                      src={profileImage}
                      alt={
                        profile?.username ||
                        "Profile"
                      }
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <FiUser
                      size={19}
                      className="text-gray-600"
                    />

                  )}

                </Link>


                {/* ==========================================
                    LOGOUT
                ========================================== */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                  aria-label="Logout"
                  title="Logout"
                >

                  <FiLogOut size={18} />

                </button>

              </>

            ) : (

              /* =============================================
                 LOGGED OUT
              ============================================= */

              <>

                <Link
                  to="/login"
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md"
                >
                  Get Started
                </Link>

              </>

            )}

          </div>


          {/* =================================================
              MOBILE MENU BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition hover:bg-gray-100 md:hidden"
            aria-label="Menu"
          >

            {menuOpen ? (
              <FiX size={21} />
            ) : (
              <FiMenu size={21} />
            )}

          </button>

        </nav>


        {/* =====================================================
            MOBILE MENU
        ====================================================== */}

        {menuOpen && (

          <div className="mx-auto mt-3 max-w-6xl overflow-hidden rounded-[28px] border border-gray-100 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.10)] md:hidden">

            {/* ===============================================
                MOBILE SEARCH
            =============================================== */}

            <div className="mb-3 flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-3">

              <FiSearch
                size={17}
                className="mr-3 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search vlogs..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />

            </div>


            {/* ===============================================
                HOME
            =============================================== */}

            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              className={navLinkClass}
            >

              <div className="flex items-center gap-3">

                <span>
                  Home
                </span>

              </div>

            </NavLink>


            {/* ===============================================
                EXPLORE
            =============================================== */}

            <NavLink
              to="/vlogs"
              onClick={() => setMenuOpen(false)}
              className={navLinkClass}
            >

              <div className="flex items-center gap-3">

                <FiCompass size={17} />

                <span>
                  Explore
                </span>

              </div>

            </NavLink>


            {/* ===============================================
                LOGGED IN MOBILE
            =============================================== */}

            {token ? (

              <div className="mt-2 border-t border-gray-100 pt-2">

                {/* Dashboard */}

                <NavLink
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass}
                >

                  <div>
                    Dashboard
                  </div>

                </NavLink>


                {/* Profile */}

                <NavLink
                  to="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass}
                >

                  <div className="flex items-center gap-3">

                    {profileImage ? (

                      <img
                        src={profileImage}
                        alt="Profile"
                        className="h-7 w-7 rounded-full object-cover"
                      />

                    ) : (

                      <FiUser size={17} />

                    )}

                    <span>
                      Profile
                    </span>

                  </div>

                </NavLink>

               
                {/* Create Post */}

                <Link
                  to="/profile/createpost"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >

                  <FiPlus size={17} />

                  Create Vlog

                </Link>


                {/* Logout */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-500"
                >

                  <FiLogOut size={17} />

                  Logout

                </button>

              </div>

            ) : (

              /* =============================================
                 LOGGED OUT MOBILE
              ============================================= */

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">

                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full bg-gray-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Get Started
                </Link>

              </div>

            )}

          </div>

        )}

      </header>
    </>
  );
};

export default Navbar;