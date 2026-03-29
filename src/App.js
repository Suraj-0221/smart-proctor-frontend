import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import MediaPipeFaceDetection from './services/MediaPipeFaceDetection';
import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import ExamPage     from './pages/ExamPage';
import ReviewPage   from './pages/ReviewPage';
import './styles/index.css';

import { 
  ThemeProvider, createTheme, CssBaseline, Box, Drawer, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Typography, Divider 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Clean material blue
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    success: { main: '#2e7d32' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

function AppShell() {
  const location = useLocation();
  const isLogin  = location.pathname === '/';

  if (isLogin) {
    return <LoginPage />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 4, bgcolor: 'background.default' }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exam"      element={<ExamPage />}  />
          <Route path="/review"    element={<ReviewPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/exam',      label: 'Exam',      icon: <AssignmentIcon />  },
    { to: '/review',    label: 'Review',    icon: <FactCheckIcon />  },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box 
          sx={{ 
            width: 32, height: 32, bgcolor: 'primary.main', 
            color: 'white', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', borderRadius: 1, fontWeight: 'bold' 
          }}
        >
          SP
        </Box>
        <Typography variant="h6" color="text.primary">Smart Proctor</Typography>
      </Box>
      <Divider />
      <Box sx={{ overflow: 'auto', flex: 1, pt: 1 }}>
        <List>
          {navItems.map((item) => (
            <ListItem key={item.to} disablePadding sx={{ px: 1, mb: 0.5 }}>
              <ListItemButton 
                component={NavLink} 
                to={item.to}
                selected={location.pathname === item.to}
                sx={{ 
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' }
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: 'primary.light',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.to ? 'inherit' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          v1.0.0 — MediaPipe
        </Typography>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/" sx={{ borderRadius: 1, px: 1 }}>
            <ListItemIcon sx={{ minWidth: 40 }}><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Sign Out" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
}

export default function App() {
  // Initialise MediaPipe once on app mount
  useEffect(() => {
    MediaPipeFaceDetection.initialize().catch(err =>
      console.warn('[App] MediaPipe pre-init failed (will retry on demand):', err)
    );
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
