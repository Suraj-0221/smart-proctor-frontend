import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Card, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ id: '', name: '', exam: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.name || !form.exam) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');

    // Simulate auth
    await new Promise(r => setTimeout(r, 800));
    localStorage.setItem('sp_candidate', JSON.stringify(form));
    navigate('/exam');
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

        <Typography variant="h6" fontWeight="bold" gutterBottom>Candidate Sign-In</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Enter your details to begin the session. Your camera will be activated for verification.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Candidate ID"
              placeholder="e.g. CAND-2024-001"
              variant="outlined"
              fullWidth
              value={form.id}
              onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
            />
            <TextField
              label="Full Name"
              placeholder="As per registration"
              variant="outlined"
              fullWidth
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
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
              disabled={loading}
              sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Begin Exam Session →'}
            </Button>
          </Box>
        </form>

        <Alert severity="info" sx={{ mt: 4 }}>
          Camera access is required. Head pose is NOT penalized — only face presence is monitored.
        </Alert>
      </Card>
    </Container>
  );
}
