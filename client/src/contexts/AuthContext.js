import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false, // Always start as false, let checkAuth determine this
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.data,
        token: action.payload.data.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check if user is authenticated on app load only
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('AuthContext - Checking auth with token:', token ? 'Present' : 'Missing');
      
      if (token) {
        try {
          // Set token in axios headers before making the request
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('AuthContext - Set axios header with token');
          
          const response = await axios.get('/api/auth/me');
          console.log('AuthContext - Auth check successful:', response.data.data);
          
          // Preserve token so subsequent API calls include it
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { data: { ...response.data.data, token } }
          });
        } catch (error) {
          console.error('AuthContext - Auth check failed:', error);
          // Clear everything on auth failure
          delete axios.defaults.headers.common['Authorization'];
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('AuthContext - No token found, setting loading to false');
        // If no token, make sure we're not authenticated
        dispatch({ type: 'SET_LOADING', payload: false });
        if (state.isAuthenticated) {
          dispatch({ type: 'LOGOUT' });
        }
      }
    };

    checkAuth();
  }, []); // Empty dependency array - only run on mount

  const login = async (email, password) => {
    console.log('AuthContext - Starting login process');
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });
      
      console.log('AuthContext - Login response:', response.data);
      
      // Set token immediately in axios headers and localStorage
      const token = response.data.data.token;
      const userData = response.data.data;
      
      console.log('AuthContext - Setting token:', token ? 'Present' : 'Missing');
      console.log('AuthContext - User data:', userData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      
      // Dispatch success with user data (not the full response)
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { data: userData }
      });
      
      console.log('AuthContext - Login successful, user data:', userData);
      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('AuthContext - Login failed:', error);
      const message = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      
      // Set token immediately in axios headers
      const token = response.data.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data
      });
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    // Clear everything
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    toast.info('Logged out successfully');
  };

  const clearAuthState = () => {
    console.log('AuthContext - Clearing corrupted auth state');
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    sessionStorage.clear();
    dispatch({ type: 'LOGOUT' });
    
    // Force a page reload to clear any cached state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/me', profileData);
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.data
      });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    clearAuthState,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 