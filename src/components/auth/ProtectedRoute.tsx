
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('dapps_user_key');
  
  // Check if user has completed registration
  const isRegistered = localStorage.getItem('dapps_user_registered') === '1';
  
  useEffect(() => {
    if (!isLoggedIn) {
      toast.error('Please login to access this page');
    }
  }, [isLoggedIn]);
  
  // If not logged in, redirect to index page
  if (!isLoggedIn) {
    return <Navigate to="/index" state={{ from: location }} replace />;
  }
  
  // If logged in but not registered, redirect to request-invite
  if (isLoggedIn && !isRegistered) {
    return <Navigate to="/request-invite" state={{ from: location }} replace />;
  }
  
  // If logged in and registration is complete, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
