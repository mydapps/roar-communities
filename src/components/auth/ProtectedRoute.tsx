import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { validateAuthentication } from '@/utils/apiBase';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // We will determine registration status after validating authentication
  // const isRegistered = localStorage.getItem('dapps_user_registered') === '1';
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    // Validate authentication using cookies directly
    const checkAuth = async () => {
        try {
          setIsValidating(true);
        setValidationError(null);
        setHasTimedOut(false);

        // Set a timeout for the validation process
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.error('[ProtectedRoute] Authentication validation timed out');
            setHasTimedOut(true);
            setIsValidating(false);
            setValidationError('Authentication check timed out');
          }
        }, 15000); // 15 second timeout

          const validAuth = await validateAuthentication();
        
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsAuthenticated(validAuth);
          setIsValidating(false);
        }
        } catch (error) {
          console.error('Auth validation error:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsAuthenticated(false);
        setIsValidating(false);
          setValidationError(error instanceof Error ? error.message : 'Authentication validation failed');
        }
    }
    };
    
    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // Only run once on mount
  
  // Show loading state while validating
  if (isValidating && !hasTimedOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state if validation failed or timed out
  if (validationError || hasTimedOut) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">
            {validationError || 'Authentication check timed out. Please try again.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
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
  
  // If not authenticated after validation, show a loading state while handleAuthRecovery processes
  // This prevents the white screen issue
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Refreshing session...</p>
        <p className="text-xs text-muted-foreground mt-1">Please wait while we restore your session</p>
      </div>
    </div>
  );
};

export default ProtectedRoute;
