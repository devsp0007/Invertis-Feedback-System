import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CoursePage from './pages/CoursePage';
import TLFQPage from './pages/TLFQPage';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import ManageDirectory from './pages/ManageDirectory';
import HODDashboard from './pages/HODDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Student routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['student', 'admin', 'hod']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/courses/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <CoursePage />
            </ProtectedRoute>
          } />
          <Route path="/courses/:id/tlfq/:tlfqId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <TLFQPage />
            </ProtectedRoute>
          } />

          {/* HOD routes */}
          <Route path="/hod/analytics" element={
            <ProtectedRoute allowedRoles={['hod', 'admin']}>
              <HODDashboard />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/courses" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/directory" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageDirectory />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
