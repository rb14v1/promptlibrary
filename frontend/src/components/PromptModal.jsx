import React from "react";

export default function PromptModal({ prompt, onClose, onApprove, onReject }) {
  if (!prompt) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      {/* Modal box */}
      <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold text-teal-700 mb-4">
          {prompt.title}
        </h2>

      
        <div className="space-y-3 text-gray-700 text-sm leading-relaxed">
          <p>
            <span className="font-semibold text-gray-900">Prompt Template:</span>{" "}
            {prompt.template || "—"}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Description:</span>{" "}
            {prompt.description || prompt.desc || "—"}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Intended Use:</span>{" "}
            {prompt.task_type || "—"} {" / "}
            {prompt.output_format || "—"} {" / "}
            {prompt.category || "—"}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Guide:</span>{" "}
            {prompt.guide || "—"}
          </p>
        </div>

        
      
      </div>
    </div>
  );
}
