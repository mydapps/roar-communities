import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook to check if user has set their username (handle)
 * Redirects to avatar-handle page if username is not set
 * 
 * @param options - Configuration options
 * @param options.enabled - Whether the check should be enabled (default: true)
 * @param options.redirectTo - Where to redirect if username is not set (default: '/avatar-handle')
 */
export const useUsernameCheck = (options: { 
  enabled?: boolean; 
  redirectTo?: string; 
} = {}) => {
  const navigate = useNavigate();
  const { enabled = true, redirectTo = '/avatar-handle' } = options;

  useEffect(() => {
    if (!enabled) return;

    const userHandle = localStorage.getItem('dapps_user_handle');
    
    console.log('useUsernameCheck - Checking username:', userHandle);
    
    // If username is not set, redirect to specified page
    if (!userHandle || userHandle.trim() === '') {
      console.log(`useUsernameCheck - Username not set, redirecting to ${redirectTo}`);
      navigate(redirectTo);
      return;
    }
  }, [navigate, enabled, redirectTo]);
}; 