import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitComplaint from './pages/SubmitComplaint.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';
import WorkerDashboard from './pages/worker/WorkerDashboard.jsx';
import TaskDetail from './pages/worker/TaskDetail.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import './App.css';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    // Check auth status
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/submit-complaint"
          element={
            <PrivateRoute>
              <SubmitComplaint />
            </PrivateRoute>
          }
        />
        <Route
          path="/complaint/:id"
          element={
            <PrivateRoute>
              <ComplaintDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/worker/dashboard"
          element={
            <PrivateRoute>
              <WorkerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/worker/task/:id"
          element={
            <PrivateRoute>
              <TaskDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
