// components/HistoryModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, User, Clock, Tag, Type, LayoutGrid, Layers, RotateCcw, AlertCircle } from 'lucide-react';

export default function HistoryModal({ promptId, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reverting, setReverting] = useState(false);
  const [revertingId, setRevertingId] = useState(null);

  useEffect(() => {
    if (!promptId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/prompts/${promptId}/history/`);
        setVersions(res.data || []);
      } catch (err) {
        console.error("Error fetching prompt history:", err);
        
        // Enhanced error handling
        const errorMsg = err.response?.data?.detail 
          || err.response?.data?.error 
          || err.response?.statusText
          || "Failed to load history. You may not have permission to view this.";
        
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [promptId]);

  const handleRevert = async (versionId) => {
    if (!window.confirm("Revert to this version? This will create a new version with these contents.")) {
      return;
    }

    setReverting(true);
    setRevertingId(versionId);
    
    try {
      const res = await api.post(`/prompts/${promptId}/revert/${versionId}/`);
      
      // Success message
      alert("✅ Successfully reverted to this version!");
      
      // Close modal and refresh if needed
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Revert failed:", err);
      
      // Enhanced error message
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.detail 
        || err.response?.statusText
        || "Failed to revert. You may not have permission.";
      
      alert(`❌ ${errorMsg}`);
    } finally {
      setReverting(false);
      setRevertingId(null);
    }
  };

  const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-2">
      {React.cloneElement(icon, { className: "text-teal-600", size: 16 })}
      <span className="text-xs font-medium text-gray-500">{label}:</span>
      <span className="text-xs text-gray-800 font-semibold">{value}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div
        className="relative z-[10000] w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl m-4 flex flex-col max-h-[90vh] border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200/50 bg-white/90 backdrop-blur-sm rounded-t-2xl">
          <h2 id="history-modal-title" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="text-teal-600" size={24} />
            Prompt Edit History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 p-2 rounded-full hover:bg-gray-100/80 hover:text-gray-600 transition-all"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-gradient-to-b from-gray-50/80 to-white/80 backdrop-blur-sm overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full"></div>
              <p className="text-gray-600 mt-4 font-medium">Loading version history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200/80 shadow-sm">
              <AlertCircle className="mx-auto text-red-500 mb-3" size={48} />
              <p className="text-red-700 font-semibold text-lg mb-2">Unable to Load History</p>
              <p className="text-red-600 text-sm px-4">{error}</p>
              <p className="text-sm text-gray-600 mt-3 px-4">
                Please make sure you are the owner of this prompt or have admin privileges.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm">
              <Layers className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No History Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                This prompt hasn't had any approved edits saved yet. Version history is created when an approved prompt is edited.
              </p>
            </div>
          ) : (
            versions.map((version, index) => (
              <div
                key={version.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* Version Header */}
                <div className="p-4 bg-gradient-to-r from-gray-50/90 to-teal-50/30 border-b border-gray-200/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-100 text-teal-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {versions.length - index}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="text-teal-600" size={16} />
                      <span className="text-sm font-semibold text-teal-700">
                        @{version.edited_by_username || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="text-gray-400" size={16} />
                    <span className="text-sm">
                      {new Date(version.version_created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Version Body */}
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{version.title}</h4>
                    {version.prompt_description && (
                      <p className="text-sm text-gray-600">{version.prompt_description}</p>
                    )}
                  </div>

                  <div className="p-4 bg-teal-50/50 backdrop-blur-sm rounded-lg border border-teal-100/80">
                    <label className="text-xs font-bold text-teal-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                      <Type size={14} />
                      Prompt Text
                    </label>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                      {version.prompt_text}
                    </p>
                  </div>

                  {version.guidance && (
                    <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-200/80">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-2">
                        <LayoutGrid size={14} />
                        Guidance
                      </label>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {version.guidance}
                      </p>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-200/50">
                    <DetailItem 
                      icon={<Tag />} 
                      label="Category" 
                      value={version.category} 
                    />
                    <DetailItem
                      icon={<Type />}
                      label="Task Type"
                      value={version.task_type_label || version.task_type}
                    />
                    <DetailItem
                      icon={<LayoutGrid />}
                      label="Output Format"
                      value={version.output_format_label || version.output_format}
                    />
                  </div>

                  {/* Revert Button */}
                  <div className="pt-4 border-t border-gray-200/50">
                    <button
                      onClick={() => handleRevert(version.id)}
                      disabled={reverting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                    >
                      <RotateCcw size={16} className={reverting && revertingId === version.id ? "animate-spin" : ""} />
                      {reverting && revertingId === version.id ? "Reverting..." : "Revert to This Version"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - only show if versions exist */}
        {!loading && !error && versions.length > 0 && (
          <div className="p-4 border-t border-gray-200/50 bg-white/90 backdrop-blur-sm rounded-b-2xl text-center">
            <p className="text-xs text-gray-500">
              Showing {versions.length} version{versions.length !== 1 ? 's' : ''} • 
              Only approved edits are tracked
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
