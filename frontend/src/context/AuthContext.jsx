// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../api/axios"; // your axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // whether we have tokens in localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("accessToken"));
  // user object returned from backend: { id, username, email, is_staff }
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Helper: fetch current user from backend
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setIsLoggedIn(false);
      return;
    }

    setLoadingUser(true);
    try {
      const res = await api.get("/auth/user/"); // new backend endpoint
      setUser(res.data);
      setIsLoggedIn(true);
    } catch (err) {
      // token may be invalid/expired — fallback to not logged in
      console.error("Failed to fetch current user:", err);
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } finally {
      setLoadingUser(false);
    }
  };

  // Initialize on mount: if we have tokens, fetch user
  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      fetchCurrentUser();
    }
  }, []);

  // Called by Auth page after successful token obtain
  const login = async (tokens) => {
    try {
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);
      setIsLoggedIn(true);
      // Fetch user now to determine admin status
      await fetchCurrentUser();
    } catch (err) {
      console.error("Login/Fetch user failed:", err);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    setUser(null);
    // optional: force navigate to login (frontend router should handle)
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loadingUser,
        isAdmin: !!(user && user.is_staff),
        login,
        logout,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
