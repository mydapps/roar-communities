import React, { ReactNode, useEffect, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { shouldRefreshAuth } from '@/utils/apiBase';

interface PrivyAuthProviderProps {
  children: ReactNode;
}

// Create a context to expose global authentication loading state
export const AuthLoadingContext = React.createContext<boolean>(false);

// Wrapper component to handle Privy auth state and login flow
const PrivyAuthWrapper = ({ children }: { children: ReactNode }) => {
  const { ready, authenticated, user, login, getAccessToken } = usePrivy();
  const [authProcessed, setAuthProcessed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authRequestInProgress, setAuthRequestInProgress] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authTimeout, setAuthTimeout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Development-only logging helper
  const debugLog = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') { // Set to true to enable dev logs when needed
      console.log(`[Auth] ${message}`, ...args);
    }
  };

  // Debug for routing and auth issues
  const pathname = location.pathname;
  debugLog("Current path:", pathname);
  
  // Don't redirect if we're already on community page or detailed post page
  const isCommunityPage = pathname.startsWith('/c/');
  const isPostPage = pathname.includes('/post/') || 
                    (pathname.includes('/c/') && pathname.split('/').length > 3) ||
                    (/^\/[\w-]+\/[\w-]+$/.test(pathname) && !pathname.startsWith('/u/')); // Handle username/postId format
                    
  debugLog("Is post page:", isPostPage);
                    
  // Flag for publicly accessible routes
  const isPublicRoute = 
    pathname === '/' || 
    pathname === '/index' || 
    pathname === '/login' || 
    pathname === '/request-invite' ||
    pathname === '/avatar-handle' ||
    pathname.startsWith('/invite/') ||
    isCommunityPage ||
    isPostPage;
    
  debugLog("Is public route:", isPublicRoute);
  debugLog("Auth status:", { ready, authenticated, authProcessed });
  
  // Helper function to check if we should refresh auth
  const shouldCheckAuth = (): boolean => {
    try {
      // Check if we have existing user ID - the only thing we need to verify
      // with cookie-based auth (the actual auth token is in the HttpOnly cookie)
      const existingUserId = localStorage.getItem('dapps_user_id');
      
      debugLog("Auth check:", { existingUserId: !!existingUserId });
      
      // If we're missing user ID, we need to authenticate
      if (!existingUserId) {
        debugLog("Missing user ID, auth required");
        return true;
      }
      
      // Use the shouldRefreshAuth function from apiBase.ts to check if we need to refresh based on time
      return shouldRefreshAuth();
    } catch (error) {
      // If there's any error parsing or checking, assume we need to auth
      console.error("Error checking auth timestamp:", error);
      return true;
    }
  };

  // Reset auth state function
  const resetAuthState = () => {
    setAuthProcessed(false);
    setAuthRequestInProgress(false);
    setIsAuthLoading(false);
    setAuthError(null);
    setAuthTimeout(false);
  };

  // Handle authentication timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isAuthLoading && !authTimeout) {
      // Set a timeout for authentication process (30 seconds)
      timeoutId = setTimeout(() => {
        console.error('[Auth] Authentication timeout after 30 seconds');
        setAuthTimeout(true);
        setIsAuthLoading(false);
        setAuthRequestInProgress(false);
        setAuthError('Authentication timed out. Please try again.');
        toast.error('Authentication timed out. Please refresh the page.');
      }, 30000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthLoading, authTimeout]);

  // Handle app resume detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authenticated && authProcessed) {
        // App became visible again, check if we need to refresh auth
        const needsRefresh = shouldRefreshAuth();
        if (needsRefresh) {
          debugLog("App resumed, refreshing authentication");
          resetAuthState();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authenticated, authProcessed]);
  
  useEffect(() => {
    // Reset auth processed state when authentication status changes
    if (!authenticated) {
      setAuthProcessed(false);
      setAuthRequestInProgress(false);
    }
    
    // If user is authenticated with Privy, handle auth flow
    if (ready && authenticated && user && !authProcessed && !authRequestInProgress && !authTimeout) {
      const handlePrivyAuth = async () => {
        try {
          // Check if we need to refresh auth or already have valid credentials
          const needsAuthRefresh = shouldCheckAuth();
          
          // If we have credentials and don't need to refresh, skip the auth call
          if (!needsAuthRefresh) {
            debugLog("Using existing credentials, skipping authentication request");
            setAuthProcessed(true);
            
            // If on index or login page, redirect to feed
            if (pathname === '/' || pathname === '/login' || pathname === '/index') {
              debugLog("Redirecting to feed (using existing auth)");
              navigate('/feed');
            }
            return;
          }
          
          debugLog("Auth refresh needed, proceeding with authentication");
          
          // Set both flags to prevent duplicate requests
          setAuthRequestInProgress(true);
          setIsAuthLoading(true);
          setAuthError(null);
          
          // Get JWT token from Privy
          const token = await getAccessToken();
          
          if (!token) {
            console.error('No JWT token available from Privy');
            setAuthError('No authentication token available');
            toast.error('Authentication error: No token available');
            setAuthProcessed(true);
            setIsAuthLoading(false);
            setAuthRequestInProgress(false);
            return;
          }
          
          debugLog('Sending authentication request with token');
          
          const response = await fetch('/api/privy_auth', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              privyId: user.id,
              email: user.email?.address,
              wallet: user.wallet?.address,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
            console.log('[Auth] Received data from /privy_auth:', JSON.stringify(data, null, 2));
            
            // Check for inactive account status FIRST
            if (data.success === false && data.accountStatus === 'inactive') {
              console.warn('[Auth] Account is inactive. Redirecting to inactive page.');
              toast.error(data.message || 'Your account is inactive.');
              navigate('/account-inactive', { replace: true });
              // Important: Stop further processing
              setAuthProcessed(true);
              setIsAuthLoading(false);
              setAuthRequestInProgress(false);
              return; 
            }
            
            // Original success path
            if (data.success) {
              // --- VALIDATE RESPONSE DATA ---
              if (!data.userId) {
                console.error('CRITICAL AUTH ERROR: userId missing from /privy_auth response', data);
                setAuthError('Missing user identifier from server');
                toast.error('Authentication failed: Missing user identifier from server.');
                // Stop processing here to prevent partial state
                setAuthProcessed(true);
                setIsAuthLoading(false);
                setAuthRequestInProgress(false);
                return;
              }
              
              // --- STORE USER INFO (NOW SAFER) ---
              try {
                const userIdStr = data.userId.toString();
                localStorage.setItem('dapps_user_id', userIdStr);
                console.log(`[Auth] Attempted to set dapps_user_id: ${userIdStr}. Retrieved:`, localStorage.getItem('dapps_user_id'));
                
                const authTime = Date.now().toString();
                localStorage.setItem('dapps_last_auth_time', authTime);
                console.log(`[Auth] Attempted to set dapps_last_auth_time: ${authTime}. Retrieved:`, localStorage.getItem('dapps_last_auth_time'));
                
                // Conditionally set handle/avatar only if they exist in the response
                if (data.handle) localStorage.setItem('dapps_user_handle', data.handle);
                if (data.avatar) localStorage.setItem('dapps_user_avatar', data.avatar);
                const registeredStatus = data.registered ? data.registered.toString() : "0";
                localStorage.setItem('dapps_user_registered', registeredStatus); 
                debugLog('Authentication successful, stored user info. Registered status:', registeredStatus);
              } catch (storageError) {
                console.error('[Auth] CRITICAL ERROR storing user info in localStorage:', storageError, 'Data received:', data);
                setAuthError('Could not save session');
                toast.error('Authentication partially failed: Could not save session.');
                // Stop processing here
                setAuthProcessed(true);
                setIsAuthLoading(false);
                setAuthRequestInProgress(false);
                return;
              }
              
              // --- REVISED REDIRECT LOGIC (Ensure it uses the correctly stored status) ---
              const finalRegisteredStatus = localStorage.getItem('dapps_user_registered');
              
              if (finalRegisteredStatus === "1") {
                // User is fully registered. Redirect to feed UNLESS already on an auth page.
                const isOnAuthPage = 
                  pathname === '/feed' ||
                  pathname === '/referral' || 
                  pathname === '/my-shares' ||
                  pathname === '/account' ||
                  pathname === '/communities' ||
                  pathname === '/search' ||
                  pathname.startsWith('/u/') ||
                  isCommunityPage ||
                  isPostPage;
                  
                if (!isOnAuthPage) {
                   debugLog("User registered, redirecting to feed");
                  navigate('/feed');
                  toast.success('Successfully logged in!');
                } else {
                  debugLog("User registered, already on an authenticated page, skipping redirect.");
                  // No redirect needed
                }
              } else {
                // User needs to complete registration (finalRegisteredStatus !== "1")
                debugLog("User not fully registered, checking profile status for redirect...");
                const handle = localStorage.getItem('dapps_user_handle');
                const avatar = localStorage.getItem('dapps_user_avatar');
                if (handle && avatar) {
                  // Has profile info but not registered? Send to request-invite.
                  if (pathname !== '/request-invite') {
                    debugLog("Redirecting to request-invite (handle/avatar set, but not registered)");
                    navigate('/request-invite');
                  }
                } else {
                  // Missing handle or avatar, redirect to avatar-handle page
                  if (pathname !== '/avatar-handle') {
                    debugLog("Redirecting to avatar-handle (missing profile info)");
                    navigate('/avatar-handle');
                    toast.info('Please complete your profile');
                  }
                }
              }
              // --- END OF REVISED REDIRECT LOGIC ---
              
              // Mark auth as processed after successful storage and navigation decision
              setAuthProcessed(true);
              setIsAuthLoading(false);
              setAuthRequestInProgress(false);
              return; // Important: Exit after handling success
              
            } else {
              // Handle other non-inactive failures (e.g., validation errors from API)
              setAuthError(data.message || 'Unknown server error');
              toast.error('Authentication failed: ' + (data.message || 'Unknown server error'));
            }
          } else {
            // Handle HTTP errors (4xx, 5xx)
            let errorBody = '';
            interface ApiError { success?: boolean; accountStatus?: string; message?: string; error?: string; }
            let errorData: ApiError = {}; 
            try {
              errorBody = await response.text();
              if (errorBody && errorBody.startsWith('{') && errorBody.endsWith('}')) {
                 errorData = JSON.parse(errorBody);
              }
            } catch (parseError) {
              console.error('Error reading/parsing error response body:', parseError);
            }
            
            // SPECIFIC CHECK: Handle 403 for inactive accounts
            if (response.status === 403 && errorData.accountStatus === 'inactive') {
              console.warn('[Auth] Account is inactive (detected via 403). Redirecting to inactive page.');
              toast.error(errorData.message || 'Your account is inactive.');
              navigate('/account-inactive', { replace: true });
              // Important: Stop further processing for this specific case
              setAuthProcessed(true);
              setIsAuthLoading(false);
              setAuthRequestInProgress(false);
              return; 
            }

            // Generic error handling for other non-OK responses
            console.error(`Authentication failed with status: ${response.status}`, {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorBody,
              parsedJson: errorData 
            });
            
            const message = errorData.message || errorData.error || errorBody || 'Please try again.';
            setAuthError(`Authentication failed (${response.status}): ${message}`);
            toast.error(`Authentication failed (${response.status}): ${message}`);
          }
          
          // Mark auth as processed if flow reaches here (indicates a failure other than inactive account)
          setAuthProcessed(true);
          setIsAuthLoading(false);
          setAuthRequestInProgress(false);
        } catch (error) {
          console.error('Error during authentication:', error);
          setAuthError('Could not complete authentication');
          toast.error('Could not complete authentication');
          setAuthProcessed(true);
          setIsAuthLoading(false);
          setAuthRequestInProgress(false);
        }
      };

      handlePrivyAuth();
    }
  }, [ready, authenticated, user, getAccessToken, authProcessed, authRequestInProgress, authTimeout, isCommunityPage, isPostPage, pathname, navigate]);

  // Show global loading overlay when authentication is processing
  if (isAuthLoading && !authTimeout) {
    // Render ONLY the loader when loading
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-lg p-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show error state if authentication failed or timed out
  if (authError || authTimeout) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-lg p-6 text-center max-w-md mx-4">
          <div className="text-destructive mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Authentication Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {authError || 'Authentication timed out. Please try again.'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                resetAuthState();
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the children only when not loading and no errors
  return (
    <AuthLoadingContext.Provider value={isAuthLoading}>
      {children}
    </AuthLoadingContext.Provider>
  );
};

// Main Provider component
const PrivyAuthProvider = ({ children }: PrivyAuthProviderProps) => {
  return (
    <PrivyProvider
      appId="clxemmxy905w5101wwy4ahs1m"
      config={{
        loginMethods: ['passkey', 'email', 'sms', 'wallet', 'farcaster', 'twitter', 'discord', 'apple'] as any,
        appearance: {
          theme: 'light',
          accentColor: '#31bcc3',
          logo: '/images/logo1.png',
        },
        embeddedWallets: {
          noPromptOnSignature: true,
        },
      }}
    >
      <PrivyAuthWrapper>{children}</PrivyAuthWrapper>
    </PrivyProvider>
  );
};

export default PrivyAuthProvider;
