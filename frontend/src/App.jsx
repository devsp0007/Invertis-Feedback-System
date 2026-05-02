import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CoursePage from './pages/CoursePage';
import TLFQPage from './pages/TLFQPage';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import ManageDirectory from './pages/ManageDirectory';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Fallback base redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Common Dashboard for both student and admin roles */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Protected Evaluation Routes */}
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CoursePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id/tlfq"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TLFQPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id/tlfq/:tlfqId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TLFQPage />
              </ProtectedRoute>
            }
          />


          {/* Admin Protected Operations Routes */}
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/directory"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageDirectory />
              </ProtectedRoute>
            }
          />

          {/* Fallback fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
