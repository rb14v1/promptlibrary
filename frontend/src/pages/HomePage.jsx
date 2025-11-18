// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PromptModal from "../components/PromptModal";
import PromptCard from "../components/PromptCard";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Bookmark, Plus, Search } from "lucide-react";
import api from "../api/axios";
import Select from "react-select";
import { toast } from "react-toastify";
import HistoryModal from "../components/HistoryModal";

export default function HomePage() {
  const { user } = useAuth();
  const [task, setTask] = useState([]);
  const [output, setOutput] = useState([]);
  const [department, setDepartment] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const [allPrompts, setAllPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState([]);
  const [selectedOutputFormats, setSelectedOutputFormats] = useState([]);

  // Tabs
  const [activeTab, setActiveTab] = useState("all"); // "all" | "my"

  // History modal states
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPromptId, setHistoryPromptId] = useState(null);

  const navigate = useNavigate();

  // map backend -> frontend shape
  const mapBackendPromptToFrontend = (p) => ({
    id: p.id,
    title: p.title,
    desc: p.prompt_description || p.prompt_text || "",
    task: p.task_type || "",
    output: p.output_format || "",
    department: p.category || "",
    author: p.user_username || "Unknown",
    template: p.prompt_text || "",
    description: p.prompt_description || "",
    intendedUse: p.intended_use || "",
    guide: p.guidance || "",
    raw: p,
  });

  // hardcoded options (task/output)
  const taskTypeOptions = [
    { value: "create_content", label: "Create Content" },
    { value: "create_code", label: "Create Code" },
    { value: "research", label: "Research" },
    { value: "deep_research", label: "Deep Research / Analysis" },
    { value: "plan_organize", label: "Plan & Organize" },
    { value: "ideate", label: "Ideate / Brainstorm" },
    { value: "summarize", label: "Summarize / Review" },
    { value: "explain", label: "Explain / Teach" },
    { value: "optimize", label: "Optimize / Improve" },
  ];

  const outputFormatOptions = [
    { value: "text", label: "Text" },
    { value: "code", label: "Code" },
    { value: "chart_graph", label: "Chart / Graph" },
    { value: "checklist_table", label: "Checklist / Table" },
    { value: "template_framework", label: "Template / Framework" },
    { value: "image_visual", label: "Image / Visual" },
    { value: "slide_report", label: "Slide / Report" },
  ];

  // compact react-select styles
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "36px",
      height: "36px",
      padding: "0 6px",
      borderColor: state.isFocused ? "#14b8a6" : "#e5e7eb",
      borderWidth: "1px",
      borderRadius: "0.5rem",
      backgroundColor: "white",
      boxShadow: state.isFocused ? "0 0 0 1px #14b8a6" : "none",
      fontSize: "0.85rem",
      "&:hover": { borderColor: "#14b8a6" },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#0d9488" : state.isFocused ? "#ccfbf1" : "white",
      color: state.isSelected ? "white" : "black",
      fontSize: "0.9rem",
      padding: "6px 10px",
    }),
    multiValue: (provided) => ({ ...provided, backgroundColor: "#ccfbf1", fontSize: "0.85rem" }),
    multiValueLabel: (provided) => ({ ...provided, color: "#0f766e", padding: "2px 6px" }),
    placeholder: (provided) => ({ ...provided, color: "#9ca3af", fontSize: "0.9rem" }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
  };

  // fetch prompts
  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/prompts/");
      const backendPrompts = res.data || [];
      const mapped = backendPrompts.map(mapBackendPromptToFrontend);
      setAllPrompts(mapped);

      // bookmarks from server (if present)
      const bkIds = backendPrompts
        .filter((p) => p.is_bookmarked || (p.raw && p.raw.is_bookmarked))
        .map((p) => p.id);
      setBookmarks(bkIds);
    } catch (err) {
      console.error(err);
      setError("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .get("/categories/")
      .then((res) => {
        if (!mounted) return;
        const options = (res.data || []).map((cat) => ({ value: cat, label: cat }));
        setCategoryOptions(options);
      })
      .catch((err) => console.warn("Failed to fetch categories:", err));
    return () => {
      mounted = false;
    };
  }, []);

  const matchesAny = (selectedArr, fieldValue) => {
    if (!selectedArr || selectedArr.length === 0) return true;
    if (!fieldValue) return false;
    return selectedArr.includes(fieldValue);
  };

  // filtering
  const filteredPrompts = allPrompts.filter((p) => {
    if (!matchesAny(task, p.task)) return false;
    if (!matchesAny(output, p.output)) return false;
    if (!matchesAny(department, p.department)) return false;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const inTitle = p.title && p.title.toLowerCase().includes(s);
      const inDesc = (p.desc || p.description || p.prompt_text || p.prompt_description || "").toLowerCase().includes(s);
      if (!inTitle && !inDesc) return false;
    }

    if (selectedCategories.length > 0) {
      const vals = selectedCategories.map((c) => c.value);
      if (!vals.includes(p.department || p.category)) return false;
    }

    if (selectedTaskTypes.length > 0) {
      const vals = selectedTaskTypes.map((t) => t.value);
      if (!vals.includes(p.task || p.task_type)) return false;
    }

    if (selectedOutputFormats.length > 0) {
      const vals = selectedOutputFormats.map((o) => o.value);
      if (!vals.includes(p.output || p.output_format)) return false;
    }

    return true;
  });

  // base list: my vs all
  let baseList;
  if (activeTab === "my" && user?.username) {
    baseList = allPrompts.filter((p) => p.author === user.username);
  } else {
    baseList = filteredPrompts.filter((p) => (p.raw && p.raw.status === "approved"));
  }

  const promptsToShow = showBookmarks ? baseList.filter((p) => bookmarks.includes(p.id)) : baseList;

  const handleBookmark = (prompt) => {
    setBookmarks((prev) => (prev.includes(prompt.id) ? prev.filter((id) => id !== prompt.id) : [...prev, prompt.id]));
  };

  const handleApprove = (id) => alert("Approved prompt: " + id);
  const handleReject = (id) => alert("Rejected prompt: " + id);

  const handleCardEdit = (prompt) => {
    navigate(`/add-prompt/${prompt.id}`);
  };

  // deletion flow (parent-managed)
  // inside src/pages/HomePage.jsx

