import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
  const { user, token, isAuthenticated, loading, clearAuthState } = useAuth();

  return (
    <div className="card mb-4">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">🔍 Authentication Debug Info</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6>Authentication State:</h6>
            <ul className="list-unstyled">
              <li><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</li>
              <li><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</li>
              <li><strong>Token:</strong> {token ? 'Present' : 'Missing'}</li>
              <li><strong>Token Preview:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</li>
            </ul>
          </div>
          <div className="col-md-6">
            <h6>User Info:</h6>
            <ul className="list-unstyled">
              <li><strong>User:</strong> {user ? 'Present' : 'Missing'}</li>
              <li><strong>Name:</strong> {user?.name || 'N/A'}</li>
              <li><strong>Email:</strong> {user?.email || 'N/A'}</li>
              <li><strong>Role:</strong> {user?.role || 'N/A'}</li>
            </ul>
          </div>
        </div>
        <div className="mt-3">
          <h6>Local Storage:</h6>
          <p><strong>Token in localStorage:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
        </div>
        <div className="mt-3">
          <h6>Axios Headers:</h6>
          <p><strong>Authorization Header:</strong> {window.axios?.defaults?.headers?.common?.Authorization ? 'Present' : 'Missing'}</p>
        </div>
        
        {/* Show fix button if there's a mismatch */}
        {isAuthenticated && !token && (
          <div className="mt-3 p-3 bg-warning rounded">
            <h6 className="text-dark">⚠️ Authentication Issue Detected</h6>
            <p className="text-dark mb-2">You appear to be logged in but the token is missing. This will cause API calls to fail.</p>
            <div className="d-flex gap-2 flex-wrap">
              <button 
                className="btn btn-danger btn-sm"
                onClick={clearAuthState}
              >
                Clear Auth State & Log Out
              </button>
              <button 
                className="btn btn-warning btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  } catch (error) {
                    console.error('Error clearing storage:', error);
                    window.location.reload();
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                Force Clear & Reload
              </button>
              <button 
                className="btn btn-info btn-sm"
                onClick={() => {
                  // Manual fix - go to login page
                  window.location.href = '/login';
                }}
              >
                Go to Login Page
              </button>
            </div>
            <div className="mt-2 p-2 bg-light rounded">
              <small className="text-dark">
                <strong>Manual Fix:</strong> If buttons don't work, press F12, go to Console tab, and type: <code>localStorage.clear(); window.location.reload();</code>
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugAuth;
