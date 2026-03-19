import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import DashboardHome from './DashboardHome';
import QRScanner from './QRScanner';
import MyAttendance from './MyAttendance';
import EvaluateInstructor from './EvaluateInstructor';
import ExamScanner from './ExamScanner';
import ExamTake from './ExamTake';
import ExamResult from './ExamResult';
import StudentResults from './StudentResults';
import TestResultDetails from '../results/TestResultDetails';

const StudentDashboard = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/scan" element={<QRScanner />} />
        <Route path="/my-attendance" element={<MyAttendance />} />
        <Route path="/evaluate-instructor" element={<EvaluateInstructor />} />
        <Route path="/exam/scan" element={<ExamScanner />} />
        <Route path="/exam/take" element={<ExamTake />} />
        <Route path="/exam/result/:testId" element={<ExamResult />} />
        <Route path="/results" element={<StudentResults />} />
        <Route path="/results/:testId" element={<TestResultDetails />} />
      </Routes>
    </MainLayout>
  );
};

export default StudentDashboard; 