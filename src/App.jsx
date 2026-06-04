import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequestProvider } from './context/RequestContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import FcmBootstrap from './components/FcmBootstrap';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import MemberHome from './pages/member/Home';
import RaiseRequest from './pages/member/RaiseRequest';
import TrackRequest from './pages/member/TrackRequest';
import Profile from './pages/member/Profile';
import VolunteerFeed from './pages/volunteer/Feed';
import VolunteerActiveTask from './pages/volunteer/ActiveTask';
import VolunteerHistory from './pages/volunteer/History';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminVolunteers from './pages/admin/Volunteers';
import AdminRequests from './pages/admin/Requests';
import AdminReports from './pages/admin/Reports';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RequestProvider>
          <FcmBootstrap />
          <Router>
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/member"
                element={
                  <ProtectedRoute allowedRoles={['member']}>
                    <MemberHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/member/request"
                element={
                  <ProtectedRoute allowedRoles={['member']}>
                    <RaiseRequest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/member/track"
                element={
                  <ProtectedRoute allowedRoles={['member']}>
                    <TrackRequest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/member/profile"
                element={
                  <ProtectedRoute allowedRoles={['member']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/volunteer"
                element={
                  <ProtectedRoute allowedRoles={['volunteer']}>
                    <VolunteerFeed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/active"
                element={
                  <ProtectedRoute allowedRoles={['volunteer']}>
                    <VolunteerActiveTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/history"
                element={
                  <ProtectedRoute allowedRoles={['volunteer']}>
                    <VolunteerHistory />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="volunteers" element={<AdminVolunteers />} />
                <Route path="requests" element={<AdminRequests />} />
                <Route path="reports" element={<AdminReports />} />
              </Route>

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </RequestProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
