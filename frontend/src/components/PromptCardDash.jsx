// src/components/PromptCardDash.jsx
import React from "react";

export default function PromptCardDash({
  prompt,
  onApprove,
  onReject,
  onHistory,
  onDelete,
}) {
  if (!prompt) return null;

  const title =
    prompt.title ??
    prompt.raw?.title ??
    prompt.name ??
    prompt.prompt_title ??
    "Untitled";

  const author =
    prompt.author ??
    prompt.user_username ??
    prompt.creator ??
    prompt.user?.username ??
    prompt.raw?.user_username ??
    "Unknown";

  const desc =
    prompt.desc ??
    prompt.prompt_description ??
    prompt.description ??
    prompt.prompt_text ??
    prompt.raw?.prompt_description ??
    "";

  const department =
    prompt.department ?? prompt.category ?? prompt.raw?.category ?? "Uncategorized";

  // *** SAFE isApproved check (prevents crashes) ***
  const isApproved = Boolean(
    prompt?.raw?.status === "approved" ||
      prompt?.raw?.is_approved ||
      prompt?.is_approved ||
      prompt?.status === "approved"
  );

  // safe handlers
  const safeOnApprove = typeof onApprove === "function" ? onApprove : () => {};
  const safeOnReject = typeof onReject === "function" ? onReject : () => {};
  const safeOnHistory = typeof onHistory === "function" ? onHistory : () => {};
  const safeOnDelete = typeof onDelete === "function" ? onDelete : () => {};

  return (
    <div
      className="bg-teal-50 p-6 rounded-xl shadow-sm border border-teal-300 flex flex-col gap-3 cursor-pointer min-w-0"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Title + Category */}
      <div className="flex justify-between items-start mb-1 gap-3">
        <h3
          className="
            font-bold
            text-gray-900
            break-words
            whitespace-normal
            leading-tight
            flex-1
            min-w-0
          "
          style={{ maxWidth: "250px" }}
        >
          {title}
        </h3>

        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-md whitespace-nowrap">
          #{department}
        </span>
      </div>

      {/* Author */}
      <p className="text-xs text-teal-600 font-semibold">@{author}</p>

      {/* Description box (same as user card) */}
      <div className="bg-white p-3 rounded-lg border border-gray-200">
        <p
          className="
            text-sm
            text-gray-800
            font-sans
            leading-relaxed
            whitespace-pre-wrap
            break-words
            overflow-y-auto
          "
          style={{
            maxHeight: "110px",
            scrollbarWidth: "thin",
          }}
        >
          {desc || "No description available"}
        </p>

        {/* Custom scrollbar */}
        <style>
          {`
            p::-webkit-scrollbar {
              width: 6px;
            }
            p::-webkit-scrollbar-track {
              background: #E6FFFA;
              border-radius: 10px;
            }
            p::-webkit-scrollbar-thumb {
              background-color: #81D8D0;
              border-radius: 10px;
            }
          `}
        </style>
      </div>

      {/* Approve / Reject Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex gap-3">
          {!isApproved ? (
            <>
              {/* APPROVE BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  safeOnApprove(prompt.id);
                }}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm cursor-pointer font-medium hover:bg-teal-700 transition-colors"
              >
                Approve
              </button>

              {/* REJECT BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  safeOnReject(prompt.id);
                }}
                className="flex-1 bg-white border border-red-200 text-red-500 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
            </>
          ) : (
            /* APPROVED PILL */
            <span className="block w-full text-center px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold tracking-wide">
              Approved
            </span>
          )}
        </div>

        {/* History Button (Always visible for Admin) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            safeOnHistory(prompt.id);
          }}
          className="flex-1 w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 py-2 rounded-full cursor-pointer hover:bg-white hover:text-teal-600 transition-colors"
        >
          View Edit History
        </button>

        
      </div>
    </div>
  );
}
