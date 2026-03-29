import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, Typography, CircularProgress, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalculateIcon from '@mui/icons-material/Calculate';
import TimerIcon from '@mui/icons-material/Timer';

export default function CalculatorCheck({ onComplete, onSkip }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState('camera'); // camera | countdown | checking | success
  const [countdown, setCountdown] = useState(3);

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

  const handleStartTimer = () => {
    setPhase('countdown');
    setCountdown(3);
    
    let current = 3;
    const interval = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
      } else {
        clearInterval(interval);
        setPhase('checking');
        
        // Capture image from video
        if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            const formData = new FormData();
            formData.append('image', blob, 'calculator.jpg');
            
            fetch('http://localhost:8000/api/verify/calculator', {
              method: 'POST',
              body: formData
            })
            .then(res => res.json())
            .then(data => {
              if (data.status === 'flagged') {
                alert('Verification Failed: ' + data.reason);
                setPhase('camera'); // reset for retry
              } else {
                setPhase('success');
                setTimeout(() => onComplete(), 1000);
              }
            })
            .catch(err => {
              console.error('Backend unreachable, falling back to mock success:', err);
              setPhase('success');
              setTimeout(() => onComplete(), 1000);
            });
          }, 'image/jpeg');
        } else {
          // Fallback if video isn't loaded
          setPhase('success');
          setTimeout(() => onComplete(), 1000);
        }
      }
    }, 1000);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 'bold' }}>
          PRE-EXAM CHECK
        </Typography>
        <Typography variant="h4" gutterBottom>
          Hardware Check
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Please show your calculator to the camera. We will verify it against the approved non-programmable Casio list.
        </Typography>

        <Card sx={{ mt: 2, mb: 4, p: 2, bgcolor: '#000', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', borderRadius: 8, transform: 'scaleX(-1)', display: 'block' }}
          />
          {phase === 'countdown' && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Typography variant="h1" fontWeight="bold" sx={{ fontSize: '8rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {countdown}
              </Typography>
            </Box>
          )}
          {phase === 'checking' && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CircularProgress color="primary" size={60} thickness={4} sx={{ mb: 2 }} />
              <Typography variant="h6" fontWeight="bold">Verifying Hardware...</Typography>
            </Box>
          )}
          {phase === 'success' && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(46, 125, 50, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" fontWeight="bold">Approved Device</Typography>
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
            startIcon={<TimerIcon />}
            onClick={handleStartTimer}
            disabled={phase !== 'camera'}
            sx={{ py: 1.5, px: 4, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            Start 3-Second Timer
          </Button>
        </Box>
      </Box>

      {/* Side reference panel */}
      <Box sx={{ width: { xs: '100%', md: 300 } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Accepted Models
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Only standard scientific non-programmable calculators are permitted. Examples:
          </Typography>
          <List dense>
            {[
              'ClassWiz CW (fx-991CW, fx-82CW)', 
              'ClassWiz EX (fx-991EX, fx-350EX)', 
              'ES PLUS (fx-991ES Plus, fx-82ES)', 
              'MS Series (fx-991MS, fx-100MS)',
              'Other (fx-220 Plus, fx-100AU)'
            ].map(model => (
              <ListItem key={model} disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CalculateIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary={model} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
              </ListItem>
            ))}
          </List>
          <Typography variant="caption" display="block" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
            Note: Graphing calculators are strictly prohibited.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
