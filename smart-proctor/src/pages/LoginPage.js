import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Card, Typography, TextField, Button, CircularProgress, Alert, Step, Stepper, StepLabel, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

import { validateRollNo, getStudentByRollNo, getStudentPhoto } from '../services/StudentDatabase';
import { initializeFaceDetector, performFaceAuthentication } from '../services/FaceAuthentication';

export default function LoginPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [phase, setPhase] = useState('form'); // form | camera | verifying
  const [form, setForm] = useState({ rollNo: '', exam: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [student, setStudent] = useState(null);
  const [faceAuthResult, setFaceAuthResult] = useState(null);
  const [faceDetectorReady, setFaceDetectorReady] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState('Initializing...');

  // Initialize face detector on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeFaceDetector();
        setFaceDetectorReady(true);
      } catch (err) {
        console.error('Failed to initialize face detector:', err);
        setError('Face detection unavailable. Proceeding with ID verification only.');
      }
    };
    init();
  }, []);

  // Auto-show student name when valid roll number is entered
  useEffect(() => {
    if (form.rollNo) {
      const rollNoRegex = /^\d{2}[A-Z]{3}\d{4}$/;
      if (rollNoRegex.test(form.rollNo)) {
        const studentData = validateRollNo(form.rollNo);
        if (studentData) {
          setStudent(studentData);
          setError('');
        } else {
          setStudent(null);
          setError(`Roll No ${form.rollNo} not found in the system.`);
        }
      } else {
        setStudent(null);
      }
    } else {
      setStudent(null);
    }
  }, [form.rollNo]);

  // Start video stream
  const startVideoStream = async () => {
    try {
      setVerificationProgress('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setVerificationProgress('Camera ready. Position your face in the frame.');
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', err);
    }
  };

  // Capture frame from video
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      return canvasRef.current;
    }
    return null;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.rollNo || !form.exam) {
      setError('Both Roll No and Exam Code are required.');
      return;
    }

    // Validate roll number format (e.g., 25MCS1012)
    const rollNoRegex = /^\d{2}[A-Z]{3}\d{4}$/;
    if (!rollNoRegex.test(form.rollNo)) {
      setError('Invalid roll number format. Expected: 25MCS1012');
      return;
    }

    // Check if student exists in database
    const studentData = validateRollNo(form.rollNo);
    if (!studentData) {
      setError(`Roll No ${form.rollNo} not found in the system.`);
      return;
    }

    setStudent(studentData);
    setError('');
    setPhase('camera');
    
    // Start camera
    setTimeout(() => startVideoStream(), 500);
  };

  const handleVerifyFace = async () => {
    if (!student) return;
    
    setLoading(true);
    setVerificationProgress('Capturing face...');

    try {
      const canvas = captureFrame();
      if (!canvas) {
        setError('Failed to capture frame. Try again.');
        setLoading(false);
        return;
      }

      setVerificationProgress('Analyzing face...');

      const referenceImage = getStudentPhoto(student.rollNo);
      if (!referenceImage) {
        setError('Reference image not found.');
        setLoading(false);
        return;
      }

      // Perform face authentication
      const result = await performFaceAuthentication(canvas, referenceImage);

      setFaceAuthResult(result);
      setVerificationProgress('Verification complete.');

      if (result.match) {
        // Success - proceed to exam
        setPhase('verifying');
        setError('');
        
        setTimeout(() => {
          localStorage.setItem('sp_candidate', JSON.stringify({
            rollNo: student.rollNo,
            name: student.name,
            exam: form.exam,
            faceVerified: true,
            verifiedAt: new Date().toISOString()
          }));
          
          // Stop video stream
          if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
          }
          
          navigate('/exam');
        }, 1500);
      } else {
        const similarity = (result.similarity * 100).toFixed(1);
        const required = 60;
        console.log(`[LoginAuth] Face mismatch: ${similarity}% (need ${required}%)`);
        setError(`Face verification failed! Similarity: ${similarity}% (Required: ${required}%). Try again or check lighting.`);
        setPhase('camera');
      }
    } catch (err) {
      setError(`Verification error: ${err.message}`);
      console.error('Face auth error:', err);
    }

    setLoading(false);
  };

  const handleBackToForm = () => {
    // Stop video
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setPhase('form');
    setStudent(null);
    setFaceAuthResult(null);
    setError('');
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Card sx={{ w: '100%', p: { xs: 3, md: 5 }, borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box 
            sx={{ 
              width: 48, height: 48, bgcolor: 'primary.main', 
              color: 'white', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', borderRadius: 2, fontWeight: 'bold', fontSize: 20
            }}
          >
            SP
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">Smart Proctor</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>AI-POWERED EXAM MONITORING</Typography>
          </Box>
        </Box>

        {/* ── FORM PHASE ─────────────────────────────────────────────────── */}
        {phase === 'form' && (
          <>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Candidate Sign-In</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Enter your roll number to get started. Your face will be verified against your reference image.
            </Typography>

            <form onSubmit={handleFormSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Roll Number"
                  placeholder="e.g. 25MCS1012"
                  variant="outlined"
                  fullWidth
                  value={form.rollNo}
                  onChange={e => setForm(p => ({ ...p, rollNo: e.target.value.toUpperCase() }))}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />

                {/* Auto-show student name when valid roll number is entered */}
                {student && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="overline" sx={{ letterSpacing: 1 }}>
                      Registered Student
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {student.name}
                    </Typography>
                    <Box
                      component="img"
                      src={student.photo}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        mt: 1.5,
                        border: '3px solid white',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                )}

                <TextField
                  label="Exam Code"
                  placeholder="e.g. CS-FINAL-2024"
                  variant="outlined"
                  fullWidth
                  value={form.exam}
                  onChange={e => setForm(p => ({ ...p, exam: e.target.value }))}
                />

                {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  disabled={loading || !student}
                  sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Proceed to Face Verification →'}
                </Button>
              </Box>
            </form>

            <Alert severity="info" sx={{ mt: 4 }}>
              ✓ Only valid roll numbers are allowed to proceed<br/>
              ✓ Your face will be compared with your reference image<br/>
              ✓ Camera access is required
            </Alert>
          </>
        )}

        {/* ── CAMERA PHASE ──────────────────────────────────────────────── */}
        {phase === 'camera' && student && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">Face Verification</Typography>
                <Typography variant="body2" color="text.secondary">
                  {student.name} ({student.rollNo})
                </Typography>
              </Box>
              <Chip label="Roll Verified ✓" color="success" variant="outlined" />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              {/* Reference Image */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Reference Image
                </Typography>
                <Box
                  component="img"
                  src={getStudentPhoto(student.rollNo)}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'primary.main'
                  }}
                />
              </Box>

              {/* Live Camera */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Live Camera
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'secondary.main',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#000'
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              </Box>
            </Box>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {faceAuthResult && (
              <Alert 
                severity={faceAuthResult.match ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                {faceAuthResult.match ? (
                  <>
                    <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Face match confirmed! Similarity: {(faceAuthResult.similarity * 100).toFixed(1)}%
                  </>
                ) : (
                  <>
                    <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Face match insufficient. Similarity: {(faceAuthResult.similarity * 100).toFixed(1)}%. Try again.
                  </>
                )}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              {verificationProgress}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleBackToForm}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleVerifyFace}
                disabled={loading}
                startIcon={<CameraAltIcon />}
                sx={{ py: 1.5, fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Face'}
              </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </>
        )}

        {/* ── VERIFYING PHASE ────────────────────────────────────────────── */}
        {phase === 'verifying' && faceAuthResult?.match && (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Verification Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Welcome, {student?.name}. Starting exam session...
            </Typography>
            <CircularProgress />
          </Box>
        )}
      </Card>
    </Container>
  );
}
