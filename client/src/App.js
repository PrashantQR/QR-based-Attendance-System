import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import Profile from './components/Profile';
import LoadingSpinner from './components/LoadingSpinner';

const App = () => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('App - Auth State:', { isAuthenticated, loading, user: user?.name, role: user?.role });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.log('App - Not authenticated, showing login routes');
    return (
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route 
            path="/" 
            element={
              user?.role === 'teacher' 
                ? <Navigate to="/teacher" replace />
                : <Navigate to="/student" replace />
            } 
          />
          <Route 
            path="/teacher/*" 
            element={
              user?.role === 'teacher' 
                ? <TeacherDashboard />
                : <Navigate to="/student" replace />
            } 
          />
          <Route 
            path="/student/*" 
            element={
              user?.role === 'student' 
                ? <StudentDashboard />
                : <Navigate to="/teacher" replace />
            } 
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

export default App; 