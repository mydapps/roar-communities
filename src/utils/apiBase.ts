
import { toast } from 'sonner';

/**
 * Base API URL for all requests
 */
export const API_BASE_URL = 'https://api.dapps.co';

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
