import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Select from 'react-select';
import version1Logo from '../assets/version1.png';
import promptHubLogo from '../assets/lumina.png';
import Footer from '../components/Footer';
import Header from '../components/Header';
 
 
// ✅ --- Custom styles for React Select with Teal Borders ---
const customStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? '#14b8a6' : '#5eead4', // ✅ teal-500 when focused, teal-300 default
    borderWidth: '1px',
    boxShadow: state.isFocused ? '0 0 0 2px #99f6e4' : 'none', // ✅ teal-200 focus ring
    backgroundColor: '#fff',
    borderRadius: '0.5rem',
    minHeight: '40px',
    transition: 'all 0.2s ease-in-out',
    '&:hover': { borderColor: '#14b8a6' }, // ✅ teal-500 on hover
    zIndex: 30,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#14b8a6' // ✅ teal-500 for selected
      : state.isFocused
        ? '#ccfbf1' // ✅ teal-100 for focused
        : '#fff',
    color: state.isSelected ? '#fff' : '#111827',
    '&:hover': { backgroundColor: '#99f6e4' }, // ✅ teal-200 on hover
  }),
  singleValue: (provided) => ({ ...provided, color: '#111827' }),
  placeholder: (provided) => ({ ...provided, color: '#9ca3af' }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '0.5rem',
    overflow: 'hidden',
    zIndex: 9999,
    border: '1px solid #5eead4', // ✅ teal-300 border for dropdown menu
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};
 
 
function AddPromptPage() {
  const { logout } = useAuth();
 
 
  // ✅ Task Type Options (for react-select)
  const taskTypeOptions = [
    { value: 'create_content', label: 'Create Content' },
    { value: 'create_code', label: 'Create Code' },
    { value: 'research', label: 'Research' },
    { value: 'deep_research', label: 'Deep Research / Analysis' },
    { value: 'plan_organize', label: 'Plan & Organize' },
    { value: 'ideate', label: 'Ideate / Brainstorm' },
    { value: 'summarize', label: 'Summarize / Review' },
    { value: 'explain', label: 'Explain / Teach' },
    { value: 'optimize', label: 'Optimize / Improve' },
  ];
 
 
  // ✅ Output Format Options (for react-select)
  const outputFormatOptions = [
    { value: 'text', label: 'Text' },
    { value: 'code', label: 'Code' },
    { value: 'chart_graph', label: 'Chart / Graph' },
    { value: 'checklist_table', label: 'Checklist / Table' },
    { value: 'template_framework', label: 'Template / Framework' },
    { value: 'image_visual', label: 'Image / Visual' },
    { value: 'slide_report', label: 'Slide / Report' },
  ];
 
 
  const [promptTitle, setPromptTitle] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [guidance, setGuidance] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [selectedOutputFormat, setSelectedOutputFormat] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
 
 
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories/');
        setAllCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);
 
 
  const categoryOptions = allCategories.map((category) => ({
    value: category,
    label: category,
  }));
 
 
  const tealInputClasses =
    'block w-full rounded-lg border border-teal-300 py-2 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-150 sm:text-sm sm:leading-6 bg-white';
 
 
  const cardClasses =
    'bg-white/90 backdrop-blur-sm border border-teal-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl';
 
 
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!promptTitle.trim() || !promptText.trim() || !selectedCategory) {
      setStatusMessage('⚠️ Please fill in all required fields.');
      return;
    }
 
 
    const apiPrompt = {
      title: promptTitle,
      prompt_description: promptDescription,
      prompt_text: promptText,
      guidance: guidance,
      task_type: selectedTaskType?.value || '',
      output_format: selectedOutputFormat?.value || '',
      category: selectedCategory.value,
    };
 
 
    try {
      const response = await api.post('/prompts/', apiPrompt);
      if (response.status === 201) {
        setStatusMessage('✅ Prompt added successfully!');
        setPromptTitle('');
        setPromptDescription('');
        setPromptText('');
        setGuidance('');
        setSelectedTaskType(null);
        setSelectedOutputFormat(null);
        setSelectedCategory(null);
      }
    } catch (error) {
      setStatusMessage('❌ Failed to submit. Please try again.');
    }
  };
 
 
  const getStatusClasses = () => {
    if (statusMessage.startsWith('✅'))
      return 'bg-green-100 text-green-800 border border-green-300';
    if (statusMessage.startsWith('❌') || statusMessage.startsWith('⚠️'))
      return 'bg-red-100 text-red-800 border border-red-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };
 
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-100 flex flex-col font-inter relative">
      {/* HEADER */}
      <Header />
 
 
      {/* BACK BUTTON */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        <button
          onClick={() => window.history.back()}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition inline-flex items-center"
        >
          ← Back
        </button>
      </div>
 
 
      {/* MAIN CONTENT */}
      <main className="flex-grow container mx-auto px-6 md:px-10 lg:px-16 pt-4 pb-16 space-y-10 relative z-10">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent mb-3">
            Add a New Prompt
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create a high-quality AI prompt with clear title, task type, and format.
          </p>
        </div>
 
 
        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          {/* TITLE */}
          <div className={`${cardClasses} p-6 md:p-8`}>
            <label className="block text-gray-800 font-semibold mb-3">
              🛠️ Prompt Title
            </label>
            <input
              type="text"
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              placeholder="Enter a clear, descriptive title..."
              className={tealInputClasses}
            />
          </div>
 
 
          {/* GRID SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              <div className={`${cardClasses} p-5`}>
                <label className="block text-gray-800 font-semibold mb-3">
                  📝 Prompt Description
                </label>
                <textarea
                  rows="3"
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                  placeholder="Briefly describe the use or purpose of this prompt..."
                  className={tealInputClasses}
                />
              </div>
 
 
              <div className={`${cardClasses} p-5`}>
                <label className="block text-gray-800 font-semibold mb-3">
                  💡 Add Your Prompt
                </label>
                <textarea
                  rows="8"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Type your core prompt content here..."
                  className={tealInputClasses}
                />
              </div>
            </div>
 
 
            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2 space-y-5 md:space-y-6 relative z-50">
              {/* TASK TYPE */}
              <div className={`${cardClasses} p-4`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  ⚙️ Task Configuration
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose Task Type
                </label>
                <Select
                  isClearable
                  options={taskTypeOptions}
                  value={selectedTaskType}
                  onChange={(newValue) => setSelectedTaskType(newValue)}
                  placeholder="Select a task type..."
                  styles={customStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
 
 
              {/* OUTPUT FORMAT */}
              <div className={`${cardClasses} p-4`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  📄 Output Format
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose Output Format
                </label>
                <Select
                  isClearable
                  options={outputFormatOptions}
                  value={selectedOutputFormat}
                  onChange={(newValue) => setSelectedOutputFormat(newValue)}
                  placeholder="Select an output format..."
                  styles={customStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
 
 
              {/* CATEGORY */}
              <div className={`${cardClasses} p-4 relative`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  🏷️ Department
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose a department
                </label>
                <Select
                  isClearable
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={(newValue) => setSelectedCategory(newValue)}
                  placeholder="Select department"
                  styles={customStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            </div>
          </div>
 
 
          {/* GUIDANCE */}
          <div className={`${cardClasses} p-6`}>
            <label className="block text-gray-800 font-semibold mb-3">
              🎯 Guidance / Instructions
            </label>
            <textarea
              rows="5"
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              placeholder="Add optional context or formatting tips..."
              className={tealInputClasses}
            />
          </div>
 
 
          {/* SUBMIT */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={!promptTitle.trim() || !promptText.trim()}
              className="px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold shadow-md hover:bg-teal-700 disabled:opacity-60 focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 transition-all text-lg cursor-pointer"
            >
              🚀 Submit Prompt
            </button>
 
            {statusMessage && (
              <p className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${getStatusClasses()}`}>
                {statusMessage}
              </p>
            )}
          </div>
        </form>
      </main>
 
 
      <Footer />
    </div>
  );
}
 
 
export default AddPromptPage;
 
 