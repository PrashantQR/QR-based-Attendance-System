import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaPhone } from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(profileData);
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subjects =
    Array.isArray(user?.subjects) && user.subjects.length > 0
      ? user.subjects
      : [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Profile</h1>
      <p className="text-gray-400 mb-6">
        Manage your account information
      </p>

      {/* Tabs */}
      <div className="flex mb-4 border-b border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'profile'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Profile Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'password'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Change Password
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-xl p-6 shadow-lg border border-slate-700">
        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Full Name</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3">
                  <FaUser className="text-gray-500 text-sm" />
                  <input
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="w-full py-2 bg-transparent text-sm text-gray-100 focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Email</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3">
                  <FaEnvelope className="text-gray-500 text-sm" />
                  <input
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full py-2 bg-transparent text-sm text-gray-100 focus:outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Mobile</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3">
                  <FaPhone className="text-gray-500 text-sm" />
                  <input
                    name="mobileNumber"
                    type="tel"
                    maxLength={10}
                    value={profileData.mobileNumber}
                    onChange={handleProfileChange}
                    className="w-full py-2 bg-transparent text-sm text-gray-100 focus:outline-none"
                    placeholder="Enter your 10-digit mobile number"
                  />
                </div>
              </div>
            </div>

            {/* Subjects chips */}
            {user?.role === 'teacher' && (
              <div className="mt-2">
                <label className="text-sm text-gray-400">Subjects</label>
                {subjects.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-2">
                    No subjects specified
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subjects.map((sub) => (
                      <span
                        key={sub}
                        className="bg-emerald-400 text-slate-900 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-emerald-400 hover:bg-emerald-500 text-slate-900 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Current Password</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3">
                <FaLock className="text-gray-500 text-sm" />
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full py-2 bg-transparent text-sm text-gray-100 focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">New Password</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3">
                  <FaLock className="text-gray-500 text-sm" />
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full py-2 bg-transparent text-sm text-gray-100 focus:outline-none"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">
                  Confirm New Password
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3">
                  <FaLock className="text-gray-500 text-sm" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full py-2 bg-transparent text-sm text-gray-100 focus:outline-none"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-emerald-400 hover:bg-emerald-500 text-slate-900 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;