const handleCardDelete = (promptId) => {
  const toastId = toast(
    ({ closeToast }) => (
      <div className="min-w-[260px]">
        <p className="font-medium text-sm mb-2">Request deletion for this prompt?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(toastId);
            }}
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-1.5 rounded-md text-sm"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              // optimistic: mark status locally so UI shows "requested"
              const prevPrompts = allPrompts;
              setAllPrompts((prev) =>
                prev.map((p) =>
                  p.id === promptId ? { ...p, raw: { ...(p.raw || {}), status: 'pending_deletion' } } : p
                )
              );

              toast.dismiss(toastId);
              try {
                const res = await api.post(`/prompts/${promptId}/request_delete/`);

                // Axios throws only for non-2xx; if we get here it's success.
                // But handle a few cases explicitly:
                const status = res?.status;
                if (status >= 200 && status < 300) {
                  toast.success("Deletion request sent. Admin will review it.");
                  // sync returned prompt if provided
                  if (res.data) {
                    setAllPrompts((prev) =>
                      prev.map((p) => (p.id === res.data.id ? mapBackendPromptToFrontend(res.data) : p))
                    );
                  }
                  return;
                }

                // If we get here, treat as failure & rollback
                console.warn('Unexpected response while requesting deletion:', res);
                toast.error("Failed to request deletion. Try again.");
                setAllPrompts(prevPrompts);
              } catch (err) {
                // Detailed logging so you can inspect the real failure in console
                console.error("Request delete error (full):", err);
                console.error("err.response:", err?.response);
                console.error("err.request:", err?.request);
                console.error("err.message:", err?.message);

                // Sometimes the server returns a non-2xx but still made the DB change.
                // If the server returned a body we can examine, try to treat 200/201/202 as success.
                const resp = err?.response;
                if (resp && resp.status && resp.status >= 200 && resp.status < 300) {
                  toast.success("Deletion request sent. Admin will review it.");
                  if (resp.data) {
                    setAllPrompts((prev) =>
                      prev.map((p) => (p.id === resp.data.id ? mapBackendPromptToFrontend(resp.data) : p))
                    );
                  }
                  return;
                }

                // Otherwise show error and rollback optimistic update
                toast.error("Failed to request deletion. Try again.");
                setAllPrompts(prevPrompts);
              }
            }}
            className="flex-1 bg-red-600 text-white py-1.5 rounded-md text-sm"
          >
            Request Deletion
          </button>
        </div>
      </div>
    ),
    {
      autoClose: false,
      closeOnClick: false,
    }
  );
};


  // Key section fix in HomePage.jsx - replace your handleOpenHistory function
 
