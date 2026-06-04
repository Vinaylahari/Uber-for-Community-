import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    // Redirect based on role if they try to access unauthorized pages
    if (userData.role === 'admin') return <Navigate to="/admin" replace />;
    if (userData.role === 'volunteer') return <Navigate to="/volunteer" replace />;
    return <Navigate to="/member" replace />;
  }

  return children;
}
