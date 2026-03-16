import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    return user?.role === 'teacher' ? '/teacher' : '/student';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to={getDashboardLink()}>
          📱 QR Attendance System
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
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
                <li className="nav-item">
                  <Link className="nav-link" to="/teacher/evaluation">
                    Instructor Evaluation
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

          {user && (
            <div className="dropdown ms-auto">
              <button
                className="btn btn-light dropdown-toggle d-flex align-items-center"
                id="profileDropdown"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <FaUser className="me-1" />
                <span className="d-none d-sm-inline">{user.name}</span>
              </button>
              <ul
                className="dropdown-menu dropdown-menu-end"
                aria-labelledby="profileDropdown"
              >
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <FaCog className="me-2" />
                    Profile
                  </Link>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;