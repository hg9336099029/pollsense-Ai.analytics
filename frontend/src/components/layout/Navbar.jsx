import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import { axiosInstance } from '../../utils/axiosInstance';
import { API_PATH } from '../../utils/apipath';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, clearUserDetails } = useContext(UserContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    votedPolls: 0,
    bookmarkedPolls: 0,
    userPolls: 0
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        // console.log('User data loaded:', parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    if (user) {
      setUserData(user);
    }
  }, [user]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const votedResponse = await axiosInstance.get(API_PATH.AUTH.GET_VOTED_POLLS);
        const bookmarkedResponse = await axiosInstance.get(API_PATH.AUTH.GET_BOOOKMARK_POLLS);
        const userPollsResponse = await axiosInstance.get(API_PATH.AUTH.GET_USERPOLLS);

        setUserStats({
          votedPolls: votedResponse.data.votedPolls?.length || 0,
          bookmarkedPolls: bookmarkedResponse.data.bookmarkedPolls?.length || 0,
          userPolls: userPollsResponse.data.polls?.length || 0
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    if (userData) {
      fetchUserStats();
    }
  }, [userData]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post(API_PATH.AUTH.LOGOUT);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      clearUserDetails();
      setUserData(null);
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      clearUserDetails();
      setUserData(null);
      navigate('/login', { replace: true });
    }
  };

  const displayName = userData?.username || 'User';
  const displayFullname = userData?.fullname || 'User';
  const displayEmail = userData?.email || 'user@example.com';
  const profileImageUrl = userData?.profileImageUrl;
  const userInitial = displayName?.charAt(0).toUpperCase() || 'U';

  // console.log('Profile Image URL:', profileImageUrl);

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-3 flex justify-between items-center">
        {/* Left - Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Pollsense Ai
            </h1>
            <p className="text-xs text-gray-500">Analytics</p>
          </div>
        </Link>

        {/* Right - Stats and Profile */}
        <div className="flex items-center gap-6">
          {userData ? (
            <>
              {/* Stats Section */}
              <div className="hidden lg:flex items-center gap-4">
                {/* Voted Polls */}
                <Link
                  to="/voted-polls"
                  className="flex flex-col items-center px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <span className="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
                    {userStats.votedPolls}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">Voted</span>
                </Link>

                {/* Bookmarked Polls */}
                <Link
                  to="/bookmarks"
                  className="flex flex-col items-center px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors group"
                >
                  <span className="text-2xl font-bold text-orange-500 group-hover:scale-110 transition-transform">
                    {userStats.bookmarkedPolls}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">Bookmarked</span>
                </Link>

                {/* Created Polls */}
                <Link
                  to="/my-polls"
                  className="flex flex-col items-center px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors group"
                >
                  <span className="text-2xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
                    {userStats.userPolls}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">Created</span>
                </Link>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px h-8 bg-gray-200"></div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load profile image:', profileImageUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">@{displayName}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-slide-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                          {profileImageUrl ? (
                            <img
                              src={profileImageUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            userInitial
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{displayFullname}</p>
                          <p className="text-xs text-blue-100">@{displayName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Email */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Email Address</p>
                        <p className="text-sm text-gray-900 mt-1 break-words">{displayEmail}</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-center">
                          <p className="text-lg font-bold text-blue-600">{userStats.votedPolls}</p>
                          <p className="text-xs text-gray-600">Voted</p>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-center">
                          <p className="text-lg font-bold text-orange-500">{userStats.bookmarkedPolls}</p>
                          <p className="text-xs text-gray-600">Saved</p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-center">
                          <p className="text-lg font-bold text-purple-600">{userStats.userPolls}</p>
                          <p className="text-xs text-gray-600">Created</p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 pt-3 space-y-2">
                        {/* Edit Profile Link */}
                        <Link
                          to="/edit-profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <span className="text-lg">👤</span>
                          Edit Profile
                        </Link>

                        {/* Logout Button */}
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border-t border-gray-200 mt-2 pt-3 font-semibold"
                        >
                          <span className="text-lg">🚪</span>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;