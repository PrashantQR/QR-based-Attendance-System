import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import DashboardHome from './DashboardHome';
import QRGenerator from './QRGenerator';
import AttendanceView from './AttendanceView';
import EvaluationDashboard from './EvaluationDashboard';
import StudentList from './StudentList';
import ExamManager from './ExamManager';
import TeacherResults from './TeacherResults';
import TestResultDetails from '../results/TestResultDetails';

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
        <Route path="/results" element={<TeacherResults />} />
        <Route path="/results/:testId" element={<TestResultDetails />} />
      </Routes>
    </MainLayout>
  );
};

export default TeacherDashboard; 