import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import { axiosInstance } from '../../utils/axiosInstance';
import { API_PATH } from '../../utils/apipath';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './dashboardLayout.css';
import Navbar from './Navbar';

export const DashboardLayout = ({ children }) => {
    const { user, clearUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userData, setUserData] = useState(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUserData(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

        if (user) {
            setUserData(user);
        }
    }, [user]);

    const isLoggedIn = !!localStorage.getItem('accessToken');

    const handleLogout = async () => {
        try {
            await axiosInstance.post(API_PATH.AUTH.LOGOUT);

            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');

            clearUserDetails();

            toast.success('Logged out successfully');

            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);

            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            clearUserDetails();
            toast.error('Logout failed, but cleared local data');
            navigate('/login', { replace: true });
        } finally {
            setIsMenuOpen(false);
        }
    };

    const displayName = userData?.username || user?.username || 'User';
    const profileImageUrl = userData?.profileImageUrl || user?.profileImageUrl;
    const userInitial = displayName?.charAt(0).toUpperCase() || 'U';
    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
            isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl flex flex-col border-r border-gray-700 hidden lg:flex">
                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Pollsense Ai</h1>
                            <p className="text-xs text-gray-400">Analytics</p>
                        </div>
                    </div>
                </div>

                <nav className="mt-8 flex-1 px-4 space-y-2">
                    <NavLink
                        to="/dashboard"
                        className={navLinkClass}
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span className="font-medium">Dashboard</span>
                    </NavLink>

                    {/* Sentiment AI Dashboard */}
                    <NavLink
                        to="/sentiment-dashboard"
                        className={navLinkClass}
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M6.343 17.657l-.707.707M17.657 17.657l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                        <span className="font-medium">AI Sentiment</span>
                    </NavLink>

                    <NavLink
                        to="/home"
                        className={navLinkClass}
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 3a2 2 0 00-2 2v2c0 1.1-.9 2-2 2s2 .9 2 2v2a2 2 0 002 2h5l-1.293-1.293a1 1 0 011.414-1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 00-1.414 1.414L10 5H5z" />
                        </svg>
                        <span className="font-medium">Explore</span>
                    </NavLink>

                    {isLoggedIn && (
                        <>
                            <NavLink
                                to="/create-poll"
                                className={navLinkClass}
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">Create Poll</span>
                            </NavLink>

                            <NavLink
                                to="/my-polls"
                                className={navLinkClass}
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                                </svg>
                                <span className="font-medium">My Polls</span>
                            </NavLink>

                            <NavLink
                                to="/voted-polls"
                                className={navLinkClass}
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">Voted Polls</span>
                            </NavLink>

                            <NavLink
                                to="/bookmarks"
                                className={navLinkClass}
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                </svg>
                                <span className="font-medium">Bookmarks</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 space-y-3">
                    {isLoggedIn ? (
                        <>
                            {/* User Profile Card */}
                            <Link
                                to="/edit-profile"
                                className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                                    {profileImageUrl ? (
                                        <img
                                            src={profileImageUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('Failed to load profile image in sidebar:', profileImageUrl);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        userInitial
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                    <p className="text-xs text-gray-300 truncate">@{displayName}</p>
                                </div>
                            </Link>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200 font-semibold text-sm"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                </svg>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 font-semibold text-sm"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <Navbar />

                {/* Page Content */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};
