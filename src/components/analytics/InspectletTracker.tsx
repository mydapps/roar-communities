import React, { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { identifyUser, trackPageView, resetInspectlet } from '@/utils/inspectlet';

/**
 * Inspectlet Tracker Component
 * 
 * This component handles automatic user identification and page tracking for Inspectlet.
 * It should be placed at the root level of the app to ensure comprehensive tracking.
 * 
 * Features:
 * - Automatic user identification when authenticated (using handle)
 * - Page view tracking on route changes via session tagging
 * - User data updates when profile changes
 * - Session tagging for anonymous users
 * - Cleanup on logout
 */
const InspectletTracker: React.FC = () => {
  const location = useLocation();
  const { ready, authenticated, user } = usePrivy();
  const lastIdentifiedUser = useRef<string | null>(null);
  const lastTrackedPath = useRef<string | null>(null);

  // Get page name from pathname for better tracking
  const getPageName = useCallback((pathname: string): string => {
    // Remove leading slash and convert to title case
    const path = pathname.substring(1) || 'home';
    
    // Handle specific routes
    const routeMap: Record<string, string> = {
      '': 'Landing Page',
      'feed': 'Feed',
      'communities': 'Communities',
      'my-shares': 'My Shares',
      'account': 'Account Settings',
      'edit-profile': 'Edit Profile',
      'notifications': 'Notifications',
      'messages': 'Messages',
      'request-invite': 'Request Invite',
      'avatar-handle': 'Avatar & Handle Setup',
      'roar-farming': 'ROAR Farming',
      'trading': 'Trading',
      'settings': 'Settings'
    };

    // Check for dynamic routes
    if (pathname.startsWith('/c/')) {
      return 'Community Page';
    } else if (pathname.startsWith('/u/')) {
      return 'User Profile';
    } else if (pathname.includes('/post/')) {
      return 'Post Detail';
    } else if (pathname.startsWith('/invite/')) {
      return 'Invite Landing';
    } else if (pathname.startsWith('/messages/')) {
      return 'Conversation';
    }

    return routeMap[path] || path.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // Identify user in Inspectlet
  const identifyUserInspectlet = useCallback(async () => {
    if (!ready || !authenticated || !user) {
      return;
    }

    try {
      const handle = localStorage.getItem('dapps_user_handle');
      if (!handle) {
        console.log('[InspectletTracker] No user handle found, skipping identification');
        return;
      }

      // Skip if we already identified this user
      if (lastIdentifiedUser.current === handle) {
        return;
      }

      // Gather user data from localStorage and Privy
      const userId = localStorage.getItem('dapps_user_id');
      const registered = localStorage.getItem('dapps_user_registered') === '1';
      const createdAt = localStorage.getItem('dapps_last_auth_time');
      
      // Identify user with comprehensive data
      await identifyUser(handle, {
        handle: handle,
        email: user.email?.address || undefined,
        created_at: createdAt ? new Date(parseInt(createdAt)).toISOString() : undefined,
        registered: registered,
        wallet_address: user.wallet?.address || undefined,
        signup_method: 'privy',
        user_id: userId || undefined,
        last_active: new Date().toISOString()
      });

      lastIdentifiedUser.current = handle;
      console.log('[InspectletTracker] User identified:', handle);
    } catch (error) {
      console.error('[InspectletTracker] Error identifying user:', error);
    }
  }, [ready, authenticated, user]);

  // Track page views
  const trackPageViewInternal = useCallback(async () => {
    const currentPath = location.pathname;
    
    // Skip if we already tracked this exact path
    if (lastTrackedPath.current === currentPath) {
      return;
    }

    try {
      const pageName = getPageName(currentPath);
      
      // Get additional context
      const userId = localStorage.getItem('dapps_user_id');
      const handle = localStorage.getItem('dapps_user_handle');
      const isAuthenticated = !!handle;

      await trackPageView(pageName, {
        authenticated: isAuthenticated,
        user_id: userId || undefined,
        user_handle: handle || undefined,
        referrer: document.referrer || undefined,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
      });

      lastTrackedPath.current = currentPath;
      console.log('[InspectletTracker] Page view tracked:', pageName, currentPath);
    } catch (error) {
      console.error('[InspectletTracker] Error tracking page view:', error);
    }
  }, [location.pathname, getPageName]);

  // Handle user authentication changes
  useEffect(() => {
    if (ready) {
      if (authenticated && user) {
        // User is logged in - identify them
        identifyUserInspectlet();
      } else {
        // User is not authenticated - reset session
        if (lastIdentifiedUser.current) {
          resetInspectlet();
          lastIdentifiedUser.current = null;
          console.log('[InspectletTracker] Reset to anonymous session');
        }
      }
    }
  }, [ready, authenticated, user, identifyUserInspectlet]);

  // Track page views on route changes
  useEffect(() => {
    // Small delay to ensure page has loaded
    const timer = setTimeout(() => {
      trackPageViewInternal();
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, trackPageViewInternal]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Re-identify user with updated data when profile changes
      const handle = localStorage.getItem('dapps_user_handle');
      if (handle && authenticated) {
        lastIdentifiedUser.current = null; // Force re-identification
        identifyUserInspectlet();
      }
    };

    // Listen for custom events
    document.addEventListener('dapps_profile_updated', handleProfileUpdate);
    window.addEventListener('avatar_updated', handleProfileUpdate);

    return () => {
      document.removeEventListener('dapps_profile_updated', handleProfileUpdate);
      window.removeEventListener('avatar_updated', handleProfileUpdate);
    };
  }, [authenticated, identifyUserInspectlet]);

  // Listen for auth invalidation
  useEffect(() => {
    const handleAuthInvalidated = () => {
      resetInspectlet();
      lastIdentifiedUser.current = null;
      console.log('[InspectletTracker] Auth invalidated, reset Inspectlet');
    };

    document.addEventListener('dapps_auth_invalidated', handleAuthInvalidated);

    return () => {
      document.removeEventListener('dapps_auth_invalidated', handleAuthInvalidated);
    };
  }, []);

  // This component doesn't render anything - it's purely for tracking
  return null;
};

export default InspectletTracker; 