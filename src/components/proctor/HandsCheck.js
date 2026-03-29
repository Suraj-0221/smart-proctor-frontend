import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, Typography, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function HandsCheck({ onComplete, onSkip }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState('camera'); // camera | checking | success

  // Start Camera
  useEffect(() => {
    let active = true;
    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Camera error', err);
      }
    };
    startCam();
    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleCheck = () => {
    setPhase('checking');
    // Simulate API call for checking image
    setTimeout(() => {
      setPhase('success');
      // Hold success screen for 1 second before continuing
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, 2000);
  };

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', p: 3, textAlign: 'center' }}>
      <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 'bold' }}>
        PRE-EXAM CHECK
      </Typography>
      <Typography variant="h4" gutterBottom>
        Hands Verification
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Please show both your hands clearly to the camera to verify that no notes are written on them.
      </Typography>

      <Card sx={{ mt: 4, mb: 4, p: 2, bgcolor: '#000', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', borderRadius: 8, transform: 'scaleX(-1)', display: 'block' }}
        />
        {phase === 'checking' && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <CircularProgress color="primary" sx={{ mb: 2 }} />
            <Typography variant="h6">Analyzing Image...</Typography>
          </Box>
        )}
        {phase === 'success' && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(46, 125, 50, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 60, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">Hands Clear</Typography>
          </Box>
        )}
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<SkipNextIcon />}
          onClick={onSkip}
          disabled={phase !== 'camera'}
        >
          Skip Verification
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={<CameraAltIcon />}
          onClick={handleCheck}
          disabled={phase !== 'camera'}
        >
          Take Picture & Check
        </Button>
      </Box>
    </Box>
  );
}
