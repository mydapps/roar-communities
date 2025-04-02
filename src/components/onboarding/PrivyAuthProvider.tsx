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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Debug for routing and auth issues
  console.log("PrivyAuthWrapper - Current path:", location.pathname);
  
  // Don't redirect if we're already on community page or detailed post page
  const isCommunityPage = location.pathname.startsWith('/c/');
  const isPostPage = location.pathname.includes('/post/') || 
                    (location.pathname.includes('/c/') && location.pathname.split('/').length > 3) ||
                    (/^\/[\w-]+\/[\w-]+$/.test(location.pathname) && !location.pathname.startsWith('/u/')); // Handle username/postId format
                    
  console.log("PrivyAuthWrapper - Is post page:", isPostPage);
                    
  // Flag for publicly accessible routes
  const isPublicRoute = 
    location.pathname === '/' || 
    location.pathname === '/index' || 
    location.pathname === '/login' || 
    location.pathname === '/request-invite' ||
    location.pathname === '/avatar-handle' ||
    location.pathname.startsWith('/invite/') ||
    isCommunityPage ||
    isPostPage;
    
  console.log("PrivyAuthWrapper - Is public route:", isPublicRoute);
  console.log("PrivyAuthWrapper - Auth status:", { ready, authenticated, authProcessed });
  
  useEffect(() => {
    // Reset auth processed state when authentication status changes
    if (!authenticated) {
      setAuthProcessed(false);
    }
    
    // If user is authenticated with Privy, send info to backend
    if (ready && authenticated && user && !authProcessed) {
      const handlePrivyAuth = async () => {
        try {
          setIsAuthLoading(true);
          // Get JWT token from Privy
          const token = await getAccessToken();
          
          if (!token) {
            console.error('No JWT token available from Privy');
            toast.error('Authentication error: No token available');
            setAuthProcessed(true);
            setIsAuthLoading(false);
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
              if (location.pathname === '/referral' || 
                  location.pathname === '/my-shares' ||
                  location.pathname === '/account' ||
                  location.pathname === '/communities' ||
                  location.pathname === '/search' ||
                  location.pathname.startsWith('/u/')) {
                console.log('Already on a protected page, skipping redirect');
                setAuthProcessed(true);
                setIsAuthLoading(false);
                return;
              }
              
              // Don't redirect if we're already on community or post page
              if (isCommunityPage || isPostPage) {
                console.log('Already on community/post page, skipping redirect');
                setAuthProcessed(true);
                setIsAuthLoading(false);
                return;
              }
              
              // Check registration status
              if (data.registered === "1") {
                // User is fully registered, redirect to feed if on login/index page
                if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/index') {
                  console.log("Redirecting to feed from public route");
                  navigate('/feed');
                  toast.success('Successfully logged in!');
                }
              } else {
                // User needs to complete registration
                if (data.handle && data.avatar) {
                  // Both handle and avatar are set, redirect to request-invite
                  if (location.pathname !== '/request-invite' && location.pathname !== '/feed') {
                    console.log("Redirecting to request-invite");
                    navigate('/request-invite');
                  }
                } else {
                  // Missing handle or avatar, redirect to avatar-handle page
                  if (location.pathname !== '/avatar-handle') {
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
        } catch (error) {
          console.error('Error during authentication:', error);
          toast.error('Could not complete authentication');
          setAuthProcessed(true);
          setIsAuthLoading(false);
        }
      };

      handlePrivyAuth();
    }
  }, [ready, authenticated, user, getAccessToken, authProcessed, isCommunityPage, isPostPage, location.pathname, navigate]);

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