const handleOpenHistory = (prompt) => {
  console.debug("[HomePage] handleOpenHistory called with prompt:", prompt);
  if (!user?.username) {
    console.warn("[HomePage] No user - cannot open history");
    alert("Please log in to view history.");
    return;
  }
  // ✅ FIXED: Better owner check
  const owner = prompt.author ?? prompt.raw?.user_username ?? prompt.user_username ?? null;
  console.debug("[HomePage] prompt owner:", owner, "current user:", user.username);
  if (owner !== user.username) {
    console.warn(`[HomePage] current user (${user.username}) is not owner (${owner})`);
    alert("You can only view history for prompts you created.");
    return;
  }
  // ✅ FIXED: Correct ID extraction
  const idToSend = prompt.id ?? prompt.raw?.id ?? null;
  if (!idToSend) {
    console.error("[HomePage] No valid id found on prompt:", prompt);
    return;
  }
  setHistoryPromptId(String(idToSend));
  setHistoryModalOpen(true);
  console.debug("[HomePage] Opening history modal for id:", idToSend);
};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Tabs + actions */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 bg-gray-300 p-1 rounded-full w-fit">
            <button onClick={() => setActiveTab("all")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === "all" ? "bg-teal-600 text-white shadow-sm" : "text-gray-600 cursor-pointer hover:bg-gray-200"}`}>
              Browse Library
            </button>
            <button onClick={() => setActiveTab("my")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === "my" ? "bg-teal-600 text-white shadow-sm" : "text-gray-600 cursor-pointer hover:bg-gray-200"}`}>
              My Dashboard
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowBookmarks((s) => !s)} className={`px-5 py-2 rounded-full text-sm cursor-pointer font-semibold transition-all flex items-center gap-2 border ${showBookmarks ? "bg-teal-600 text-white shadow-sm" : "bg-white text-gray-700 hover:bg-gray-200"}`}>
              <Bookmark className="w-4 h-4" />
              {showBookmarks ? "Bookmarks" : "Show Bookmarks"}
            </button>

            <button onClick={() => navigate("/add-prompt")} className="px-5 py-2 rounded-full text-sm cursor-pointer font-semibold transition-all flex items-center gap-2 bg-teal-600 text-white shadow-sm hover:bg-teal-700">
              <Plus className="w-4 h-4" />
              Create Prompt
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search prompts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-9 pl-9 pr-3 py-1 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm" />
            </div>

            <div className="relative z-40 lg:col-span-1">
              <Select isMulti options={categoryOptions} value={selectedCategories} onChange={setSelectedCategories} placeholder="Categories" styles={customSelectStyles} aria-label="Filter by categories" />
            </div>

            <div className="relative z-30 lg:col-span-1">
              <Select isMulti options={taskTypeOptions} value={selectedTaskTypes} onChange={setSelectedTaskTypes} placeholder="Task type" styles={customSelectStyles} aria-label="Filter by task type" />
            </div>

            <div className="relative z-20 lg:col-span-1">
              <Select isMulti options={outputFormatOptions} value={selectedOutputFormats} onChange={setSelectedOutputFormats} placeholder="Output format" styles={customSelectStyles} aria-label="Filter by output format" />
            </div>
          </div>
        </div>

        {/* status */}
        <div className="mt-4">
          {loading && <p className="text-gray-500 text-sm">Loading prompts…</p>}
          {error && <p className="text-red-500 text-sm">Error: {error}</p>}
        </div>

        {/* Cards */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {promptsToShow.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onClick={(p) => setSelectedPrompt(p)}
              handleBookmark={handleBookmark}
              bookmarks={bookmarks}
              onVote={(updatedBackendPrompt) => {
                setAllPrompts((prev) => prev.map((existing) => (existing.id === updatedBackendPrompt.id ? mapBackendPromptToFrontend(updatedBackendPrompt) : existing)));
                const serverBookmarked = updatedBackendPrompt.is_bookmarked ?? (updatedBackendPrompt.raw?.is_bookmarked ?? false);
                setBookmarks((prev) => (serverBookmarked ? (prev.includes(updatedBackendPrompt.id) ? prev : [...prev, updatedBackendPrompt.id]) : prev.filter((id) => id !== updatedBackendPrompt.id)));
                if (selectedPrompt && selectedPrompt.id === updatedBackendPrompt.id) {
                  setSelectedPrompt(mapBackendPromptToFrontend(updatedBackendPrompt));
                }
              }}
              currentUserUsername={user?.username}
              showOwnerActions={activeTab === "my" && user?.username === prompt.author}
              onEdit={handleCardEdit}
              onDelete={handleCardDelete}
              onOpenHistory={handleOpenHistory} // pass the handler reference
            />
          ))}
        </div>
      </main>

      <PromptModal prompt={selectedPrompt} onClose={() => setSelectedPrompt(null)} onApprove={handleApprove} onReject={handleReject} />
      <Footer />

      {/* History modal (owner-only). render with high z-index wrapper */}
      {historyModalOpen && historyPromptId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
          <HistoryModal
            promptId={historyPromptId}
            onClose={() => {
              setHistoryModalOpen(false);
              setHistoryPromptId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
