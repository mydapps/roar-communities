import React, { ReactNode, useEffect, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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
  const [isPageRefresh, setIsPageRefresh] = useState(true); // Track if this is a page refresh
  const location = useLocation();
  const navigate = useNavigate();
  
  // Development-only logging helper
  const debugLog = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable dev logs when needed
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
  
  // On first render, check if this is a page refresh or navigation
  useEffect(() => {
    // Use sessionStorage to detect page refresh vs navigation
    const refreshFlag = 'is_page_refresh';
    
    if (sessionStorage.getItem(refreshFlag) === null) {
      // This is a page refresh
      console.log('Page was refreshed, forcing authentication refresh');
      setIsPageRefresh(true);
      
      // Clear any existing credentials to force a fresh auth cycle
      const existingUserKey = localStorage.getItem('dapps_user_key');
      if (existingUserKey) {
        console.log('Found existing credentials, marking for refresh');
        // Only clear the autprocess flag, don't remove credentials yet
        setAuthProcessed(false);
      }
      
      // Set flag to detect future refreshes
      sessionStorage.setItem(refreshFlag, 'false');
    } else {
      // This is a navigation, not a refresh
      console.log('Page navigation detected, not a refresh');
      setIsPageRefresh(false);
    }
    
    // Clean up on unmount
    return () => {
      // No cleanup needed
    };
  }, []);
  
  useEffect(() => {
    // Reset auth processed state when authentication status changes
    if (!authenticated) {
      setAuthProcessed(false);
      setAuthRequestInProgress(false);
    }
    
    // If user is authenticated with Privy, send info to backend
    if (ready && authenticated && user && !authProcessed && !authRequestInProgress) {
      const handlePrivyAuth = async () => {
        try {
          // Check if we already have valid credentials stored
          const existingUserKey = localStorage.getItem('dapps_user_key');
          const existingUserId = localStorage.getItem('dapps_user_id');
          
          // If we already have credentials and this is NOT a page refresh, skip the auth request
          if (existingUserKey && existingUserId && !isPageRefresh) {
            console.log('User already has credentials, skipping authentication request');
            setAuthProcessed(true);
            return;
          }
          
          // If this is a page refresh or we don't have credentials, proceed with auth
          if (isPageRefresh || !existingUserKey || !existingUserId) {
            console.log('Refreshing authentication token');
          }
          
          // Set both flags to prevent duplicate requests
          setAuthRequestInProgress(true);
          setIsAuthLoading(true);
          
          // Get JWT token from Privy
          const token = await getAccessToken();
          
          if (!token) {
            console.error('No JWT token available from Privy');
            toast.error('Authentication error: No token available');
            setAuthProcessed(true);
            setIsAuthLoading(false);
            setAuthRequestInProgress(false);
            return;
          }
          
          console.log('Sending authentication request with token');
          
          const response = await fetch('https://api.dapps.co/privy_auth', {
            method: 'POST',
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
            
            if (data.success) {
              // Store all returned values in localStorage
              localStorage.setItem('dapps_user_id', data.userId.toString());
              localStorage.setItem('dapps_user_key', data.userKey);
              
              // Store additional data if available
              if (data.handle) localStorage.setItem('dapps_user_handle', data.handle);
              if (data.avatar) localStorage.setItem('dapps_user_avatar', data.avatar);
              
              // Ensure we properly store the registered status
              localStorage.setItem('dapps_user_registered', data.registered || "0");
              
              console.log('PrivyAuthProvider - Registration status:', data.registered);
              
              // Don't redirect if we're already on a protected page that requires authentication
              // This fixes the refresh issue on pages like referral and my-shares
              if (pathname === '/referral' || 
                  pathname === '/my-shares' ||
                  pathname === '/account' ||
                  pathname === '/communities' ||
                  pathname === '/search' ||
                  pathname.startsWith('/u/')) {
                console.log('Already on a protected page, skipping redirect');
                setAuthProcessed(true);
                setIsAuthLoading(false);
                setAuthRequestInProgress(false);
                return;
              }
              
              // Don't redirect if we're already on community or post page
              if (isCommunityPage || isPostPage) {
                console.log('Already on community/post page, skipping redirect');
                setAuthProcessed(true);
                setIsAuthLoading(false);
                setAuthRequestInProgress(false);
                return;
              }
              
              // Check registration status
              if (data.registered === "1") {
                // User is fully registered, redirect to feed if on login/index page
                if (pathname === '/' || pathname === '/login' || pathname === '/index') {
                  console.log("Redirecting to feed from public route");
                  navigate('/feed');
                  toast.success('Successfully logged in!');
                }
              } else {
                // User needs to complete registration
                if (data.handle && data.avatar) {
                  // Both handle and avatar are set, redirect to request-invite
                  if (pathname !== '/request-invite' && pathname !== '/feed') {
                    console.log("Redirecting to request-invite");
                    navigate('/request-invite');
                  }
                } else {
                  // Missing handle or avatar, redirect to avatar-handle page
                  if (pathname !== '/avatar-handle') {
                    console.log("Redirecting to avatar-handle");
                    navigate('/avatar-handle');
                    toast.info('Please complete your profile');
                  }
                }
              }
            } else {
              toast.error('Authentication failed: ' + (data.message || 'Unknown error'));
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Authentication error response:', errorData);
            toast.error('Authentication failed. Please try again.');
          }
          
          // Mark auth as processed to prevent loops
          setAuthProcessed(true);
          setIsAuthLoading(false);
          setAuthRequestInProgress(false);
          
          // Reset the page refresh flag once auth is processed
          setIsPageRefresh(false);
        } catch (error) {
          console.error('Error during authentication:', error);
          toast.error('Could not complete authentication');
          setAuthProcessed(true);
          setIsAuthLoading(false);
          setAuthRequestInProgress(false);
        }
      };

      handlePrivyAuth();
    }
  }, [ready, authenticated, user, getAccessToken, authProcessed, authRequestInProgress, isCommunityPage, isPostPage, pathname, navigate, isPageRefresh]);

  // Show global loading overlay when authentication is processing
  if (isAuthLoading) {
    return (
      <AuthLoadingContext.Provider value={isAuthLoading}>
        {children}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-background rounded-lg shadow-lg p-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium">Authenticating...</p>
          </div>
        </div>
      </AuthLoadingContext.Provider>
    );
  }

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
        loginMethods: ['email', 'sms', 'wallet', 'farcaster', 'twitter', 'discord'],
        appearance: {
          theme: 'light',
          accentColor: '#31bcc3',
          logo: 'https://dapps.co/logo1.png',
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
