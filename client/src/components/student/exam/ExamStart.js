import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import ExamRunner from './ExamRunner';

const ExamStart = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [starting, setStarting] = useState(true);
  const [runData, setRunData] = useState(null);

  useEffect(() => {
    const startExam = async () => {
      setStarting(true);
      try {
        // token was stored at scan time
        const raw = localStorage.getItem(`exam_session_${String(testId)}`);
        const session = raw ? JSON.parse(raw) : {};
        const token = session?.token;

        if (!token) {
          toast.error('Exam session not found. Please scan QR again.');
          navigate('/student/exam/scan');
          return;
        }

        const res = await api.post('/exam/start', { testId, token });
        if (!res.data?.success && !res.data?.data) {
          toast.error(res.data?.message || 'Failed to start exam');
          navigate('/student/exam');
          return;
        }

        const data = res.data?.data || {};

        // Basic payload sanity
        if (!data?.testId || !Array.isArray(data?.questions)) {
          toast.error('Invalid exam payload');
          navigate('/student/exam');
          return;
        }

        setRunData({
          testId: data.testId,
          testTitle: data.title,
          subjectName: '', // subjectName not returned from /exam/start
          durationMinutes: data.durationMinutes,
          startedAt: data.startedAt,
          questions: (data.questions || []).map((q) => ({
            ...q,
            _id: String(q._id)
          })),
          initialAnswers: {}
        });
      } catch (error) {
        console.error('Exam start error:', error);
        const message =
          error.response?.data?.message || 'Failed to start exam';
        const isAlreadyStarted = /already started/i.test(message);
        if (isAlreadyStarted) {
          navigate('/student/exam/active');
          return;
        }
        toast.error(message);
        navigate('/student/exam/scan');
      } finally {
        setStarting(false);
      }
    };

    if (testId) startExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  if (starting) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Starting exam…</p>
        </div>
      </div>
    );
  }

  if (!runData) return null;

  return (
    <ExamRunner
      testId={runData.testId}
      testTitle={runData.testTitle}
      subjectName={runData.subjectName}
      durationMinutes={runData.durationMinutes}
      startedAt={runData.startedAt}
      questions={runData.questions}
      initialAnswers={runData.initialAnswers}
    />
  );
};

export default ExamStart;

