// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AddPromptPage from "./pages/AddPromptPage";
import Auth from "./pages/Auth.jsx";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard.jsx";
import HomePage from "./pages/HomePage.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { isLoggedIn, isAdmin, loadingUser } = useAuth();

  // While we are fetching the user info, avoid making a misguided redirect
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* Public / Auth routes */}
        {!isLoggedIn && (
          <>
            <Route path="/login" element={<Auth />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* Logged-in routes */}
        {isLoggedIn && (
          <>
            {/* Admin: open /dashboard as default */}
            {isAdmin ? (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                {/* Make / redirect to /dashboard for admins */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                {/* Add prompt routes (admin can also access) */}
                <Route path="/add-prompt" element={<AddPromptPage />} />
                {/* Edit route for prompts */}
                <Route path="/add-prompt/:promptId" element={<AddPromptPage />} />
              </>
            ) : (
              // Regular users: Home is default. They cannot access /dashboard.
              <>
                <Route index element={<HomePage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
                {/* Create prompt */}
                <Route path="/add-prompt" element={<AddPromptPage />} /> {/* <-- new */}
                {/* Edit prompt (route with param) */}
                <Route path="/add-prompt/:promptId" element={<AddPromptPage />} />
                <Route
                  path="/dashboard"
                  element={<Navigate to="/" replace />} // protect admin route
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </>
        )}
      </Routes>
      <ToastContainer position="top-right" hideProgressBar closeOnClick />
    </div>
  );
}

export default App;
