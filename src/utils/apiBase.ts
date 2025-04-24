import { toast } from 'sonner';

// Debug logging function
export const debugLog = (message: string, ...args: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${message}`, ...args);
  }
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
 * Check if the user is authenticated via cookies
 * @returns Promise that resolves to true if authenticated, false otherwise
 */
export const validateAuthentication = async (): Promise<boolean> => {
  try {
    // Use relative path for proxy
    const response = await fetch(`/api/test-auth`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based auth
    });
    
    if (response.status === 401) {
      console.warn('User authentication is invalid or expired');
      
      // Handle recovery process
      handleAuthRecovery();
      
      return false;
    }
    
    // Try to parse the response to verify it's successful
    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    console.error('Error validating authentication:', error);
    return false;
  }
};

/**
 * Create headers for requests
 * @returns Headers object with content type
 */
export const createAuthHeaders = (contentType = true): Record<string, string> => {
  try {
    const headers: Record<string, string> = {};
    
    if (contentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  } catch (error) {
    console.error('Error creating headers:', error);
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
 * Logout user from current device by invalidating the current session cookie
 * @returns Promise that resolves to true if successful
 */
export const logoutCurrentDevice = async (): Promise<boolean> => {
  try {
    // Use relative path for proxy
    const response = await fetch(`/api/logout`, {
      method: 'POST',
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
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
  localStorage.removeItem('dapps_user_id');
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
    // Use relative path for proxy
    const response = await fetch(`/api/roar_available_boosters`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based auth
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
    // Use relative path for proxy
    const response = await fetch(`/api/golden_boosters/status`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based auth
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
    // Use relative path for proxy
    const response = await fetch(`/api/golden_boosters/claim`, {
      method: 'POST',
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
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
    // Use relative path for proxy
    const response = await fetch(`/api/golden_boosters/claim_all`, {
      method: 'POST',
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
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
    // Use relative path for proxy
    const response = await fetch(`/api/boosters/status`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based auth
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
    // Use relative path for proxy
    const response = await fetch(`/api/boosters/${type}`, {
      method: 'POST',
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
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
    // Use relative path for proxy
    const response = await fetch(`/api/boosters/use`, {
      method: 'POST',
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
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

/**
 * Interface for user achievements
 */
export interface Achievement {
  id: string;
  name: string;
  type: string;
  description: string;
  unlocked: boolean;
  unlocked_at: string | null;
  rarity: string;
  display_color: string;
}

export interface AchievementsResponse {
  success: boolean;
  achievements: Achievement[];
}

/**
 * Fetch user achievements from the API
 * @returns Promise that resolves to achievements data
 */
export const fetchAchievements = async (): Promise<AchievementsResponse | null> => {
  try {
    // Use relative path for proxy
    const response = await fetch(`/api/achievements`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based auth
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching achievements:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return null;
  }
};

/**
 * ETH price API response interface
 */
export interface EthPriceResponse {
  success: boolean;
  price?: number;
  error?: string;
}

/**
 * Fetch current ETH price in USD
 * @returns Promise that resolves to ETH price data
 */
export const fetchEthPrice = async (): Promise<EthPriceResponse> => {
  try {
    // Use relative path for proxy
    const response = await fetch(`/api/eth_price`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching ETH price:', errorData);
      return { success: false, error: 'Failed to fetch ETH price' };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return { success: false, error: 'Failed to fetch ETH price' };
  }
};

/**
 * Configure global defaults for axios if it's used
 * This is a precaution in case axios is used elsewhere in the codebase
 */
export const setupAxiosDefaults = (): void => {
  try {
    // Try to import axios dynamically
    import('axios').then((axios) => {
      axios.default.defaults.withCredentials = true;
      console.log('Axios configured to use credentials with all requests');
    }).catch(() => {
      // If axios is not installed, just skip silently
    });
  } catch (error) {
    // Ignore errors if axios is not available
  }
};

// Call the setup function immediately
setupAxiosDefaults();

// Add type for Referral Gas Estimate API Response
export interface ReferralGasEstimateResponse {
  success: boolean;
  estimated_gas?: number;
  gas_cost_eth?: string;
  available_earnings?: string;
  net_amount?: string;
  is_profitable?: boolean;
  message?: string; // For errors
}

// Add type for Referral Withdrawal API Response
export interface ReferralWithdrawalResponse {
  success: boolean;
  transaction_hash?: string;
  withdrawn_amount?: string;
  address?: string;
  message?: string; // For errors
  error?: { // For detailed errors
    status: string;
    message: string;
  };
}

// Function to fetch referral withdrawal gas estimate
export const fetchReferralGasEstimate = async (): Promise<ReferralGasEstimateResponse> => {
  debugLog('Fetching referral gas estimate...');
  try {
    const response = await fetch('/api/referral_gas_estimate', {
      method: 'GET',
      headers: createAuthHeaders(false), // No content-type needed for GET
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData: ReferralGasEstimateResponse = await response.json().catch(() => ({
        success: false,
        message: `HTTP error ${response.status}: Failed to fetch gas estimate`,
      }));
      debugLog('Error fetching referral gas estimate:', errorData);
      return { ...errorData, success: false };
    }

    const data: ReferralGasEstimateResponse = await response.json();
    debugLog('Referral gas estimate fetched successfully:', data);
    return data;

  } catch (error) {
    debugLog('Network or other error fetching referral gas estimate:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred while fetching the gas estimate.',
    };
  }
};

// Function to withdraw referral earnings
export const withdrawReferralEarnings = async (): Promise<ReferralWithdrawalResponse> => {
  debugLog('Attempting to withdraw referral earnings...');
  try {
    const response = await fetch('/api/withdraw_referral_earnings', {
      method: 'POST',
      headers: createAuthHeaders(), // Includes Content-Type: application/json
      credentials: 'include',
      // No body needed for this specific withdrawal endpoint as per user description
    });

    if (!response.ok) {
       const errorData: ReferralWithdrawalResponse = await response.json().catch(() => ({
        success: false,
        message: `HTTP error ${response.status}: Withdrawal failed`,
       }));
       debugLog('Error withdrawing referral earnings:', errorData);
      // Ensure the error structure from the API is preserved if available
      return {
        success: false,
        message: errorData.message || `HTTP error ${response.status}: Withdrawal failed`,
        error: errorData.error,
       };
    }

    const data: ReferralWithdrawalResponse = await response.json();
    debugLog('Referral earnings withdrawn successfully:', data);
    return data;

  } catch (error) {
    debugLog('Network or other error withdrawing referral earnings:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred during withdrawal.',
    };
  }
};
