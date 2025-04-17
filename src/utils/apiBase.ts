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

// Key validation state cache
interface KeyValidationState {
  lastChecked: number;
  isValid: boolean;
  retryCount: number;
  inProgress: boolean;
}

// Cache to store validation state and prevent excessive retries
const keyValidationCache: Record<string, KeyValidationState> = {};

// Time thresholds (in milliseconds)
const VALIDATION_CACHE_TIME = 5 * 60 * 1000; // 5 minutes 
const MIN_RETRY_INTERVAL = 10 * 1000; // 10 seconds
const MAX_RETRY_COUNT = 3; // Maximum number of retries in a short period

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
 * Check if we should refresh authentication based on time
 * @returns True if we should refresh auth
 */
export const shouldRefreshAuth = (): boolean => {
  const lastAuthTime = localStorage.getItem('dapps_last_auth_time');
  
  // If missing the last auth time, set it now but don't trigger auth
  if (!lastAuthTime) {
    localStorage.setItem('dapps_last_auth_time', Date.now().toString());
    return false;
  }
  
  const lastAuthTimestamp = parseInt(lastAuthTime, 10);
  const currentTime = Date.now();
  const sixHoursInMs = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  
  // Check if more than 6 hours have passed since last auth
  const shouldRefresh = currentTime - lastAuthTimestamp > sixHoursInMs;
  
  if (shouldRefresh) {
    console.log(`Time since last auth: ${(currentTime - lastAuthTimestamp) / (60 * 60 * 1000)} hours. Refreshing auth.`);
  } else {
    console.log(`Time since last auth: ${(currentTime - lastAuthTimestamp) / (60 * 1000)} minutes. No refresh needed.`);
  }
  
  return shouldRefresh;
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
  
  // Check the cache to avoid repeated validation attempts
  const cacheKey = userKey.substring(0, 8); // Use first 8 chars as cache key
  const now = Date.now();
  const cachedState = keyValidationCache[cacheKey];
  
  if (cachedState) {
    // If we checked recently and it was valid, return the cached result
    if (cachedState.isValid && now - cachedState.lastChecked < VALIDATION_CACHE_TIME) {
      return true;
    }
    
    // If we're already checking, don't start another check
    if (cachedState.inProgress) {
      return cachedState.isValid;
    }
    
    // If we've tried too many times recently and all failed, back off
    if (!cachedState.isValid && 
        cachedState.retryCount >= MAX_RETRY_COUNT && 
        now - cachedState.lastChecked < MIN_RETRY_INTERVAL) {
      console.warn(`Too many validation attempts for key ${cacheKey}. Backing off.`);
      return false;
    }
  }
  
  // Initialize or update the cache entry
  keyValidationCache[cacheKey] = {
    lastChecked: now,
    isValid: cachedState?.isValid || false,
    retryCount: cachedState?.retryCount || 0,
    inProgress: true
  };
  
  try {
    // Use a lightweight API call to check if the key is valid
    const response = await fetch(`${API_BASE_URL}/get_wallet_balance`, {
      method: 'GET',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (response.status === 401) {
      console.warn('User API key is invalid or expired');
      
      // Update cache
      keyValidationCache[cacheKey] = {
        lastChecked: now,
        isValid: false,
        retryCount: (cachedState?.retryCount || 0) + 1,
        inProgress: false
      };
      
      // Handle recovery process
      handleAuthRecovery();
      
      return false;
    }
    
    // Update cache with successful validation
    keyValidationCache[cacheKey] = {
      lastChecked: now,
      isValid: true,
      retryCount: 0,
      inProgress: false
    };
    
    return true;
  } catch (error) {
    console.error('Error validating API key:', error);
    
    // Update cache
    keyValidationCache[cacheKey] = {
      lastChecked: now,
      isValid: false, 
      retryCount: (cachedState?.retryCount || 0) + 1,
      inProgress: false
    };
    
    return false;
  }
};

/**
 * Create headers with the user's API key
 * @returns Headers object with the user's API key
 */
export const createAuthHeaders = (contentType = true): Record<string, string> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.warn('createAuthHeaders: No user key found in localStorage');
      return {};
    }
    
    // Debug log the key (truncated for security)
    const keyStart = userKey.substring(0, 5);
    const keyEnd = userKey.substring(userKey.length - 5);
    console.log(`Using API key: ${keyStart}...${keyEnd}`);
    
    const headers: Record<string, string> = {
      'x-user-key': userKey,
    };
    
    if (contentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  } catch (error) {
    console.error('Error creating auth headers:', error);
    return {};
  }
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

/**
 * Logout user from current device by invalidating the current API key
 * @returns Promise that resolves to true if successful
 */
export const logoutCurrentDevice = async (): Promise<boolean> => {
  const userKey = localStorage.getItem('dapps_user_key');
  
  if (!userKey) {
    // No key to invalidate, just clear local storage
    localStorage.clear();
    return true;
  }
  
  try {
    // Call the logout endpoint to invalidate only this key
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-key': userKey
      }
    });
    
    // Clear localStorage regardless of response
    localStorage.clear();
    
    return response.ok;
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Clear localStorage even if the API call fails
    localStorage.clear();
    
    return false;
  }
};

