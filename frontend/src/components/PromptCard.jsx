// src/components/PromptCard.jsx

import React, { useState, useEffect } from "react";

import { Bookmark } from "lucide-react";

import FeedbackButtons from "./Feedback";

import api from "../api/axios";

import { useNavigate } from "react-router-dom";

export default function PromptCard({

  prompt,

  onClick,

  handleBookmark,

  bookmarks,

  onVote,

  currentUserUsername,

  showOwnerActions = false,

  onEdit,

  onDelete,

  onOpenHistory,

}) {

  const navigate = useNavigate();

  if (!prompt) return null;

  const isBookmarked = prompt.raw?.is_bookmarked ?? (bookmarks?.includes(prompt.id) ?? false);

  const initialUserVote = prompt.raw?.user_vote ?? 0;

  const initialCount = prompt.raw?.vote_count ?? prompt.raw?.vote ?? 0;

  const [userVote, setUserVote] = useState(initialUserVote);

  const [count, setCount] = useState(initialCount);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {

    setUserVote(prompt.raw?.user_vote ?? 0);

    setCount(prompt.raw?.vote_count ?? prompt.raw?.vote ?? 0);

  }, [prompt.raw]);

  const ownerUsername = prompt.raw?.user_username ?? prompt.user_username ?? prompt.author ?? prompt.user?.username ?? null;

  const isOwner = Boolean(currentUserUsername) && Boolean(ownerUsername) && currentUserUsername === ownerUsername;

  // ✅ FIXED: Corrected voting endpoint to match backend

  const handleApiVote = async (value) => {

    if (processing) return;

    setProcessing(true);

    const prevUserVote = userVote;

    const prevCount = count;

    let newVote = userVote;

    let newCount = count;

    if (userVote === value) {

      newVote = 0;

      newCount -= value;

    } else if (userVote === -value) {

      newVote = value;

      newCount += 2 * value;

    } else {

      newVote = value;

      newCount += value;

    }

    setUserVote(newVote);

    setCount(newCount);

    try {

      // ✅ FIXED: Use correct endpoints - /upvote/ or /downvote/

      const endpoint = value === 1 ? 'upvote' : 'downvote';

      const res = await api.post(`/prompts/${prompt.id}/${endpoint}/`);

      const backend = res.data;

      setUserVote(Number(backend.user_vote ?? backend.userVote ?? 0));

      setCount(Number(backend.vote_count ?? backend.vote ?? 0));

      if (onVote) onVote(backend);

    } catch (err) {

      setUserVote(prevUserVote);

      setCount(prevCount);

      console.error("Voting failed:", err);

      alert("Voting failed. Please try again.");

    } finally {

      setProcessing(false);

    }

  };

  const handleUpvote = () => handleApiVote(1);

  const handleDownvote = () => handleApiVote(-1);

  const handleBookmarkClick = async (e) => {

    e.stopPropagation();

    try {

      const res = await api.post(`/prompts/${prompt.id}/bookmark/`);

      if (res?.data && onVote) {

        onVote(res.data);

      } else if (handleBookmark) {

        handleBookmark(prompt);

      }

    } catch (err) {

      console.error("Bookmark failed:", err);

      alert("Bookmark failed. Please try again.");

    }

  };

  const handleEditClick = (e) => {

    e.stopPropagation();

    if (typeof onEdit === "function") {

      onEdit(prompt);

    } else {

      navigate(`/add-prompt/${prompt.id}`);

    }

  };

  const handleDeleteClick = (e) => {

    e.stopPropagation();

    if (typeof onDelete === "function") {

      onDelete(prompt.id);

    }

  };

  // ✅ FIXED: Improved history click handler with better error handling

  const handleHistoryClick = (e) => {

    e.stopPropagation();

    console.debug("[PromptCard] History button clicked for prompt:", prompt);

    if (typeof onOpenHistory === "function") {

      try {

        onOpenHistory(prompt);

      } catch (err) {

        console.error("[PromptCard] onOpenHistory error:", err);

      }

    } else {

      console.warn("[PromptCard] onOpenHistory not provided");

    }

  };

  // ✅ FIXED: Simplified status check

  const showHistoryForStatus = ["approved", "pending", "deleted", "pending_deletion"];

  const status = prompt.raw?.status ?? prompt.status ?? null;

  const canShowHistory = showHistoryForStatus.includes(status);

  return (
    <div
      onClick={() => onClick && onClick(prompt)}
      className="bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-300 cursor-pointer flex flex-col gap-3 relative min-w-0"
      style={{ maxWidth: "350px" }}
    >
      <h3
        className="font-bold text-md text-gray-900 break-words whitespace-normal leading-tight w-full"
        style={{ maxWidth: "260px" }}
      >
        {prompt.title}
      </h3>
      <p className="text-xs text-teal-600 -mt-1">@{prompt.author}</p>
      <div className="bg-white p-3 rounded-lg border border-gray-200">
        <p
          className="text-sm font-semibold text-gray-800 font-sans leading-relaxed whitespace-pre-wrap break-words overflow-y-auto"
          style={{ maxHeight: "95px", scrollbarWidth: "thin", scrollbarColor: "#E6FFFA" }}
        >
          {prompt.desc || "No description available"}
        </p>
      </div>
      <div className="flex items-center justify-between mt-1" onClick={(e) => e.stopPropagation()}>
        {prompt.raw?.status === "pending_deletion" && (
          <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-md">Delete requested</span>

        )}
        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-md">
          #{prompt.department || "Uncategorized"}
        </span>
        <FeedbackButtons
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
          likeCount={prompt.raw?.like_count ?? 0}
          dislikeCount={prompt.raw?.dislike_count ?? 0}
          userVote={userVote}
        />
      </div>
      {showOwnerActions && isOwner && (
        <div className="flex gap-2 mt-2 justify-around" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleEditClick}
            className="px-8 py-1 bg-white cursor-pointer border border-teal-300 text-teal-700 rounded-md hover:bg-teal-50 transition"
            aria-label={`Edit prompt ${prompt.id}`}
          >
            Edit
          </button>
          <button
            onClick={handleDeleteClick}
            className="px-7 py-1 bg-white cursor-pointer border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition"
            aria-label={`Delete prompt ${prompt.id}`}
          >
            Delete
          </button>
          {canShowHistory && (
            <button
              onClick={handleHistoryClick}
              className="px-7 py-1 bg-white cursor-pointer border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition"
              aria-label={`View history for ${prompt.id}`}
              title="View version history"
            >
              History
            </button>
          )}
        </div>
      )}
      <button
        onClick={handleBookmarkClick}
        className="absolute top-5 right-3 cursor-pointer"
        aria-label="Toggle bookmark"
      >
        <Bookmark className={`w-5 h-5 ${isBookmarked ? "text-teal-600 fill-teal-600" : "text-gray-400"}`} />
      </button>
    </div>
  );
}