
import React, { ReactNode, useEffect } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PrivyAuthProviderProps {
  children: ReactNode;
}

// Wrapper component to handle Privy auth state and login flow
const PrivyAuthWrapper = ({ children }: { children: ReactNode }) => {
  const { ready, authenticated, user, login } = usePrivy();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated with Privy, send info to backend
    if (ready && authenticated && user) {
      const handlePrivyAuth = async () => {
        try {
          const response = await fetch('https://api.dapps.co/privy_auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              privyId: user.id,
              email: user.email?.address,
              wallet: user.wallet?.address,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Store userId and userKey in localStorage
            localStorage.setItem('dapps_user_id', data.userId);
            localStorage.setItem('dapps_user_key', data.userKey);
            
            // Navigate to feed and show success message
            navigate('/feed');
            toast.success('Successfully logged in!');
          } else {
            toast.error('Authentication failed. Please try again.');
          }
        } catch (error) {
          console.error('Error during authentication:', error);
          toast.error('Could not complete authentication');
        }
      };

      handlePrivyAuth();
    }
  }, [ready, authenticated, user, navigate]);

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
