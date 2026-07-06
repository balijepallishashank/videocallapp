import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!currentUser.role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-slate-900/50 p-8 backdrop-blur-xl shadow-2xl">
          <h1 className="text-2xl font-black text-red-500 tracking-tight mb-4">Incomplete Profile</h1>
          <p className="text-slate-300 leading-relaxed text-sm">
            Your user profile is missing required registration information (missing role). Please contact a platform administrator or verify your database setup.
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const redirectPath = currentUser.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
