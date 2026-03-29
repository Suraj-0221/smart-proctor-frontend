import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Grid, Card, CardContent, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  LinearProgress, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const MOCK_SESSIONS = [
  { id: 'S001', name: 'Alice Johnson',   exam: 'CS-FINAL-2024', risk: 0.08, violations: 1, date: '2024-03-10', status: 'passed' },
  { id: 'S002', name: 'Bob Martínez',    exam: 'CS-FINAL-2024', risk: 0.42, violations: 5, date: '2024-03-10', status: 'review' },
  { id: 'S003', name: 'Chen Wei',        exam: 'CS-FINAL-2024', risk: 0.71, violations: 9, date: '2024-03-10', status: 'flagged' },
  { id: 'S004', name: 'Dana Okafor',     exam: 'ML-MID-2024',   risk: 0.05, violations: 0, date: '2024-03-11', status: 'passed' },
  { id: 'S005', name: 'Elena Petrov',    exam: 'ML-MID-2024',   risk: 0.29, violations: 3, date: '2024-03-11', status: 'review' },
];

const STATUS = {
  passed:  { label: 'PASSED',  color: 'success' },
  review:  { label: 'REVIEW',  color: 'warning' },
  flagged: { label: 'FLAGGED', color: 'error' },
};

export default function Dashboard() {
  const navigate = useNavigate();

  const totalSessions = MOCK_SESSIONS.length;
  const flagged       = MOCK_SESSIONS.filter(s => s.status === 'flagged').length;
  const avgRisk       = Math.round(MOCK_SESSIONS.reduce((a, s) => a + s.risk, 0) / totalSessions * 100);
  const passed        = MOCK_SESSIONS.filter(s => s.status === 'passed').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 1200, mx: 'auto' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight="bold" letterSpacing={1.5}>
            ADMIN DASHBOARD
          </Typography>
          <Typography variant="h4" fontWeight="bold">Session Overview</Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/exam')}
          sx={{ fontWeight: 'bold' }}
        >
          New Exam Session
        </Button>
      </Box>

      {/* Stats row */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Sessions" value={totalSessions} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Flagged" value={flagged} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Avg Risk" value={`${avgRisk}%`} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Clean Sessions" value={passed} color="success" />
        </Grid>
      </Grid>

      {/* Sessions Table */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">Recent Sessions</Typography>
          <Typography variant="body2" color="text.secondary">{totalSessions} total</Typography>
        </Box>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Candidate</TableCell>
                <TableCell>Exam Code</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Violations</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK_SESSIONS.map((s) => {
                const st = STATUS[s.status];
                const riskPct = Math.round(s.risk * 100);
                
                let riskCol = 'success';
                if (riskPct >= 30 && riskPct < 60) riskCol = 'warning';
                if (riskPct >= 60) riskCol = 'error';

                return (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{s.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" color="text.secondary">{s.exam}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{s.date}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={riskPct} 
                          color={riskCol} 
                          sx={{ width: 60, height: 6, borderRadius: 3 }} 
                        />
                        <Typography variant="body2" color={riskCol + '.main'} fontWeight="bold">{riskPct}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color={s.violations > 0 ? 'warning.main' : 'success.main'}>
                        {s.violations}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={st.label} color={st.color} size="small" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

function StatCard({ label, value, color }) {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 3 }}>
      <Box 
        sx={{ 
          position: 'absolute', top: 0, right: 0, width: 4, height: '100%', 
          bgcolor: color + '.main', opacity: 0.8 
        }} 
      />
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h3" fontWeight="bold" color={color + '.main'} sx={{ mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight="medium">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
