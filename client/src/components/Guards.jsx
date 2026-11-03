import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Loading your workspace…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // Incomplete partners must finish setup before accessing any protected route
  if (user.role === 'partner' && !user.isProfileComplete) {
    return <Navigate to="/partner-setup" replace />;
  }
  const exemptPaths = ['/assessment', '/industry-awareness'];
  if (user.role === 'student' && !user.isAssessed && !exemptPaths.includes(location.pathname)) {
    return <Navigate to="/industry-awareness" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    // Redirect each role to their correct home
    const home = user.role === 'coordinator' ? '/coordination' : user.role === 'partner' ? '/partner' : '/dashboard';
    return <Navigate to={home} replace />;
  }
  return children;
}

// Guards the /partner-setup route: only incomplete partners may access it
export function PartnerSetupGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'partner') return <Navigate to="/" replace />;
  if (user.isProfileComplete) return <Navigate to="/partner" replace />;
  return children;
}

export function AssessmentGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader">Loading…</div>;
  // Coordinators bypass all assessment/learning guards
  if (user?.role === 'coordinator') return children;
  if (user && user.role === 'student' && !user.isAssessed && location.pathname !== '/assessment') {
    return <Navigate to="/assessment" replace />;
  }
  return children;
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return children;
  // Send each role to their correct home; incomplete partners go to setup
  if (user.role === 'coordinator') return <Navigate to="/coordination" replace />;
  if (user.role === 'partner') {
    return <Navigate to={user.isProfileComplete ? '/partner' : '/partner-setup'} replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
