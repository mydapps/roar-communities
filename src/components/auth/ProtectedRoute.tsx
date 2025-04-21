import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { validateAuthentication } from '@/utils/apiBase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // We will determine registration status after validating authentication
  // const isRegistered = localStorage.getItem('dapps_user_registered') === '1';
  
  useEffect(() => {
    // Validate authentication using cookies directly
    const checkAuth = async () => {
      // Removed the initial check for hasUserId
      // Always call validateAuthentication
        try {
          setIsValidating(true);
          const validAuth = await validateAuthentication();
          setIsAuthenticated(validAuth);
        } catch (error) {
          console.error('Auth validation error:', error);
          setIsAuthenticated(false);
        } finally {
        setIsValidating(false);
    }
    };
    
    checkAuth();
  }, []); // Removed hasUserId dependency
  
  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If authenticated, check registration status
  if (isAuthenticated) {
    const isRegistered = localStorage.getItem('dapps_user_registered') === '1';
    if (!isRegistered) {
      // Redirect to request-invite if not registered
    return <Navigate to="/request-invite" state={{ from: location }} replace />;
  }
    // If authenticated and registered, render the protected component
  return <>{children}</>;
  }
  
  // If not authenticated after validation, handleAuthRecovery (called by validateAuthentication)
  // will trigger a page reload. Return null or a loader here to prevent rendering anything 
  // and avoid the redirect loop caused by navigating to /index.
  console.log('[ProtectedRoute] Authentication failed, handleAuthRecovery should reload/redirect.');
  // toast.error('Please login to access this page'); // Toast shown by handleAuthRecovery/cleanupAuthState
  // return <Navigate to="/index" state={{ from: location }} replace />; // <<< REMOVE THIS REDIRECT
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Reloading session...</p>
    </div>
  ); // Or return null;
};

export default ProtectedRoute;
