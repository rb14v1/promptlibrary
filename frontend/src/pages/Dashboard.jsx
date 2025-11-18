// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import PromptCard from "../components/PromptCardDash"; // your card
import PromptModal from "../components/PromptModalDash";
import Footer from "../components/Footer";
import HistoryModal from "../components/HistoryModal.jsx";


const API_BASE = "http://127.0.0.1:8000/api";

export default function Dashboard() {
  const { isAdmin, isLoggedIn } = useAuth();

  // Route protection
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // History modal states
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState(null);

  // Fetch prompts for the active tab
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch(`${API_BASE}/prompts/?status=${activeTab}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          },
        });
        const data = await res.json();
        setPrompts(data);
      } catch (err) {
        console.error("Error fetching prompts:", err);
      }
    };
    fetchPrompts();
  }, [activeTab]);

  // Approve
  const handleApprove = async (id) => {
    try {
      await fetch(`${API_BASE}/prompts/${id}/approve/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          "Content-Type": "application/json",
        },
      });
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
      );
      setSelectedPrompt(null);
    } catch (err) {
      console.error("Backend sync failed:", err);
    }
  };

  // Reject
  const handleReject = async (id) => {
    try {
      await fetch(`${API_BASE}/prompts/${id}/reject/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          "Content-Type": "application/json",
        },
      });
      // remove from list after reject
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      setSelectedPrompt(null);
    } catch (err) {
      console.error("Reject sync failed:", err);
    }
  };

  // Delete (permanent)
  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this prompt? This cannot be undone.")) return;

    try {
      await fetch(`${API_BASE}/prompts/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          "Content-Type": "application/json",
        },
      });

      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Open history modal
  const handleOpenHistory = (id) => {
    setSelectedPromptId(id);
    setHistoryModalOpen(true);
  };

  const filteredPrompts = prompts.filter((p) => p.status === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-semibold mb-4">DASHBOARD</h1>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-gray-300 p-1 rounded-full w-fit mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === "pending"
                ? "bg-teal-500 text-white shadow-sm"
                : "text-gray-600 cursor-pointer hover:bg-gray-300"
            }`}
          >
            Pending
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === "approved"
                ? "bg-teal-500 text-white shadow-sm"
                : "text-gray-600 cursor-pointer hover:bg-gray-300"
            }`}
          >
            Approved
          </button>

          <button
            onClick={() => setActiveTab("pending_deletion")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === "pending_deletion"
                ? "bg-teal-500 text-white shadow-sm"
                : "text-gray-600 cursor-pointer hover:bg-gray-300"
            }`}
          >
            Pending Deletion
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredPrompts.length === 0 && (
            <div className="col-span-full text-center text-gray-500">
              No prompts found.
            </div>
          )}

          {filteredPrompts.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
              onHistory={handleOpenHistory}
            />
          ))}
        </div>
      </main>

      {/* History Modal */}
      {historyModalOpen && (
        <HistoryModal
          promptId={selectedPromptId}
          onClose={() => setHistoryModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
}
