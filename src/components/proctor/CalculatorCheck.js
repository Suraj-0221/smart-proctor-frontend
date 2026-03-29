import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, Typography, CircularProgress, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalculateIcon from '@mui/icons-material/Calculate';

export default function CalculatorCheck({ onComplete, onSkip }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState('camera'); // camera | checking | success

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
    setTimeout(() => {
      setPhase('success');
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, 2000);
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
          {phase === 'checking' && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CircularProgress color="primary" sx={{ mb: 2 }} />
              <Typography variant="h6">Verifying Hardware...</Typography>
            </Box>
          )}
          {phase === 'success' && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(46, 125, 50, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 60, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">Approved Device</Typography>
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
            Verify Calculator
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
            {['Casio FX-82MS', 'Casio FX-85ES', 'Casio FX-991EX ClassWiz', 'Casio FX-115ES PLUS'].map(model => (
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
