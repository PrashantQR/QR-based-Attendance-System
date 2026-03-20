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
import ExamHome from './exam/ExamHome';
import ExamPreview from './exam/ExamPreview';
import ExamInstructions from './exam/ExamInstructions';
import ExamStart from './exam/ExamStart';
import ExamActive from './exam/ExamActive';
import ExamSummary from './exam/ExamSummary';

const StudentDashboard = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/scan" element={<QRScanner />} />
        <Route path="/my-attendance" element={<MyAttendance />} />
        <Route path="/evaluate-instructor" element={<EvaluateInstructor />} />
        <Route path="/exam" element={<ExamHome />} />
        <Route path="/exam/scan" element={<ExamScanner />} />
        <Route path="/exam/active" element={<ExamActive />} />
        <Route path="/exam/preview/:testId" element={<ExamPreview />} />
        <Route
          path="/exam/instructions/:testId"
          element={<ExamInstructions />}
        />
        <Route path="/exam/start/:testId" element={<ExamStart />} />
        <Route path="/exam/take" element={<ExamTake />} />
        <Route path="/exam/result/:testId" element={<ExamResult />} />
        <Route path="/exam/summary/:testId" element={<ExamSummary />} />
        <Route path="/results" element={<StudentResults />} />
        <Route path="/results/:testId" element={<TestResultDetails />} />
      </Routes>
    </MainLayout>
  );
};

export default StudentDashboard; 