/**
 * Clean up authentication state when it becomes invalid
 * This helps prevent loops of failed requests with bad credentials
 */
export const cleanupAuthState = (): void => {
  console.log('Cleaning up auth state due to invalid authentication');
  
  // Clear all authentication-related items
  localStorage.removeItem('dapps_user_key');
  localStorage.removeItem('dapps_last_auth_time');
  
  // We keep the user ID, handle, and avatar to make re-login smoother
  // but clear the authentication token
  
  // Notify any listeners that auth has been invalidated
  const event = new CustomEvent('dapps_auth_invalidated');
  document.dispatchEvent(event);
  
  // Show a user-friendly message
  toast.error('Authentication expired. Please sign in again.');
};

/**
 * Handle graceful recovery when API key validation fails
 * This function will try to recover the session by clearing localStorage
 * and triggering a page reload to re-authenticate
 */
export const handleAuthRecovery = (): void => {
  // Clear auth timestamp to force a refresh on next auth check
  localStorage.removeItem('dapps_last_auth_time');
  
  // Show a user-friendly message
  toast.info('Your session has expired. Refreshing...');
  
  // Wait a moment, then reload the page
  setTimeout(() => {
    window.location.reload();
  }, 1000);
};

/**
 * Available boosters response interface
 */
export interface AvailableBoostersResponse {
  success: boolean;
  boosters: number;
  golden_boosters: number;
  total: number;
  base_value: number;
  effective_total: number;
  booster_details: Array<{
    id: number;
    activity: string;
    boost: number;
    received_on: string;
  }>;
  golden_booster_details: Array<{
    id: number;
    activity: string;
    boost: number;
    received_on: string;
  }>;
}

/**
 * Fetch available boosters for the user
 * @returns Promise that resolves to available boosters data
 */
export const fetchAvailableBoosters = async (): Promise<AvailableBoostersResponse | null> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) return null;
    
    const response = await fetch(`${API_BASE_URL}/roar_available_boosters`, {
      method: 'GET',
      headers: createAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching available boosters:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching available boosters:', error);
    return null;
  }
};

/**
 * Golden Booster Status Response interface
 */
export interface GoldenBoosterStatusResponse {
  success: boolean;
  user_id: number;
  boosters: {
    total_boost: number;
    available_to_claim: number;
    booster_details: Array<{
      type: string;
      name: string;
      description: string;
      boost: number;
      eligible: boolean;
      claimed: boolean;
      progress?: {
        current: number;
        required: number;
      };
    }>;
    claimed_boosters: Array<{
      id: number;
      activity: string;
      boost: number;
      received_on: string;
      status: number;
    }>;
  };
}

/**
 * Golden Booster Claim Response interface
 */
