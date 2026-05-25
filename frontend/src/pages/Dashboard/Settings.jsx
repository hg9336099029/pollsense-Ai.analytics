import React, { useState, useContext, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/dashboardLayout';
import { UserContext } from '../../context/userContext';
import { axiosInstance } from '../../utils/axiosInstance';
import { API_PATH } from '../../utils/apipath';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('account');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Account Settings State
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState({});

  // Password Settings State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        setFullname(parsedUser.fullname || '');
        setEmail(parsedUser.email || '');
        setUsername(parsedUser.username || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [user]);

  // Save Account Settings
  const handleSaveAccountSettings = async () => {
    const newErrors = {};
    if (!fullname.trim()) newErrors.fullname = 'Full Name is required';
    if (!username.trim()) newErrors.username = 'Username is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(API_PATH.AUTH.UPDATE_PROFILE, {
        fullname: fullname.trim(),
        username: username.trim(),
      });

      if (response.status === 200) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserData(updatedUser);
        toast.success('Account settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating account settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Save Password
  const handleSavePassword = async () => {
    const newErrors = {};
    if (!currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!newPassword) newErrors.newPassword = 'New password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (newPassword && newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setPasswordErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(API_PATH.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });

      if (response.status === 200) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
        toast.success('Password changed successfully');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Save Notifications
  const handleSaveNotifications = () => {
    localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
    localStorage.setItem('pushNotifications', JSON.stringify(pushNotifications));
    toast.success('Notification settings saved');
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <nav className="space-y-2 p-4">
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium ${
                      activeTab === 'account'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="inline w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Account Settings
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium ${
                      activeTab === 'password'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">🔐</span> Change Password
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium ${
                      activeTab === 'notifications'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">🔔</span> Notifications
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                {/* Account Settings Tab */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h2>
                      <p className="text-gray-600">Update your account information</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullname}
                          onChange={(e) => {
                            setFullname(e.target.value);
                            if (errors.fullname) setErrors({ ...errors, fullname: '' });
                          }}
                          disabled={loading}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                            errors.fullname ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Enter your full name"
                        />
                        {errors.fullname && <p className="text-red-600 text-sm mt-1">❌ {errors.fullname}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            if (errors.username) setErrors({ ...errors, username: '' });
                          }}
                          disabled={loading}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                            errors.username ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Enter your username"
                        />
                        {errors.username && <p className="text-red-600 text-sm mt-1">❌ {errors.username}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                          placeholder="Email cannot be changed"
                        />
                        <p className="text-xs text-gray-500 mt-2">Email address cannot be changed for security reasons</p>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveAccountSettings}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}

                {/* Change Password Tab */}
                {activeTab === 'password' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
                      <p className="text-gray-600">Update your password to keep your account secure</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                          }}
                          disabled={loading}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                            passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Enter your current password"
                        />
                        {passwordErrors.currentPassword && <p className="text-red-600 text-sm mt-1">❌ {passwordErrors.currentPassword}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                          }}
                          disabled={loading}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                            passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Enter new password (min 8 characters)"
                        />
                        {passwordErrors.newPassword && <p className="text-red-600 text-sm mt-1">❌ {passwordErrors.newPassword}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                          }}
                          disabled={loading}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${
                            passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Confirm new password"
                        />
                        {passwordErrors.confirmPassword && <p className="text-red-600 text-sm mt-1">❌ {passwordErrors.confirmPassword}</p>}
                      </div>
                    </div>

                    <button
                      onClick={handleSavePassword}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h2>
                      <p className="text-gray-600">Choose how you want to receive notifications</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <h3 className="font-semibold text-gray-900">📧 Email Notifications</h3>
                          <p className="text-sm text-gray-600">Receive poll updates and activity via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailNotifications}
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div>
                          <h3 className="font-semibold text-gray-900">🔔 Push Notifications</h3>
                          <p className="text-sm text-gray-600">Receive in-app notifications for polls</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pushNotifications}
                            onChange={(e) => setPushNotifications(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveNotifications}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      Save Notification Settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;