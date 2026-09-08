import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";

const PrivateRouting = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const verifyToken = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8808/api/auth/verify-token",
        {
          withCredentials: true,
        }
      );

      console.log("TOKEN VERIFY:", response.data);

      if (response.data?.success) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log(
        "Token verification failed:",
        error.response?.data || error.message
      );

      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  // Wait until cookie/token verification finishes
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#162A46]" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Checking login...
          </p>
        </div>
      </div>
    );
  }

  // No cookie / invalid cookie → Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Cookie valid → show requested page
  return children;
};

export default PrivateRouting;