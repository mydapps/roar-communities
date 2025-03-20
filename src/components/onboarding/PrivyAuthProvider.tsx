
import React, { ReactNode, useEffect } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';

interface PrivyAuthProviderProps {
  children: ReactNode;
}

// Wrapper component to handle Privy auth state and login flow
const PrivyAuthWrapper = ({ children }: { children: ReactNode }) => {
  const { ready, authenticated, user, login, getAccessToken } = usePrivy();
  
  useEffect(() => {
    // If user is authenticated with Privy, send info to backend
    if (ready && authenticated && user) {
      const handlePrivyAuth = async () => {
        try {
          // Get JWT token from Privy
          const token = await getAccessToken();
          
          if (!token) {
            console.error('No JWT token available from Privy');
            toast.error('Authentication error: No token available');
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
              // Store userId and userKey in localStorage
              localStorage.setItem('dapps_user_id', data.userId.toString());
              localStorage.setItem('dapps_user_key', data.userKey);
              
              // Store additional data if available
              if (data.handle) localStorage.setItem('dapps_user_handle', data.handle);
              if (data.avatar) localStorage.setItem('dapps_user_avatar', data.avatar);
              
              // Check if we have a handle, if not redirect to avatar-handle page
              if (!data.handle) {
                window.location.href = '/avatar-handle';
                toast.success('Please choose your avatar and handle');
              } else {
                // If we already have a handle, navigate to feed
                window.location.href = '/feed';
                toast.success('Successfully logged in!');
              }
            } else {
              toast.error('Authentication failed: ' + (data.message || 'Unknown error'));
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Authentication error response:', errorData);
            toast.error('Authentication failed. Please try again.');
          }
        } catch (error) {
          console.error('Error during authentication:', error);
          toast.error('Could not complete authentication');
        }
      };

      handlePrivyAuth();
    }
  }, [ready, authenticated, user, getAccessToken]);

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
          logo: 'https://dapps.co/icon-128x128.png',
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
