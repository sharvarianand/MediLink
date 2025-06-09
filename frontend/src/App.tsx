import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import Layout from './components/layout/Layout';

// Pages
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Blue
      light: '#60a5fa',
      dark: '#1e40af',
    },
    secondary: {
      main: '#10b981', // Green
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
  },
});

// Mock authentication - replace with actual auth logic
const useAuth = () => {
  const [user, setUser] = useState<{ role: 'doctor' | 'patient' | null }>({ role: null });

  const login = (role: 'doctor' | 'patient') => {
    setUser({ role });
  };

  const logout = () => {
    setUser({ role: null });
  };

  return { user, login, logout };
};

function App() {
  const { user, login, logout } = useAuth();

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: ('doctor' | 'patient')[] }) => {
    if (!user.role) {
      return <Navigate to="/login" />;
    }

    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={login} />} />
          
          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <Layout userRole="doctor" onLogout={logout}>
                  <DoctorDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <Layout userRole="doctor" onLogout={logout}>
                  <Patients />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <Layout userRole="doctor" onLogout={logout}>
                  <Appointments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/medical-records"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <Layout userRole="doctor" onLogout={logout}>
                  <MedicalRecords />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Layout userRole="patient" onLogout={logout}>
                  <PatientDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Layout userRole="patient" onLogout={logout}>
                  <Appointments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/medical-records"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Layout userRole="patient" onLogout={logout}>
                  <MedicalRecords />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to appropriate dashboard */}
          <Route
            path="/"
            element={
              user.role ? (
                <Navigate to={`/${user.role}`} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
}

export default App;
