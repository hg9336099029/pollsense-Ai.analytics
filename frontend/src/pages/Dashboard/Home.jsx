import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/dashboardLayout';
import FilterDropdown from '../../components/layout/filter';
import { axiosInstance } from '../../utils/axiosInstance';
import { API_PATH } from '../../utils/apipath';
import { FaRegBookmark, FaBookmark } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { SentimentBadge, TopicBadge, SentimentMiniBar } from '../../components/layout/SentimentBadge';

const Home = () => {
  const [polls, setPolls] = useState([]);
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [bookmarkedPollIds, setBookmarkedPollIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [openEndedResponses, setOpenEndedResponses] = useState({});  // { pollId: text }
  const [openEndedSubmitting, setOpenEndedSubmitting] = useState({}); // { pollId: bool }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all polls
        const pollsResponse = await axiosInstance.get(API_PATH.AUTH.GET_POLLS);
        const fetchedPolls = pollsResponse.data.polls || [];
        setPolls(fetchedPolls);
        setFilteredPolls(fetchedPolls);
      } catch (error) {
        console.error('Error fetching polls:', error);
        toast.error('Failed to load polls');
      } finally {
        setLoading(false);
      }

      // Fetch bookmarked polls separately — failure here should not block poll display
      try {
        const bookmarkedResponse = await axiosInstance.get(API_PATH.AUTH.GET_BOOOKMARK_POLLS);
        const bookmarkedPolls = bookmarkedResponse.data.bookmarkedPolls || [];
        const bookmarkedIds = new Set(bookmarkedPolls.map(p => p._id));
        setBookmarkedPollIds(bookmarkedIds);
      } catch (error) {
        console.warn('Could not load bookmarks:', error?.response?.status);
      }
    };
    fetchData();
  }, []);

  const handleVote = async (pollId, optionIndex) => {
    try {
      const response = await axiosInstance.patch(`${API_PATH.AUTH.VOTE_POLL}/${pollId}`, { optionIndex });
      const updatedPoll = response.data.poll;

      setPolls((prevPolls) =>
        prevPolls.map((poll) => (poll._id === updatedPoll._id ? updatedPoll : poll))
      );
      setFilteredPolls((prevPolls) =>
        prevPolls.map((poll) => (poll._id === updatedPoll._id ? updatedPoll : poll))
      );
      toast.success('Vote recorded!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to vote');
    }
  };

  const handleBookmark = async (pollId) => {
    try {
      await axiosInstance.post(`${API_PATH.AUTH.BOOKMARK_POLL}/${pollId}`);
      setBookmarkedPollIds((prev) => new Set([...prev, pollId]));
      toast.success('Poll bookmarked!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to bookmark');
    }
  };

  const handleOpenEndedSubmit = async (pollId) => {
    const text = (openEndedResponses[pollId] || '').trim();
    if (!text) {
      toast.error('Please write a response before submitting');
      return;
    }
    setOpenEndedSubmitting(prev => ({ ...prev, [pollId]: true }));
    try {
      const res = await axiosInstance.post(`${API_PATH.AUTH.SUBMIT_OPEN_ENDED}/${pollId}`, { response: text });
      const updatedPoll = res.data.poll;
      // Ensure options is always an array to avoid crashes in getTotalVotes
      if (!updatedPoll.options) updatedPoll.options = [];
      setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
      setFilteredPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
      setOpenEndedResponses(prev => ({ ...prev, [pollId]: '' }));
      toast.success('Response submitted!');
    } catch (error) {
      console.error('Open-ended submit error:', error?.response?.data || error?.message);
      toast.error(error?.response?.data?.message || 'Failed to submit response');
    } finally {
      setOpenEndedSubmitting(prev => ({ ...prev, [pollId]: false }));
    }
  };

  const handleFilterSelect = (filter) => {
    if (filter === 'All-polls') {
      setFilteredPolls(polls);
    } else {
      setFilteredPolls(polls.filter((poll) => poll.pollType === filter));
    }
  };

  const getTotalVotes = (poll) => {
    if (!poll.options || !Array.isArray(poll.options) || poll.options.length === 0) return 0;
    return poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  };

  const getVotePercentage = (votes, total) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading polls...</p>
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
            <h1 className="text-4xl font-bold text-gray-900">Explore Polls</h1>
            <p className="text-gray-600 mt-2">Discover and vote on community polls</p>
          </div>

          {/* Filter */}
          <div className="mb-8">
            <FilterDropdown onFilterSelect={handleFilterSelect} />
          </div>

          {/* Polls Grid */}
          {filteredPolls.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">No polls found</p>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPolls.map((poll) => {
                const totalVotes = getTotalVotes(poll);
                const isBookmarked = bookmarkedPollIds.has(poll._id);
                
                return (
                  <div key={poll._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                    {/* Poll Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {poll.createdBy?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">@{poll.createdBy?.username}</p>
                            <p className="text-xs text-gray-500">{new Date(poll.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBookmark(poll._id)}
                          className={`ml-4 p-2 rounded-lg transition-colors flex-shrink-0 ${
                            isBookmarked
                              ? 'text-orange-500 hover:text-orange-600'
                              : 'text-gray-400 hover:text-orange-500'
                          }`}
                        >
                          {isBookmarked ? <FaBookmark className="w-5 h-5" /> : <FaRegBookmark className="w-5 h-5" />}
                        </button>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{poll.question}</h3>
                    </div>

                    {/* Stats */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex gap-4 flex-wrap items-start">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{totalVotes}</p>
                        <p className="text-xs text-gray-600">Total Votes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600 capitalize">{poll.pollType}</p>
                        <p className="text-xs text-gray-600">Poll Type</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{poll.options.length}</p>
                        <p className="text-xs text-gray-600">Options</p>
                      </div>
                      {/* AI Sentiment badge — free from MongoDB cache */}
                      {poll.sentiment?.label && (
                        <div className="ml-auto flex items-center gap-2 flex-wrap">
                          <SentimentBadge label={poll.sentiment.label} score={poll.sentiment.score} />
                          {poll.sentiment.topic && <TopicBadge topic={poll.sentiment.topic} />}
                        </div>
                      )}
                    </div>
                    {/* AI Summary */}
                    {poll.sentiment?.summary && (
                      <div className="px-6 pt-3 pb-0">
                        <p className="text-xs italic text-gray-400">AI insight: {poll.sentiment.summary}</p>
                      </div>
                    )}

                    {/* Options */}
                    <div className="p-6 space-y-3">
                      {poll.pollType === 'yesno' && (
                        <>
                          {poll.options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleVote(poll._id, idx)}
                              className="w-full p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-all group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-800 group-hover:text-blue-600">{option.text}</span>
                                <span className="text-sm font-bold text-gray-600">{option.votes} votes • {getVotePercentage(option.votes, totalVotes)}%</span>
                              </div>
                              <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${getVotePercentage(option.votes, totalVotes)}%` }}></div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {poll.pollType === 'single choice' && (
                        <>
                          {poll.options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleVote(poll._id, idx)}
                              className="w-full p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-all group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-800 group-hover:text-blue-600">{option.text}</span>
                                <span className="text-sm font-bold text-gray-600">{option.votes} votes • {getVotePercentage(option.votes, totalVotes)}%</span>
                              </div>
                              <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${getVotePercentage(option.votes, totalVotes)}%` }}></div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {poll.pollType === 'rating' && (
                        <div className="flex gap-2 p-4 bg-gray-50 rounded-lg">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleVote(poll._id, star - 1)}
                              className="p-2 hover:bg-yellow-200 rounded transition-colors"
                            >
                              <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      )}

                      {poll.pollType === 'imagebased' && poll.images && (
                        <div className="grid grid-cols-2 gap-3">
                          {poll.images.map((img, idx) => {
                            const imgOption = poll.options?.[idx];
                            const imgVotes = imgOption?.votes || 0;
                            const imgPct = getVotePercentage(imgVotes, totalVotes);
                            return (
                              <button
                                key={idx}
                                onClick={() => handleVote(poll._id, idx)}
                                className="relative rounded-lg overflow-hidden group border-2 border-gray-200 hover:border-blue-400 transition-all"
                              >
                                <img src={img} alt={`Option ${idx + 1}`} className="w-full h-40 object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity" />
                                {/* Vote overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                                  <div className="flex items-center justify-between text-white text-xs mb-1">
                                    <span className="font-semibold">Option {idx + 1}</span>
                                    <span className="font-bold">{imgVotes} votes · {imgPct}%</span>
                                  </div>
                                  <div className="bg-white/30 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-400 h-full rounded-full transition-all" style={{ width: `${imgPct}%` }} />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {poll.pollType === 'open ended' && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          {/* Show existing responses count */}
                          {poll.comments?.length > 0 && (
                            <p className="text-xs text-gray-500 mb-2 font-medium">
                              {poll.comments.length} response{poll.comments.length !== 1 ? 's' : ''} submitted
                            </p>
                          )}
                          <textarea
                            placeholder="Share your thoughts..."
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none resize-none transition-colors"
                            rows="3"
                            value={openEndedResponses[poll._id] || ''}
                            onChange={e => setOpenEndedResponses(prev => ({ ...prev, [poll._id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenEndedSubmit(poll._id)}
                            disabled={!!openEndedSubmitting[poll._id]}
                            className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                          >
                            {openEndedSubmitting[poll._id] ? 'Submitting...' : 'Submit Response'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;