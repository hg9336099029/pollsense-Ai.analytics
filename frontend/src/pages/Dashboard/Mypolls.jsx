import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/dashboardLayout';
import FilterDropdown from '../../components/layout/filter';
import { axiosInstance } from '../../utils/axiosInstance';
import { API_PATH } from '../../utils/apipath';
import { toast } from 'react-toastify';
import { SentimentBadge, TopicBadge, SentimentMiniBar } from '../../components/layout/SentimentBadge';

const MyPolls = () => {
  const [polls, setPolls] = useState([]);
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All-polls');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATH.AUTH.GET_USERPOLLS);
      const fetchedPolls = response.data.polls || [];
      setPolls(fetchedPolls);
      setFilteredPolls(fetchedPolls);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    if (filter === 'All-polls') {
      setFilteredPolls(polls);
    } else {
      setFilteredPolls(polls.filter(poll => poll.pollType === filter));
    }
  };

  const handleDeleteClick = (poll) => {
    setPollToDelete(poll);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`${API_PATH.AUTH.DELETE_POLL}/${pollToDelete._id}`);
      setPolls(polls.filter(poll => poll._id !== pollToDelete._id));
      setFilteredPolls(filteredPolls.filter(poll => poll._id !== pollToDelete._id));
      setShowDeleteModal(false);
      setPollToDelete(null);
      toast.success('Poll deleted successfully');
    } catch (error) {
      toast.error('Failed to delete poll');
    }
  };

  const getTotalVotes = (poll) => {
    return poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  };

  const getVotePercentage = (votes, total) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your polls...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">My Polls</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your polls • {polls.length} total</p>
          </div>

          {/* Filter */}
          <div className="mb-8">
            <FilterDropdown onFilterSelect={handleFilterSelect} />
          </div>

          {/* Polls */}
          {filteredPolls.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">No polls found</p>
              <p className="text-gray-500">Start by creating a new poll</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPolls.map((poll) => {
                const totalVotes = getTotalVotes(poll);
                return (
                  <div key={poll._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                    {/* Poll Header */}
                    <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{poll.question}</h3>
                        <div className="flex gap-2 flex-wrap">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {poll.pollType.charAt(0).toUpperCase() + poll.pollType.slice(1)}
                          </span>
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            {totalVotes} votes
                          </span>
                          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                            {poll.options.length} options
                          </span>
                          {poll.sentiment?.label && <SentimentBadge label={poll.sentiment.label} score={poll.sentiment.score} showScore={false} />}
                          {poll.sentiment?.topic && <TopicBadge topic={poll.sentiment.topic} />}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteClick(poll)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* Poll Stats */}
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                      <p className="text-sm text-gray-600 mb-4">Created {new Date(poll.createdAt).toLocaleDateString()}</p>
                      {poll.sentiment?.summary && (
                        <p className="text-xs italic text-gray-400 mb-3">🤖 AI says: "{poll.sentiment.summary}"</p>
                      )}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{totalVotes}</p>
                          <p className="text-xs text-gray-600">Total Votes</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{poll.options.length}</p>
                          <p className="text-xs text-gray-600">Options</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{poll.voters?.length || 0}</p>
                          <p className="text-xs text-gray-600">Participants</p>
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="p-6 space-y-3">
                      {poll.options.map((option, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-900">{option.text}</span>
                            <span className="text-sm text-gray-600 font-bold">{option.votes} ({getVotePercentage(option.votes, totalVotes)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300"
                              style={{ width: `${getVotePercentage(option.votes, totalVotes)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Sentiment mini-bar */}
                    {poll.sentiment?.score !== undefined && (
                      <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                        <SentimentMiniBar score={poll.sentiment.score} showLabel={true} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Delete Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Poll?</h3>
                <p className="text-gray-600 mb-6">This action cannot be undone. All votes will be lost.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyPolls;