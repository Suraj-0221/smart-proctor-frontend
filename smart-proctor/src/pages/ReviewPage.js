import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Grid, Card, Divider, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import RiskChart from '../components/proctor/RiskChart';
import WarningBadges from '../components/proctor/WarningBadges';

export default function ReviewPage() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = React.useState(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('sp_session');
    if (saved) {
      try {
        setSessionData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse session data', e);
      }
    }
  }, []);

  // Mock session data for review fallback
  const mockViolations = [
    { type: 'NO_FACE',        penalty: 0.15, ts: Date.now() - 120000 },
    { type: 'TAB_SWITCH',     penalty: 0.10, ts: Date.now() - 90000  },
    { type: 'MULTIPLE_FACES', penalty: 0.20, ts: Date.now() - 60000  },
    { type: 'NO_FACE',        penalty: 0.15, ts: Date.now() - 30000  },
  ];

  const mockHistory = Array.from({ length: 40 }, (_, i) => {
    const base = i / 40;
    return Math.min(1, base + (Math.random() - 0.5) * 0.05);
  });

  const isMock = !sessionData;
  const violations = isMock ? mockViolations : sessionData.violations;
  const history = isMock ? mockHistory : sessionData.riskHistory;

  const finalRisk = isMock 
    ? Math.round(history[history.length - 1] * 100) 
    : Math.round(sessionData.riskScore * 100);
  
  let riskColor = 'success';
  if (finalRisk >= 30 && finalRisk < 60) riskColor = 'warning';
  if (finalRisk >= 60) riskColor = 'error';

  const candName = sessionData?.name || 'Bob Martínez';
  const examCode = sessionData?.exam || 'CS-FINAL-2024';
  const dateStr  = sessionData?.date ? new Date(sessionData.date).toLocaleDateString() : '2024-03-10';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 1200, mx: 'auto' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight="bold" letterSpacing={1.5}>
            SESSION REVIEW
          </Typography>
          <Typography variant="h4" fontWeight="bold">Exam Analysis</Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Session Summary</Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <SummaryItem xs={6} label="Candidate"  value={candName}    />
              <SummaryItem xs={6} label="Exam Code"  value={examCode}   />
              <SummaryItem xs={6} label="Date"       value={dateStr}       />
              <SummaryItem xs={6} label="Duration"   value="45 min"           />
              <SummaryItem xs={6} label="Risk Score" value={`${finalRisk}%`} valueColor={riskColor + '.main'} />
              <SummaryItem xs={6} label="Violations" value={violations.length} valueColor="warning.main" />
            </Grid>
          </Card>
        </Grid>

        {/* Risk chart Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Risk Timeline</Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: 200 }}>
              <RiskChart history={history} />
            </Box>
          </Card>
        </Grid>

        {/* Violations Timeline */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Violations Detected</Typography>
              <Typography variant="body2" color="text.secondary">{violations.length} events</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 4 }}>
              <WarningBadges violations={violations} />
            </Box>

            <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {violations.map((v, i) => {
                const minAgo = Math.round((Date.now() - v.ts) / 60000);
                return (
                  <Box key={i} sx={{ position: 'relative', display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Timestamp Dot */}
                    <Box 
                      sx={{ 
                        position: 'absolute', left: -21, top: '50%', transform: 'translateY(-50%)',
                        width: 10, height: 10, bgcolor: 'warning.main', borderRadius: '50%',
                        border: '2px solid white'
                      }} 
                    />
                    
                    <Typography 
                      variant="body1" 
                      fontWeight="bold" 
                      sx={{ textTransform: 'capitalize', minWidth: 140 }}
                    >
                      {v.type.replace('_', ' ')}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace" sx={{ minWidth: 80 }}>
                      {minAgo}m ago
                    </Typography>
                    
                    <Chip 
                      size="small" 
                      color="error"
                      variant="outlined"
                      label={`+${Math.round(v.penalty * 100)}% risk`} 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function SummaryItem({ label, value, valueColor, xs }) {
  return (
    <Grid item xs={xs}>
      <Typography variant="overline" color="text.secondary" display="block" lineHeight={1}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color={valueColor || 'text.primary'}>
        {value}
      </Typography>
    </Grid>
  );
}
