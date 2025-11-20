import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaQrcode, FaCopy, FaDownload, FaClock } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const QRGenerator = () => {
  const { user, isAuthenticated, token } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    course: '',
    validityMinutes: 10
  });
  const [generatedQR, setGeneratedQR] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateQR = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check authentication
    if (!isAuthenticated || !token) {
      toast.error('You must be logged in to generate QR codes');
      setLoading(false);
      return;
    }

    // Check if user is a teacher
    if (user?.role !== 'teacher') {
      toast.error('Only teachers can generate QR codes');
      setLoading(false);
      return;
    }

    console.log('Generating QR code with token:', token ? 'Present' : 'Missing');
    console.log('User:', user);
    console.log('Axios headers:', axios.defaults.headers.common);

    try {
      const response = await axios.post('/api/qr/generate', formData);
      setGeneratedQR(response.data.data);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      console.error('QR generation error:', error);
      const message = error.response?.data?.message || 'Failed to generate QR code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedQR) {
      navigator.clipboard.writeText(generatedQR.code);
      toast.success('QR Code copied to clipboard!');
    }
  };

  const downloadQR = () => {
    if (generatedQR) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `qr-code-${generatedQR.code}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = generatedQR.qrCodeImage;
    }
  };

  // Debug authentication state
  console.log('QR Generator - Auth State:', {
    isAuthenticated,
    user,
    token: token ? 'Present' : 'Missing',
    userRole: user?.role
  });

  // Show loading if authentication is still being checked
  if (!isAuthenticated && !user) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-white">Checking authentication...</p>
      </div>
    );
  }

  // Show error if user is not a teacher
  if (user && user.role !== 'teacher') {
    return (
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-danger">Access Denied</h3>
              <p>Only teachers can generate QR codes.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-white">Generate QR Code</h2>
          <p className="text-white-50">Create a new QR code for student attendance</p>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">QR Code Settings</h5>
              <form onSubmit={generateQR}>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Morning Class Attendance"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="location" className="form-label">
                    Location
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Room 101"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="course" className="form-label">
                    Course/Subject
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="validityMinutes" className="form-label">
                    Validity (minutes)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaClock />
                    </span>
                    <input
                      type="number"
                      className="form-control"
                      id="validityMinutes"
                      name="validityMinutes"
                      value={formData.validityMinutes}
                      onChange={handleChange}
                      min="1"
                      max="60"
                    />
                  </div>
                  <small className="text-muted">
                    QR code will expire after this time
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Generating QR Code...
                    </>
                  ) : (
                    <>
                      <FaQrcode className="me-2" />
                      Generate QR Code
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Generated QR Code</h5>
              
              {generatedQR ? (
                <div className="text-center">
                  <div className="qr-container mb-3">
                    <img 
                      src={generatedQR.qrCodeImage} 
                      alt="QR Code" 
                      className="img-fluid"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <strong>Code:</strong> {generatedQR.code}
                  </div>
                  
                  <div className="mb-3">
                    <strong>Expires:</strong> {new Date(generatedQR.expiresAt).toLocaleString()}
                  </div>
                  
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-outline-primary"
                      onClick={copyToClipboard}
                    >
                      <FaCopy className="me-2" />
                      Copy Code
                    </button>
                    <button
                      className="btn btn-outline-success"
                      onClick={downloadQR}
                    >
                      <FaDownload className="me-2" />
                      Download QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted">
                  <FaQrcode size={100} className="mb-3" />
                  <p>Generate a QR code to see it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {generatedQR && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">QR Code Details</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Description:</strong> {generatedQR.description}</p>
                    <p><strong>Location:</strong> {generatedQR.location}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Course/Subject:</strong> {generatedQR.course}</p>
                    <p><strong>Generated:</strong> {new Date(generatedQR.generatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator; 