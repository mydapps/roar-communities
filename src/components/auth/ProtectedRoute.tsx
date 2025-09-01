import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { validateAuthentication } from '@/utils/apiBase';
import { Loader2, AlertTriangle, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [showLoginFallback, setShowLoginFallback] = useState(false);
  
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
            
            // After timeout, show login fallback if we've tried multiple times
            if (recoveryAttempts >= 1) {
              setShowLoginFallback(true);
            }
          }
        }, 10000); // Reduced to 10 seconds for better UX

        const validAuth = await validateAuthentication();
        
        if (isMounted) {
          clearTimeout(timeoutId);
          
          if (validAuth) {
            setIsAuthenticated(true);
            setIsValidating(false);
            setRecoveryAttempts(0); // Reset on success
          } else {
            // Authentication failed
            console.log(`[ProtectedRoute] Auth failed, attempts: ${recoveryAttempts}`);
            
            if (recoveryAttempts >= 2) {
              // After 2 failed attempts, show login fallback
              console.log('[ProtectedRoute] Max recovery attempts reached, showing login fallback');
              setShowLoginFallback(true);
              setIsValidating(false);
            } else {
              // Increment recovery attempts and try again after a delay
              setRecoveryAttempts(prev => prev + 1);
              setTimeout(() => {
                if (isMounted) {
                  checkAuth(); // Retry
                }
              }, 2000); // Wait 2 seconds before retry
            }
          }
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          
          if (recoveryAttempts >= 2) {
            setShowLoginFallback(true);
            setIsValidating(false);
          } else {
            setRecoveryAttempts(prev => prev + 1);
            setValidationError(error instanceof Error ? error.message : 'Authentication validation failed');
            
            // Retry after error
            setTimeout(() => {
              if (isMounted) {
                checkAuth();
              }
            }, 3000);
          }
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
  
  // Show login fallback if recovery attempts failed
  if (showLoginFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Session Expired</h2>
          <p className="text-muted-foreground mb-6">
            Your session has expired or could not be restored. Please sign in again to continue.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                // Clear any stale auth data
                localStorage.removeItem('dapps_last_auth_time');
                // Redirect to home page which will trigger login flow
                window.location.href = '/';
              }}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Sign In Again
            </button>
            <button
              onClick={() => {
                // Clear all localStorage and start fresh
                localStorage.clear();
                window.location.href = '/';
              }}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90 transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while validating
  if (isValidating && !hasTimedOut) {
    const loadingMessage = recoveryAttempts === 0 
      ? "Checking authentication..." 
      : recoveryAttempts === 1 
        ? "Refreshing session..." 
        : "Restoring your session...";
    
    const subMessage = recoveryAttempts === 0 
      ? "Please wait while we verify your login"
      : recoveryAttempts === 1 
        ? "Please wait while we restore your session" 
        : "This may take a moment";

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
          <p className="text-xs text-muted-foreground mt-1">{subMessage}</p>
          {recoveryAttempts > 0 && (
            <p className="text-xs text-orange-500 mt-2">
              Attempt {recoveryAttempts} of 3
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error state if validation failed or timed out (but only if we haven't shown login fallback)
  if ((validationError || hasTimedOut) && !showLoginFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">
            {validationError || 'Unable to connect to the server. Please check your internet connection.'}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setValidationError(null);
                setHasTimedOut(false);
                setRecoveryAttempts(0);
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90 transition-colors"
            >
              Start Fresh
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
  
  // If we reach here, authentication failed and we should show the login fallback
  // This prevents the infinite loading issue
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-6">
          You need to sign in to access this page. Please log in to continue.
        </p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;
