import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import ExamRunner from './ExamRunner';

const ExamActive = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [runData, setRunData] = useState(null);

  useEffect(() => {
    const fetchActive = async () => {
      setLoading(true);
      try {
        const res = await api.get('/exam/active');
        const data = res.data?.data;
        if (!res.data?.success || !data) {
          toast.info('No active test found.');
          navigate('/student/exam');
          return;
        }

        const initialAnswers = {};
        for (const a of data.answers || []) {
          if (!a?.questionId) continue;
          const qid = String(a.questionId);
          initialAnswers[qid] = a.selected || null;
        }

        setRunData({
          testId: data.testId,
          testTitle: data.testTitle,
          subjectName: data.subjectName,
          durationMinutes: data.durationMinutes,
          startedAt: data.startedAt,
          questions: (data.questions || []).map((q) => ({
            ...q,
            _id: String(q._id)
          })),
          initialAnswers
        });
      } catch (error) {
        console.error('Fetch active exam error:', error);
        toast.error(error.response?.data?.message || 'Failed to load active test');
        navigate('/student/exam');
      } finally {
        setLoading(false);
      }
    };

    fetchActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading active test…</p>
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

export default ExamActive;

