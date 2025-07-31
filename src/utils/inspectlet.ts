// Inspectlet Analytics Integration
// Provides comprehensive user session tracking and identification

// Declare global inspectlet interface for TypeScript
declare global {
  interface Window {
    __insp?: any[];
  }
}

// Inspectlet user data interface
interface InspectletUserData {
  handle?: string;
  email?: string;
  registered?: boolean;
  roar_balance?: number;
  communities_count?: number;
  posts_count?: number;
  wallet_address?: string;
  signup_method?: string;
  last_active?: string;
  created_at?: string;
  plan?: string;
  user_id?: string;
}

// Check if Inspectlet is loaded
const isInspectletLoaded = (): boolean => {
  return typeof window !== 'undefined' && Array.isArray(window.__insp);
};

// Wait for Inspectlet to load with timeout
const waitForInspectlet = (timeoutMs = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (isInspectletLoaded()) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = timeoutMs / 100;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (isInspectletLoaded()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.warn('[Inspectlet] SDK failed to load within timeout');
        resolve(false);
      }
    }, 100);
  });
};

// Safe Inspectlet execution wrapper
const executeInspectlet = async (action: () => void, actionName: string) => {
  try {
    const isLoaded = await waitForInspectlet();
    if (!isLoaded) {
      console.warn(`[Inspectlet] Cannot execute ${actionName} - SDK not loaded`);
      return;
    }
    
    action();
  } catch (error) {
    console.error(`[Inspectlet] Error executing ${actionName}:`, error);
  }
};

/**
 * Identify user in Inspectlet with their handle
 * @param userHandle - User's unique handle for identification
 * @param userData - Additional user properties for session tagging
 */
export const identifyUser = async (userHandle: string, userData?: Partial<InspectletUserData>) => {
  await executeInspectlet(() => {
    if (!window.__insp) return;
    
    // Identify user with their handle as per Inspectlet docs
    console.log('[Inspectlet] Identifying user:', userHandle);
    window.__insp.push(['identify', userHandle]);
    
    // Tag session with additional user data if provided
    if (userData) {
      const sessionTags = {
        user_handle: userHandle,
        registered: userData.registered || false,
        signup_method: userData.signup_method || 'unknown',
        plan: userData.plan || 'free',
        ...userData,
        identified_at: new Date().toISOString()
      };
      
      console.log('[Inspectlet] Tagging session with user data:', sessionTags);
      window.__insp.push(['tagSession', sessionTags]);
    }
  }, 'identifyUser');
};

/**
 * Tag session with custom metadata
 * @param tags - Session tags (can be string or object)
 */
export const tagSession = async (tags: string | Record<string, any>) => {
  await executeInspectlet(() => {
    if (!window.__insp) return;
    
    console.log('[Inspectlet] Tagging session:', tags);
    window.__insp.push(['tagSession', tags]);
  }, 'tagSession');
};

/**
 * Track page visits
 * @param pageName - Name of the page being visited
 * @param additionalData - Additional page data for session tagging
 */
export const trackPageView = async (pageName: string, additionalData?: Record<string, any>) => {
  await tagSession({
    page_visit: pageName,
    page_url: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

/**
 * Track user signup event
 * @param signupMethod - Method used for signup (privy, wallet, etc.)
 * @param additionalData - Additional signup data
 */
export const trackSignup = async (signupMethod: string, additionalData?: Record<string, any>) => {
  await tagSession({
    event: 'user_signup',
    signup_method: signupMethod,
    is_new_user: true,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

/**
 * Track user login event
 * @param loginMethod - Method used for login
 * @param additionalData - Additional login data
 */
export const trackLogin = async (loginMethod: string, additionalData?: Record<string, any>) => {
  await tagSession({
    event: 'user_login',
    login_method: loginMethod,
    is_returning_user: true,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

/**
 * Track community interactions
 */
export const trackCommunityAction = async (action: string, communityData?: Record<string, any>) => {
  await tagSession({
    event: 'community_action',
    action: action,
    timestamp: new Date().toISOString(),
    ...communityData
  });
};

/**
 * Track post interactions
 */
export const trackPostAction = async (action: string, postData?: Record<string, any>) => {
  await tagSession({
    event: 'post_action',
    action: action,
    timestamp: new Date().toISOString(),
    ...postData
  });
};

/**
 * Track tip interactions
 */
export const trackTipAction = async (action: string, tipData?: Record<string, any>) => {
  await tagSession({
    event: 'tip_action',
    action: action,
    timestamp: new Date().toISOString(),
    ...tipData
  });
};

/**
 * Track messaging interactions
 */
export const trackMessagingAction = async (action: string, messageData?: Record<string, any>) => {
  await tagSession({
    event: 'messaging_action',
    action: action,
    timestamp: new Date().toISOString(),
    ...messageData
  });
};

/**
 * Track form interactions and conversions
 */
export const trackFormAction = async (action: string, formData?: Record<string, any>) => {
  await tagSession({
    event: 'form_action',
    action: action,
    timestamp: new Date().toISOString(),
    ...formData
  });
};

/**
 * Track purchase/transaction events
 */
export const trackPurchase = async (purchaseData?: Record<string, any>) => {
  await tagSession({
    event: 'purchase',
    purchase: true,
    timestamp: new Date().toISOString(),
    ...purchaseData
  });
};

/**
 * Track error events
 */
export const trackError = async (errorData?: Record<string, any>) => {
  await tagSession({
    event: 'error',
    timestamp: new Date().toISOString(),
    ...errorData
  });
};

/**
 * Reset Inspectlet session (for logout)
 * Note: Inspectlet doesn't have an explicit "anonymous" method like UserPilot,
 * but we can tag the session to indicate user logout
 */
export const resetInspectlet = async () => {
  await tagSession({
    event: 'user_logout',
    user_state: 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  console.log('[Inspectlet] User logged out, session tagged as anonymous');
};

/**
 * Update user data in Inspectlet
 * @param userHandle - User handle
 * @param updatedData - Updated user properties
 */
export const updateUserData = async (userHandle: string, updatedData: Partial<InspectletUserData>) => {
  // Re-identify with updated data and tag session
  await identifyUser(userHandle, updatedData);
  
  // Also tag the session with an update event
  await tagSession({
    event: 'user_data_updated',
    updated_fields: Object.keys(updatedData),
    timestamp: new Date().toISOString()
  });
};

// Export default object for easy importing
export default {
  identifyUser,
  tagSession,
  trackPageView,
  trackSignup,
  trackLogin,
  trackCommunityAction,
  trackPostAction,
  trackTipAction,
  trackMessagingAction,
  trackFormAction,
  trackPurchase,
  trackError,
  resetInspectlet,
  updateUserData,
  isInspectletLoaded,
  waitForInspectlet
}; 