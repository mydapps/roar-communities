
import React, { ReactNode, useEffect, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface PrivyAuthProviderProps {
  children: ReactNode;
}

// Wrapper component to handle Privy auth state and login flow
const PrivyAuthWrapper = ({ children }: { children: ReactNode }) => {
  const { ready, authenticated, user, login, getAccessToken } = usePrivy();
  const [authProcessed, setAuthProcessed] = useState(false);
  const location = useLocation();
  
  // Don't redirect if we're already on community page or detailed post page
  const isCommunityPage = location.pathname.startsWith('/c/');
  const isDetailedPostPage = location.pathname.includes('/post/') || 
                            (location.pathname.includes('/c/') && location.pathname.split('/').length > 3);
  
  useEffect(() => {
    // Reset auth processed state when authentication status changes
    if (!authenticated) {
      setAuthProcessed(false);
    }
    
    // If user is authenticated with Privy, send info to backend
    if (ready && authenticated && user && !authProcessed) {
      const handlePrivyAuth = async () => {
        try {
          // Get JWT token from Privy
          const token = await getAccessToken();
          
          if (!token) {
            console.error('No JWT token available from Privy');
            toast.error('Authentication error: No token available');
            setAuthProcessed(true);
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
              
              // Don't redirect if we're already on community or post page
              if (isCommunityPage || isDetailedPostPage) {
                console.log('Already on community/post page, skipping redirect');
                setAuthProcessed(true);
                return;
              }
              
              // Check registration status
              if (data.registered === "1") {
                // User is fully registered, redirect to feed
                if (window.location.pathname === '/' || window.location.pathname === '/login') {
                  window.location.href = '/feed';
                  toast.success('Successfully logged in!');
                }
              } else {
                // User needs to complete registration
                if (data.handle && data.avatar) {
                  // Both handle and avatar are set, redirect to request-invite
                  if (window.location.pathname !== '/request-invite' && window.location.pathname !== '/feed') {
                    window.location.href = '/request-invite';
                  }
                } else {
                  // Missing handle or avatar, redirect to avatar-handle page
                  if (window.location.pathname !== '/avatar-handle') {
                    window.location.href = '/avatar-handle';
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
        } catch (error) {
          console.error('Error during authentication:', error);
          toast.error('Could not complete authentication');
          setAuthProcessed(true);
        }
      };

      handlePrivyAuth();
    }
  }, [ready, authenticated, user, getAccessToken, authProcessed, isCommunityPage, isDetailedPostPage]);

  return <>{children}</>;
};

// Main Provider component
const PrivyAuthProvider = ({ children }: PrivyAuthProviderProps) => {
  return (
    <PrivyProvider
      appId="clxemmxy905w5101wwy4ahs1m"
      config={{
        loginMethods: ['email', 'wallet', 'google', 'twitter'],
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
