import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    return user?.role === 'teacher' ? '/teacher' : '/student';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          📱 QR Attendance System
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to={getDashboardLink()}>
                Dashboard
              </Link>
            </li>
            {user?.role === 'teacher' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/teacher/qr-generate">
                    Generate QR
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/teacher/attendance">
                    View Attendance
                  </Link>
                </li>
              </>
            )}
            {user?.role === 'student' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/student/scan">
                    Scan QR
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/student/my-attendance">
                    My Attendance
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="navbar-nav">
            <div className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <FaUser className="me-1" />
                {user?.name}
              </button>
              {showDropdown && (
                <div className="dropdown-menu show">
                  <Link className="dropdown-item" to="/profile">
                    <FaCog className="me-2" />
                    Profile
                  </Link>
                  <button
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 