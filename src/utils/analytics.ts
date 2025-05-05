/**
 * Utility functions for Google Analytics tracking
 */

/**
 * Track a custom event in Google Analytics
 * @param eventName Name of the event to track
 * @param eventParams Optional parameters to include with the event
 */
export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
    console.log(`GA event: ${eventName}`, eventParams);
  } else {
    console.warn('Google Analytics not available, could not track event:', eventName);
  }
};

/**
 * Track user sign in events
 * @param method The method used for signing in
 * @param userId Optional user ID if available
 */
export const trackSignIn = (method: string, userId?: string) => {
  trackEvent('login', {
    method,
    user_id: userId || 'unknown'
  });
};

/**
 * Track screen views (for manual page tracking)
 * @param screenName Name of the screen being viewed
 * @param path Optional path of the screen
 */
export const trackScreenView = (screenName: string, path?: string) => {
  trackEvent('screen_view', {
    screen_name: screenName,
    screen_path: path || window.location.pathname
  });
};

/**
 * Track user interactions with content
 * @param action The action performed (e.g., 'click', 'share', 'like')
 * @param contentType The type of content interacted with
 * @param itemId Optional ID of the specific content item
 */
export const trackContentInteraction = (action: string, contentType: string, itemId?: string) => {
  trackEvent('content_interaction', {
    action,
    content_type: contentType,
    item_id: itemId || 'unknown'
  });
};

/**
 * Set user properties in Google Analytics
 * @param properties User properties to set
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', properties);
    console.log('GA user properties set:', properties);
  } else {
    console.warn('Google Analytics not available, could not set user properties');
  }
}; 