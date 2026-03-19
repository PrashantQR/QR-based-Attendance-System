import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import DashboardHome from './DashboardHome';
import QRGenerator from './QRGenerator';
import AttendanceView from './AttendanceView';
import EvaluationDashboard from './EvaluationDashboard';
import StudentList from './StudentList';
import ExamManager from './ExamManager';

const TeacherDashboard = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/qr-generate" element={<QRGenerator />} />
        <Route path="/attendance" element={<AttendanceView />} />
        <Route path="/evaluation" element={<EvaluationDashboard />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/exams" element={<ExamManager />} />
      </Routes>
    </MainLayout>
  );
};

export default TeacherDashboard; 