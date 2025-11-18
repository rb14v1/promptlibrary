import React, { useState, useRef, useEffect } from "react";



const TASK_TYPE_CHOICES = [
   { value: "Ask", label: "Ask" },
  { value: "Learn", label: "Learn" },
  { value: "Create", label: "Create" },
  { value: "Catch up", label: "Catch up" },
   { value: "Analyze", label: "Analyze" },
    { value: "Code", label: "Code" },
     { value: "Prepare", label: "Prepare" },
];

const OUTPUT_FORMAT_CHOICES = [
  { value: "Text", label: "Text" },
   { value: "Code", label: "Code" },
    { value: "Chart", label: "Chart" },
     { value: "Image", label: "Image" },
  { value: "Report", label: "Report" },
  { value: "Template", label: "Template" },
];

const CATEGORY_CHOICES = [
  { value: "Marketing", label: "Marketing" },
   { value: "Sales", label: "Sales" },
    { value: "Engineering", label: "Engineering" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Communication", label: "Communication" },
  { value: "Finance", label: "Finance" },
];

export default function FilterBar({ setTask, setOutput, setCategory }) {
  const [selectedTask, setSelectedTask] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState([]);

  const [open, setOpen] = useState({ task: false, output: false, category: false });
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen({ task: false, output: false, category: false });
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen({ task: false, output: false, category: false });
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const toggleVal = (arr, setFn, value, parentSetter) => {
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setFn(next);
    parentSetter && parentSetter(next);
  };

  const openOnly = (key) => {
    setOpen((prev) => {
      const next = { task: false, output: false, category: false };
      next[key] = !prev[key];
      return next;
    });
  };

  const renderDropdown = (label, isOpen, choices, selectedArr, onToggle, keyName) => {
    return (
      <div className="relative inline-block text-left" style={{ minWidth: 240 }}>
        <button
          type="button"
          onClick={() => openOnly(keyName)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-sm focus:outline-none"
        >
          <div className="text-left">
            
            <div className="text-base font-semibold text-gray-700">{label}</div>
          </div>

         
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-30 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            <div className="max-h-44 overflow-auto">
              {choices.map((c) => (
                <label key={c.value} className="flex items-center gap-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={c.value}
                    checked={selectedArr.includes(c.value)}
                    onChange={() => onToggle(c.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-800">{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="w-full">
      <div className="flex gap-4 flex-wrap">
        {renderDropdown(
          "Task",
          open.task,
          TASK_TYPE_CHOICES,
          selectedTask,
          (val) => toggleVal(selectedTask, setSelectedTask, val, setTask),
          "task"
        )}
        {renderDropdown(
          "Output",
          open.output,
          OUTPUT_FORMAT_CHOICES,
          selectedOutput,
          (val) => toggleVal(selectedOutput, setSelectedOutput, val, setOutput),
          "output"
        )}
        {renderDropdown(
          "Department",
          open.category,
          CATEGORY_CHOICES,
          selectedCategory,
          (val) => toggleVal(selectedCategory, setSelectedCategory, val, setCategory),
          "category"
        )}
      </div>
    </div>
  );
}
