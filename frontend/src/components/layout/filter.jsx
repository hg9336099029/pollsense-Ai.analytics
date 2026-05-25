import React, { useState } from 'react';

const FilterDropdown = ({ onFilterSelect }) => {
  const filters = [
    {
      id: "All-polls",
      label: "All Polls",
      description: "View all available polls"
    },
    {
      id: "yesno",
      label: "Yes / No",
      description: "Binary choice polls"
    },
    {
      id: "single choice",
      label: "Single Choice",
      description: "Choose one option"
    },
    {
      id: "rating",
      label: "Rating",
      description: "Rate 1–5 stars"
    },
    {
      id: "imagebased",
      label: "Image-Based",
      description: "Visual options"
    },
    {
      id: "open ended",
      label: "Open-Ended",
      description: "Share your thoughts"
    }
  ];

  const [selectedFilter, setSelectedFilter] = useState("All-polls");

  const handleFilterClick = (filterId) => {
    setSelectedFilter(filterId);
    onFilterSelect(filterId);
  };

  const selectedFilterObj = filters.find(f => f.id === selectedFilter);

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filter by Poll Type</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                className={`group relative px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-center ${
                  selectedFilter === filter.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {filter.label}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                  {filter.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile View - Horizontal Scroll */}
      <div className="md:hidden">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-700">Filter</h3>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterClick(filter.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    selectedFilter === filter.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Filter Display */}
      <div className="mt-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500">Currently Viewing</p>
            <p className="text-sm font-semibold text-gray-800">{selectedFilterObj?.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDropdown;