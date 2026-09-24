import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/user';
import { Logo } from './Logo';
import { getAdminPath } from '../../utils/adminSecurity';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Prevent flashing content or incorrect redirects while session is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-soft text-brand-900">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Logo size="lg" />
          <div className="w-8 h-8 border-3 border-brand-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-brand-700 tracking-wide uppercase">
            Verifying Authentication...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated visitors must log in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. User authenticated, but does not possess the required role for this portal
  if (!allowedRoles.includes(role as UserRole)) {
    // Graceful redirection to the user's authorized home portal
    if (role === 'adopter') return <Navigate to="/adopter/dashboard" replace />;
    if (role === 'provider') return <Navigate to="/provider/dashboard" replace />;
    if (role === 'admin') return <Navigate to={getAdminPath('dashboard')} replace />;
    return <Navigate to="/" replace />;
  }

  // 4. Authorized
  return <Outlet />;
};
