import React from "react";

export default function PromptModal({ prompt, onClose, onApprove, onReject }) {
  if (!prompt) return null;
  const isApproved = prompt.status === "approved";
 
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-teal-50 rounded-xl shadow-lg w-full max-w-lg p-6 relative pb-12">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4">{prompt.title}</h2>

        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Prompt Template:</span>{" "}
            {prompt.prompt_text|| "—"}
          </p>
          <p>
            <span className="font-semibold">Description:</span>{" "}
            {prompt.prompt_description || "—"}
          </p>
          <p>
            <span className="font-semibold">Intended Use:</span>{" "}
            {prompt.task_type || "—"} {" / "}
            {prompt.output_format || "—"} {" / "}
            {prompt.category || "—"}
          </p>
          <p>
            <span className="font-semibold">Guide:</span>{" "}
            {prompt.guidance || "—"}
          </p>
        </div>

        {!isApproved ? (
          <div className="mt-6 flex justify-end gap-3 ">
            <button
              onClick={() => onApprove(prompt.id)}
              className="px-4 py-2 bg-teal-400 hover:bg-teal-500 text-white rounded-md transition cursor-pointer"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(prompt.id)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition cursor-pointer"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="absolute bottom-4 right-6 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
            Approved
          </span>
        )}
      </div>
    </div>
  );
}
 
 