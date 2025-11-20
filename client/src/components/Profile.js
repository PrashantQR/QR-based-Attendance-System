import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaEnvelope, FaIdCard, FaGraduationCap, FaLock, FaPhone } from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || '',
    department: user?.department || '',
    year: user?.year || 1
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
      const result = await updateProfile(profileData);
      if (result.success) {
        setProfileData({
          name: user?.name || '',
          email: user?.email || '',
          mobileNumber: user?.mobileNumber || '',
          department: user?.department || '',
          year: user?.year || 1
        });
      }
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
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-white">Profile</h2>
          <p className="text-white-50">Manage your account information</p>
        </div>
      </div>

      <div className="row">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="nav flex-column nav-pills">
                <button
                  className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <FaUser className="me-2" />
                  Profile Information
                </button>
                <button
                  className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                >
                  <FaLock className="me-2" />
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          <div className="card">
            <div className="card-body">
              {activeTab === 'profile' ? (
                <div>
                  <h5 className="card-title mb-3">Profile Information</h5>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="name" className="form-label">
                          Full Name
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaUser />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={profileData.name}
                            onChange={handleProfileChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">
                          Email Address
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaEnvelope />
                          </span>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="mobileNumber" className="form-label">
                        Mobile Number
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaPhone />
                        </span>
                        <input
                          type="tel"
                          className="form-control"
                          id="mobileNumber"
                          name="mobileNumber"
                          value={profileData.mobileNumber}
                          onChange={handleProfileChange}
                          required
                          placeholder="Enter your 10-digit mobile number"
                          maxLength="10"
                        />
                      </div>
                    </div>

                    {user?.role === 'student' && (
                      <>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="studentId" className="form-label">
                              Student ID
                            </label>
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaIdCard />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                id="studentId"
                                value={user?.studentId}
                                disabled
                              />
                            </div>
                            <small className="text-muted">Student ID cannot be changed</small>
                          </div>

                          <div className="col-md-6 mb-3">
                            <label htmlFor="department" className="form-label">
                              Department
                            </label>
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaGraduationCap />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                id="department"
                                name="department"
                                value={profileData.department}
                                onChange={handleProfileChange}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label htmlFor="year" className="form-label">
                            Year
                          </label>
                          <select
                            className="form-select"
                            id="year"
                            name="year"
                            value={profileData.year}
                            onChange={handleProfileChange}
                            required
                          >
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            
                          </select>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Updating...
                        </>
                      ) : (
                        'Update Profile'
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <h5 className="card-title mb-3">Change Password</h5>
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="mb-3">
                      <label htmlFor="currentPassword" className="form-label">
                        Current Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">
                        New Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm New Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaLock />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Changing Password...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 