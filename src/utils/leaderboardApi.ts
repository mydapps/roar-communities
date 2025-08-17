import { createAuthHeaders } from './apiBase';

/**
 * Interface for individual farmer data
 */
export interface RoarFarmer {
  rank: number;
  handle: string;
  avatar: string | null;
  token_count: number;
  token_count_formatted: string;
}

/**
 * Interface for current user data
 */
export interface CurrentUserFarmer {
  rank: number;
  handle: string;
  avatar: string | null;
  token_count: number;
  token_count_formatted: string;
}

/**
 * Interface for top roar farmers response
 */
export interface TopRoarFarmersResponse {
  success: boolean;
  data: {
    top_farmers: RoarFarmer[];
    current_user: CurrentUserFarmer | null;
    total_farmers_shown: number;
    is_authenticated: boolean;
  };
  message?: string;
}

/**
 * Fetch top roar farmers leaderboard
 * @param limit Number of top farmers to fetch (default: 30)
 * @returns Promise that resolves to top roar farmers data
 */
export const fetchTopRoarFarmers = async (limit: number = 30): Promise<TopRoarFarmersResponse> => {
  try {
    const headers = createAuthHeaders();
    
    const response = await fetch(`/api/top_roar_farmers?limit=${limit}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch leaderboard: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching top roar farmers:', error);
    throw error;
  }
}; 