export interface GoldenBoosterClaimResponse {
  success: boolean;
  message: string;
  boost_added?: number;
  total_boost?: number;
  boosters_claimed?: Array<{
    type: string;
    boost: number;
  }>;
  total_boost_added?: number;
}

/**
 * Fetch status of all golden boosters
 * @returns Promise that resolves to golden booster status data
 */
export const fetchGoldenBoosterStatus = async (): Promise<GoldenBoosterStatusResponse | null> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) return null;
    
    const response = await fetch(`${API_BASE_URL}/golden_boosters/status`, {
      method: 'GET',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching golden booster status:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching golden booster status:', error);
    return null;
  }
};

/**
 * Claim a specific golden booster
 * @param type The type of booster to claim
 * @returns Promise that resolves to the claim response
 */
export const claimGoldenBooster = async (type: string): Promise<GoldenBoosterClaimResponse | null> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) return null;
    
    const response = await fetch(`${API_BASE_URL}/golden_boosters/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-key': userKey
      },
      body: JSON.stringify({ type })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error claiming golden booster:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error claiming golden booster:', error);
    return null;
  }
};

/**
 * Claim all eligible golden boosters
 * @returns Promise that resolves to the claim response
 */
export const claimAllGoldenBoosters = async (): Promise<GoldenBoosterClaimResponse | null> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) return null;
    
    const response = await fetch(`${API_BASE_URL}/golden_boosters/claim_all`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error claiming all golden boosters:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error claiming all golden boosters:', error);
    return null;
  }
};

/**
 * Regular Booster Status Response interface
 */
export interface RegularBoosterStatusResponse {
  success: boolean;
  user_id: number;
  today: string;
  available_boosters: Array<{
    type: string;
    name: string;
    boost: number;
    available: boolean;
    streak?: number;
  }>;
  used_or_unavailable_boosters: Array<{
    type: string;
    name: string;
    boost: number;
    streak?: number;
    used: boolean;
    available: boolean;
    requires_action?: boolean;
  }>;
  claimed_boosters: {
    available: Array<{
      id: number;
      activity: string;
      boost: number;
      received_on: string;
      claimed_on: string | null;
      status: number;
    }>;
    used_today: Array<{
      id: number;
      activity: string;
      boost: number;
      received_on: string;
      claimed_on: string;
      status: number;
    }>;
  };
}

/**
 * Regular Booster Claim Response interface
 */
export interface RegularBoosterClaimResponse {
  success: boolean;
  message: string;
  booster?: {
    type: string;
    boost: number;
    streak?: number;
    next_streak_boost?: number;
    tweet_id?: string;
    tweet_text?: string;
  };
}

/**
 * Fetch status of all regular boosters
 * @returns Promise that resolves to regular booster status data
 */
export const fetchRegularBoosterStatus = async (): Promise<RegularBoosterStatusResponse | null> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) return null;
    
    const response = await fetch(`${API_BASE_URL}/boosters/status`, {
      method: 'GET',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching regular booster status:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching regular booster status:', error);
    return null;
  }
};

/**
 * Claim a specific regular booster
 * @param type The type of booster to claim (daily_tweet, daily_quote_tweet, daily_checkin, post_streak, roar_streak)
 * @returns Promise that resolves to the claim response
 */
export const claimRegularBooster = async (type: string): Promise<RegularBoosterClaimResponse | null> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) return null;
    
    const response = await fetch(`${API_BASE_URL}/boosters/${type}`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error claiming ${type} booster:`, errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error claiming ${type} booster:`, error);
    return null;
  }
};

/**
 * Use a claimed booster for farming
 * @param boosterId The ID of the booster to use
 * @returns Promise that resolves to the use response
 */
export const useBooster = async (boosterId: number): Promise<RegularBoosterClaimResponse | null> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) return null;
    
    const response = await fetch(`${API_BASE_URL}/boosters/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-key': userKey
      },
      body: JSON.stringify({ booster_id: boosterId })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error using booster:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error using booster:', error);
    return null;
  }
};
