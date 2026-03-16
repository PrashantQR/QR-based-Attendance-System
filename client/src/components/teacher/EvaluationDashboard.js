import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const EvaluationDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get(`/evaluation/instructor/${user._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setData(response.data.data);
      } catch (err) {
        console.error('Error fetching evaluation data:', err);
        setError(
          err.response?.data?.message || 'An error occurred while loading evaluations.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!data) {
    return <div className="alert alert-info">No evaluation data available.</div>;
  }

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-white">Instructor Evaluation Report</h2>
          <p className="text-white-50">
            View anonymous feedback and ratings submitted by your students.
          </p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="stats-card">
            <div className="stats-number">{data.totalEvaluations}</div>
            <div className="stats-label">Total Evaluations</div>
          </div>
        </div>
        <div className="col-md-8 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Average Ratings</h5>
              <div className="row">
                <div className="col-sm-6 mb-2">
                  <p className="mb-1">
                    <strong>Teaching Quality:</strong> {data.averages.teachingQuality}
                  </p>
                </div>
                <div className="col-sm-6 mb-2">
                  <p className="mb-1">
                    <strong>Communication:</strong> {data.averages.communication}
                  </p>
                </div>
                <div className="col-sm-6 mb-2">
                  <p className="mb-1">
                    <strong>Interaction:</strong> {data.averages.interaction}
                  </p>
                </div>
                <div className="col-sm-6 mb-2">
                  <p className="mb-1">
                    <strong>Subject Knowledge:</strong> {data.averages.subjectKnowledge}
                  </p>
                </div>
              </div>

              <div className="mt-3 px-3 py-2 bg-light rounded-3">
                <small className="text-muted d-block mb-1">Quality Scale</small>
                <small className="text-muted d-block">
                  <strong>1</strong> – Poor&nbsp;&nbsp;|&nbsp;&nbsp;
                  <strong>2</strong> – Average&nbsp;&nbsp;|&nbsp;&nbsp;
                  <strong>3</strong> – Good&nbsp;&nbsp;|&nbsp;&nbsp;
                  <strong>4</strong> – Best&nbsp;&nbsp;|&nbsp;&nbsp;
                  <strong>5</strong> – Excellent (Highest Quality)
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Rating Breakdown</h5>
              <small className="text-muted d-block mb-2">
                Counts of ratings 1–5 for each category.
              </small>
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>1</th>
                      <th>2</th>
                      <th>3</th>
                      <th>4</th>
                      <th>5</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Teaching Quality</td>
                      <td>{data.breakdown.teachingQuality[1]}</td>
                      <td>{data.breakdown.teachingQuality[2]}</td>
                      <td>{data.breakdown.teachingQuality[3]}</td>
                      <td>{data.breakdown.teachingQuality[4]}</td>
                      <td>{data.breakdown.teachingQuality[5]}</td>
                    </tr>
                    <tr>
                      <td>Communication</td>
                      <td>{data.breakdown.communication[1]}</td>
                      <td>{data.breakdown.communication[2]}</td>
                      <td>{data.breakdown.communication[3]}</td>
                      <td>{data.breakdown.communication[4]}</td>
                      <td>{data.breakdown.communication[5]}</td>
                    </tr>
                    <tr>
                      <td>Interaction</td>
                      <td>{data.breakdown.interaction[1]}</td>
                      <td>{data.breakdown.interaction[2]}</td>
                      <td>{data.breakdown.interaction[3]}</td>
                      <td>{data.breakdown.interaction[4]}</td>
                      <td>{data.breakdown.interaction[5]}</td>
                    </tr>
                    <tr>
                      <td>Subject Knowledge</td>
                      <td>{data.breakdown.subjectKnowledge[1]}</td>
                      <td>{data.breakdown.subjectKnowledge[2]}</td>
                      <td>{data.breakdown.subjectKnowledge[3]}</td>
                      <td>{data.breakdown.subjectKnowledge[4]}</td>
                      <td>{data.breakdown.subjectKnowledge[5]}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Anonymous Comments</h5>
              {data.comments.length === 0 ? (
                <p className="text-muted">No comments yet.</p>
              ) : (
                <ul className="list-group">
                  {data.comments.map((c, index) => (
                    <li key={index} className="list-group-item">
                      <p className="mb-1">{c.comment}</p>
                      <small className="text-muted">
                        Course: {c.course} • {new Date(c.createdAt).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationDashboard;

