import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/api';
import { PageLoader } from '../common/States';

/**
 * Client-side route guard. This only improves the experience: every protected endpoint is
 * also authorised by the Java backend, which is the real security boundary.
 */
export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, initialising } = useAuth();
  const location = useLocation();

  if (initialising) {
    return <PageLoader label="Checking your session" />;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'RESPONDER' ? '/responder' : '/dashboard'} replace />;
  }
  return <Outlet />;
}
