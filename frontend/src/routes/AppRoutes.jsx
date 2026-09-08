import React from "react";
import { createBrowserRouter } from "react-router-dom";

import Layout from "./../layouts/Layout";

// ==========================================
// PUBLIC PAGES
// ==========================================

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyOTP from "../pages/auth/VerifyOTP";

// ==========================================
// PRIVATE PAGES
// ==========================================

import Home from "./../pages/Home";
import Profile from "../pages/profile/Profile";
import EditProfile from "../pages/profile/EditProfile";
import CreatePost from "../pages/profile/CreatePost";
import Notifications from "../pages/notifications/Notifications";

// Search & Other User Profile
import Search from "../pages/search/Search";
import UserProfile from "../pages/profile/UserProfile";

// ==========================================
// PROTECTED ROUTING
// ==========================================

import PrivateRouting from "../components/ProtectedRoute";
import Reels from "../pages/reels/Reels";

// ==========================================
// ROUTES
// ==========================================

export const routes = createBrowserRouter([
  // =====================================================
  // PUBLIC ROUTES
  // These pages DO NOT require login
  // =====================================================

  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/register",
    element: <Register />,
  },

  {
    path: "/verify-otp",
    element: <VerifyOTP />,
  },

  // =====================================================
  // HOME
  // Protected
  // =====================================================

  {
    path: "/",
    element: (
      <PrivateRouting>
        <Layout />
      </PrivateRouting>
    ),

    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },

  // =====================================================
// REELS
// Protected
//
// /reels
//
// Opens vertical video reels
// =====================================================

{
  path: "/reels",
  element: (
    <PrivateRouting>
      <Reels />
    </PrivateRouting>
  ),
},

  // =====================================================
  // MY PROFILE
  // Protected
  //
  // /profile
  // Opens the logged-in user's profile
  // =====================================================

  {
    path: "/profile",
    element: (
      <PrivateRouting>
        <Profile />
      </PrivateRouting>
    ),
  },

  // =====================================================
  // OTHER USER PROFILE
  // Protected
  //
  // /profile/:userId
  //
  // Example:
  // /profile/68a123456789
  //
  // Opens the selected user's profile
  // =====================================================

  {
    path: "/profile/:userId",
    element: (
      <PrivateRouting>
        <UserProfile />
      </PrivateRouting>
    ),
  },

  // =====================================================
  // SEARCH
  // Protected
  //
  // Search username / user ID
  // =====================================================

  {
    path: "/search",
    element: (
      <PrivateRouting>
        <Search />
      </PrivateRouting>
    ),
  },

  
  // =====================================================
  // EDIT PROFILE
  // Protected
  // =====================================================

  {
    path: "/profile/editprofile",
    element: (
      <PrivateRouting>
        <EditProfile />
      </PrivateRouting>
    ),
  },

  // =====================================================
  // CREATE POST
  // Protected
  // =====================================================

  {
    path: "/profile/createpost",
    element: (
      <PrivateRouting>
        <CreatePost />
      </PrivateRouting>
    ),
  },

  // =====================================================
  // NOTIFICATIONS
  // Protected
  // =====================================================

  {
    path: "/notifications",
    element: (
      <PrivateRouting>
        <Notifications />
      </PrivateRouting>
    ),
  },
]);