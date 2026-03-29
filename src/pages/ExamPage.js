import React, { useState, useCallback, useRef } from 'react';
import { Box, Button, Card, Typography, LinearProgress, Badge, Grid, Paper, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import FaceCalibration from '../components/proctor/FaceCalibration';
import HandsCheck from '../components/proctor/HandsCheck';
import CalculatorCheck from '../components/proctor/CalculatorCheck';
import WebcamFeed from '../components/proctor/WebcamFeed';
import TabMonitor from '../components/proctor/TabMonitor';
import RiskChart from '../components/proctor/RiskChart';
import WarningBadges from '../components/proctor/WarningBadges';

const EXAM_QUESTIONS = [
  {
    id: 1,
    text: 'Which data structure provides O(1) average-case lookup time?',
    options: ['Linked List', 'Hash Table', 'Binary Search Tree', 'Stack'],
    correct: 1,
  },
  {
    id: 2,
    text: 'What does the "S" in SOLID principles stand for?',
    options: ['Scalability', 'Single Responsibility', 'Simplicity', 'Synchronisation'],
    correct: 1,
  },
  {
    id: 3,
    text: 'Which HTTP method is idempotent?',
    options: ['POST', 'PATCH', 'PUT', 'DELETE'],
    correct: 2,
  },
  {
    id: 4,
    text: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
    correct: 2,
  },
  {
    id: 5,
    text: 'Which React hook replaces componentDidMount, componentDidUpdate, and componentWillUnmount?',
    options: ['useState', 'useCallback', 'useEffect', 'useMemo'],
    correct: 2,
  },
];

export default function ExamPage() {
  const [phase,        setPhase]        = useState('calibration'); // calibration | hands_check | calculator_check | exam | submitted
  const [baseline,     setBaseline]     = useState(null);
  const [riskScore,    setRiskScore]    = useState(0);
  const [riskHistory,  setRiskHistory]  = useState([]);
  const [violations,   setViolations]   = useState([]);
  const [answers,      setAnswers]      = useState({});
  const [currentQ,     setCurrentQ]     = useState(0);
  const [faceCount,    setFaceCount]    = useState(1);

  const riskRef = useRef(0);

  const handleCalibrationComplete = useCallback((bl) => {
    setBaseline(bl);
    setPhase('hands_check');
  }, []);

  const handleHandsCheckComplete = useCallback(() => {
    setPhase('calculator_check');
  }, []);

  const handleCalculatorCheckComplete = useCallback(() => {
    setPhase('exam');
  }, []);

  const handleViolation = useCallback((v) => {
    setViolations(prev => [...prev, { ...v, ts: Date.now() }]);
    riskRef.current = Math.min(1, riskRef.current + v.penalty);
    setRiskScore(riskRef.current);
    setRiskHistory(prev => [...prev, riskRef.current]);
  }, []);

  const handleTabSwitch = useCallback((info) => {
    const penalty = 0.10;
    setViolations(prev => [...prev, { type: 'TAB_SWITCH', penalty, ...info, ts: Date.now() }]);
    riskRef.current = Math.min(1, riskRef.current + penalty);
    setRiskScore(riskRef.current);
    setRiskHistory(prev => [...prev, riskRef.current]);
  }, []);

  const handleFaceCountChange = useCallback((c) => setFaceCount(c), []);

  const handleAnswer = (qIdx, optIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    setPhase('submitted');
    const cand = JSON.parse(localStorage.getItem('sp_candidate') || '{}');
    const sessionData = {
      ...cand,
      riskHistory,
      violations,
      riskScore,
      answers,
      date: new Date().toISOString()
    };
    localStorage.setItem('sp_session', JSON.stringify(sessionData));
  };

  const riskPct   = Math.round(riskScore * 100);
  let riskColor = 'success';
  if (riskPct >= 30 && riskPct < 60) riskColor = 'warning';
  if (riskPct >= 60) riskColor = 'error';

  // ── Calibration ────────────────────────────────────────────────────────────
  if (phase === 'calibration') {
    return (
      <Box sx={{ width: '100%', pt: 4 }}>
        <FaceCalibration onComplete={handleCalibrationComplete} />
      </Box>
    );
  }

  // ── Pretest Hands Check ────────────────────────────────────────────────────
  if (phase === 'hands_check') {
    return (
      <Box sx={{ width: '100%', pt: 4 }}>
        <HandsCheck onComplete={handleHandsCheckComplete} onSkip={handleHandsCheckComplete} />
      </Box>
    );
  }

  // ── Pretest Calculator Check ───────────────────────────────────────────────
  if (phase === 'calculator_check') {
    return (
      <Box sx={{ width: '100%', pt: 4 }}>
        <CalculatorCheck onComplete={handleCalculatorCheckComplete} onSkip={handleCalculatorCheckComplete} />
      </Box>
    );
  }

  // ── Submitted ──────────────────────────────────────────────────────────────
  if (phase === 'submitted') {
    const correct = EXAM_QUESTIONS.filter((q, i) => answers[i] === q.correct).length;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 10 }}>
        <Card sx={{ p: 6, maxWidth: 600, width: '100%', textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h3" gutterBottom>Exam Submitted</Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, mt: 4, mb: 4 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Score</Typography>
              <Typography variant="h4" color="primary">{correct} / {EXAM_QUESTIONS.length}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">Risk</Typography>
              <Typography variant="h4" color={riskColor + '.main'}>{riskPct}%</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">Violations</Typography>
              <Typography variant="h4" color={violations.length > 0 ? 'warning.main' : 'success.main'}>{violations.length}</Typography>
            </Box>
          </Box>
          <WarningBadges violations={violations} />
        </Card>
      </Box>
    );
  }

  // ── Exam ───────────────────────────────────────────────────────────────────
  const q = EXAM_QUESTIONS[currentQ];

  return (
    <Box sx={{ display: 'flex', gap: 4, height: '100%' }}>
      {/* Left: Questions */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="overline" color="text.secondary" fontWeight="bold">
            QUESTION {currentQ + 1} / {EXAM_QUESTIONS.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {EXAM_QUESTIONS.map((_, i) => (
              <Box
                key={i}
                onClick={() => setCurrentQ(i)}
                sx={{
                  width: 32,
                  height: 8,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: answers[i] !== undefined 
                    ? 'primary.main' 
                    : i === currentQ ? 'grey.400' : 'grey.200',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: i !== currentQ && answers[i] === undefined ? 'grey.300' : undefined }
                }}
              />
            ))}
          </Box>
        </Box>

        <Card sx={{ p: 4, flex: 1 }}>
          <Typography variant="h5" sx={{ mb: 4, lineHeight: 1.5 }}>
            {q.text}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {q.options.map((opt, i) => {
              const isSelected = answers[currentQ] === i;
              return (
                <Button
                  key={i}
                  variant={isSelected ? 'contained' : 'outlined'}
                  color={isSelected ? 'primary' : 'inherit'}
                  onClick={() => handleAnswer(currentQ, i)}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 2, px: 3,
                    borderWidth: isSelected ? 0 : 1,
                    boxShadow: isSelected ? 2 : 0,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    textAlign: 'left'
                  }}
                >
                  <Typography variant="button" sx={{ width: 24, flexShrink: 0, opacity: 0.7 }}>
                    {String.fromCharCode(65 + i)}
                  </Typography>
                  {opt}
                </Button>
              );
            })}
          </Box>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', pt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
            disabled={currentQ === 0}
            size="large"
          >
            Previous
          </Button>
          {currentQ < EXAM_QUESTIONS.length - 1 ? (
            <Button variant="contained" onClick={() => setCurrentQ(c => c + 1)} size="large">
              Next
            </Button>
          ) : (
            <Button variant="contained" color="error" onClick={handleSubmit} size="large">
              Submit Exam
            </Button>
          )}
        </Box>
      </Box>

      {/* Right: Proctor panel */}
      <Box sx={{ width: 340, display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 24 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
            <Typography variant="overline" color="text.secondary">RISK SCORE</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="h4" color={riskColor + '.main'} fontWeight="bold">{riskPct}%</Typography>
              <Chip size="small" label={riskColor.toUpperCase()} color={riskColor} variant="outlined" />
            </Box>
          </Box>
          <LinearProgress variant="determinate" value={riskPct} color={riskColor} sx={{ height: 6, borderRadius: 3 }} />
        </Paper>

        <WebcamFeed
          baseline={baseline}
          onViolation={handleViolation}
          onFaceCountChange={handleFaceCountChange}
        />

        <TabMonitor onTabSwitch={handleTabSwitch} />

        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="overline" color="text.secondary" gutterBottom display="block">RISK HISTORY</Typography>
          <RiskChart history={riskHistory} />
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="overline" color="text.secondary" gutterBottom display="block">VIOLATIONS</Typography>
          <WarningBadges violations={violations} />
        </Paper>
      </Box>
    </Box>
  );
}
