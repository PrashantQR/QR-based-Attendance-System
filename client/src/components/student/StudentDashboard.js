import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import QRScanner from './QRScanner';
import MyAttendance from './MyAttendance';
import EvaluateInstructor from './EvaluateInstructor';

const StudentDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/scan" element={<QRScanner />} />
      <Route path="/my-attendance" element={<MyAttendance />} />
      <Route path="/evaluate-instructor" element={<EvaluateInstructor />} />
    </Routes>
  );
};

export default StudentDashboard; 