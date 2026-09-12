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

// ==========================================
// SEARCH & OTHER USER PROFILE
// ==========================================

import Search from "../pages/search/Search";
import UserProfile from "../pages/profile/UserProfile";

// ==========================================
// REELS
// ==========================================

import Reels from "../pages/reels/Reels";

// ==========================================
// MESSAGES
// ==========================================

import Messages from "../pages/messages/Messages";

// ==========================================
// PROTECTED ROUTING
// ==========================================

import PrivateRouting from "../components/ProtectedRoute";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

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
  {
    path:"/forgot-password",
    element:<ForgotPassword/>
  },
  {
    path:"/reset-password/:token",
    element:<ResetPassword/>
  },

  // =====================================================
  // HOME
  // Protected
  //
  // /
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
  // /search
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
  //
  // /profile/editprofile
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
  //
  // /profile/createpost
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
  //
  // /notifications
  // =====================================================

  {
    path: "/notifications",
    element: (
      <PrivateRouting>
        <Notifications />
      </PrivateRouting>
    ),
  },

  // =====================================================
  // MESSAGES
  // Protected
  //
  // /messages
  //
  // Opens private real-time messaging
  // =====================================================

  {
    path: "/messages",
    element: (
      <PrivateRouting>
        <Messages />
      </PrivateRouting>
    ),
  },
]);