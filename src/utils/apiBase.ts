import { toast } from 'sonner';

/**
 * Base API URL for all requests
 */
export const API_BASE_URL = 'https://api.dapps.co';

// Debug logging function
export const debugLog = (message: string, ...args: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${message}`, ...args);
  }
};

/**
 * Get the user's API key from local storage
 * @returns The user's API key or null if not found
 */
export const getUserApiKey = (): string | null => {
  const userKey = localStorage.getItem('dapps_user_key');
  
  if (!userKey) {
    console.error('No user key found');
    toast.error('Authentication required. Please log in again.');
    return null;
  }
  
  return userKey;
};

/**
 * Check if the user's API key is valid
 * @returns Promise that resolves to true if valid, false otherwise
 */
export const validateUserApiKey = async (): Promise<boolean> => {
  const userKey = localStorage.getItem('dapps_user_key');
  
  if (!userKey) {
    console.error('No user key found for validation');
    return false;
  }
  
  try {
    // Use a lightweight API call to check if the key is valid
    const response = await fetch(`${API_BASE_URL}/get_wallet_balance`, {
      method: 'GET',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (response.status === 401) {
      console.warn('User API key is invalid, triggering authentication reset');
      
      // Clear auth timestamp to force a refresh on next auth check
      localStorage.removeItem('dapps_last_auth_time');
      
      // Show a user-friendly message
      toast.info('Your session has expired. Refreshing...');
      
      // Wait a moment, then reload the page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
};

/**
 * Create headers with the user's API key
 * @returns Headers object with the user's API key
 */
export const createAuthHeaders = (contentType = true): Record<string, string> => {
  const userKey = getUserApiKey();
  
  if (!userKey) {
    return {};
  }
  
  const headers: Record<string, string> = {
    'x-user-key': userKey,
  };
  
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

/**
 * Setup event listener for a custom event
 * @param eventName Name of the event to listen for
 * @param callback Function to call when the event is triggered
 * @returns Cleanup function to remove the event listener
 */
export const setupEventListener = (eventName: string, callback: () => void) => {
  document.addEventListener(eventName, callback);
  return () => {
    document.removeEventListener(eventName, callback);
  };
};
