import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import QRScanner from './QRScanner';
import MyAttendance from './MyAttendance';

const StudentDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/scan" element={<QRScanner />} />
      <Route path="/my-attendance" element={<MyAttendance />} />
    </Routes>
  );
};

export default StudentDashboard; 