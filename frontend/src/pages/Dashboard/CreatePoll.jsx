import React, { useState } from "react";
import { DashboardLayout } from "../../components/layout/dashboardLayout";
import { API_PATH } from "../../utils/apipath";
import { axioscreatepoll } from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CreatePoll = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [selectedButton, setSelectedButton] = useState("");
  const [options, setOptions] = useState([]);
  const [fileInputs, setFileInputs] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const pollTypes = [
    { id: "yesno",       label: "Yes / No",     desc: "Simple binary choice" },
    { id: "single choice", label: "Single Choice", desc: "One answer only" },
    { id: "rating",      label: "Rating",        desc: "1–5 scale" },
    { id: "imagebased",  label: "Image-Based",   desc: "Visual options" },
    { id: "open ended",  label: "Open-Ended",    desc: "Free text response" },
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!question.trim()) newErrors.question = "Question is required";
    if (!selectedButton) newErrors.pollType = "Poll type must be selected";

    if (["single choice", "yesno", "rating"].includes(selectedButton)) {
      if (options.length < 2) newErrors.options = "At least 2 options required";
      else if (options.some(opt => !opt.trim())) newErrors.options = "No empty options allowed";
    }

    if (selectedButton === "imagebased") {
      if (fileInputs.filter(f => f).length < 2) newErrors.images = "At least 2 images required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("question", question);
      formData.append("pollType", selectedButton);

      if (selectedButton === "imagebased") {
        fileInputs.forEach((file, idx) => {
          if (file) formData.append("images", file);
        });
      } else {
        formData.append("options", JSON.stringify(options));
      }

      const response = await axioscreatepoll.post(API_PATH.AUTH.CREATE_POLL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        toast.success("Poll created successfully!");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to create poll";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePollTypeSelection = (type) => {
    setSelectedButton(type);
    setErrors({});
    if (type === "yesno") setOptions(["Yes", "No"]);
    else if (type === "rating") setOptions(["1", "2", "3", "4", "5"]);
    else setOptions([]);
    setFileInputs([]);
    setImagePreviews([]);
  };

  const handleImageChange = (index, file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      const newFiles = [...fileInputs];
      newFiles[index] = file;
      setFileInputs(newFiles);

      const newPreviews = [...imagePreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setImagePreviews(newPreviews);
    }
  };

  const removeImage = (index) => {
    const newFiles = fileInputs.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setFileInputs(newFiles);
    setImagePreviews(newPreviews);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Create a Poll</h1>
            <p className="text-gray-600 mt-2">Engage your community with an interactive poll</p>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            {/* Question Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Poll Question <span className="text-red-600">*</span>
              </label>
              <textarea
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (errors.question) setErrors({ ...errors, question: "" });
                }}
                className={`w-full p-4 border-2 rounded-lg focus:outline-none resize-none transition-colors ${
                  errors.question ? "border-red-500 focus:border-red-600" : "border-gray-200 focus:border-blue-500"
                }`}
                placeholder="Ask something interesting..."
                rows="4"
              />
              {errors.question && <p className="text-red-600 text-sm mt-2">❌ {errors.question}</p>}
            </div>

            {/* Poll Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Choose Poll Type <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {pollTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handlePollTypeSelection(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedButton === type.id
                        ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                        : "border-gray-200 hover:border-blue-300 bg-white hover:shadow-md"
                    }`}
                  >
                    <p className={`font-bold text-sm ${selectedButton === type.id ? 'text-blue-700' : 'text-gray-900'}`}>{type.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                  </button>
                ))}
              </div>
              {errors.pollType && <p className="text-red-600 text-sm mt-2">❌ {errors.pollType}</p>}
            </div>

            {/* Options Section */}
            {(selectedButton === "single choice" || selectedButton === "yesno" || selectedButton === "rating") && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Options {selectedButton !== "yesno" && selectedButton !== "rating" && <span className="text-red-600">*</span>}
                </label>
                <div className="space-y-2">
                  {options.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...options];
                          newOptions[idx] = e.target.value;
                          setOptions(newOptions);
                          if (errors.options) setErrors({ ...errors, options: "" });
                        }}
                        disabled={selectedButton === "yesno" || selectedButton === "rating"}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-50 transition-colors"
                      />
                      {selectedButton === "single choice" && (
                        <button
                          onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {selectedButton === "single choice" && options.length < 6 && (
                  <button
                    onClick={() => {
                      setOptions([...options, ""]);
                      if (errors.options) setErrors({ ...errors, options: "" });
                    }}
                    className="mt-3 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors font-medium"
                  >
                    + Add Option
                  </button>
                )}
                {errors.options && <p className="text-red-600 text-sm mt-2">❌ {errors.options}</p>}
              </div>
            )}

            {/* Image Upload Section */}
            {selectedButton === "imagebased" && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Upload Images (Max 4) <span className="text-red-600">*</span>
                </label>
                
                {/* Image Preview Grid */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Input Fields */}
                <div className="space-y-2">
                  {[...Array(4)].map((_, idx) => (
                    <label key={idx} className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(idx, e.target.files[0])}
                        className="hidden"
                      />
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-sm font-medium text-gray-700">
                          {fileInputs[idx] ? `✓ Image ${idx + 1} selected` : `Click to upload image ${idx + 1}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.images && <p className="text-red-600 text-sm mt-2">❌ {errors.images}</p>}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate("/dashboard")}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {loading ? "Creating..." : "Create Poll"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatePoll;