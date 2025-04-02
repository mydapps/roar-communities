import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface CommunityPrices {
  buy_price: number;
  sell_price: number;
  buy_price_usd: number;
  sell_price_usd: number;
}

export interface CommunityMarketCap {
  eth: number;
  usd: number;
}

export interface CommunityFees {
  admin_fees: number;
  reward_fees: number;
  platform_fees: number;
}

export interface CommunityRewards {
  available_rewards: number;
  last_distributed: string;
}

export interface CommunityUser {
  user_id: number;
  shares: number;
  is_admin: boolean;
  share_value: {
    eth: number;
    usd: number;
  };
}

export interface CommunityData {
  name: string;
  description: string;
  image: string;
  created_on: string;
  owner: string;
  type: number;
  shares: number;
  members_count: number;
  prices: CommunityPrices;
  market_cap: CommunityMarketCap;
  fees: CommunityFees;
  rewards: CommunityRewards;
  admin_fees_available: number;
}

export interface CommunityApiResponse {
  success: boolean;
  community: CommunityData;
  user?: CommunityUser;
  refetch?: () => Promise<void>;
}

// Development-only logging helper
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable dev logs when needed
    console.log(`[CommunityData] ${message}`, ...args);
  }
};

export const useCommunityData = (communityName: string | undefined) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommunityApiResponse | null>(null);

  const fetchCommunityData = async () => {
    if (!communityName) {
      setError('Community name is required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const userKey = localStorage.getItem('dapps_user_key');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (userKey) {
        headers['x-user-key'] = userKey;
      }

      debugLog(`Fetching community data for: ${communityName}`);

      const response = await fetch(`https://api.dapps.co/get_community?name=${encodeURIComponent(communityName)}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch community data: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      debugLog("Community API response:", responseData);
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to fetch community data');
      }
      
      // Process rewards data if available
      if (responseData.community && responseData.community.rewards) {
        debugLog("Full community data received:", responseData.community);
        
        try {
          const rawRewards = responseData.community.rewards;
          debugLog("Raw rewards data:", rawRewards);
          debugLog("Rewards type:", typeof rawRewards);
          debugLog("Available rewards type:", typeof rawRewards.available_rewards);
          debugLog("Available rewards value:", rawRewards.available_rewards);
          
          // Format available rewards to 8 decimal places
          if (typeof rawRewards.available_rewards === 'number') {
            responseData.community.rewards.available_rewards = parseFloat(
              rawRewards.available_rewards.toFixed(8)
            );
          }
          
          debugLog("Processed rewards data:", responseData.community.rewards);
        } catch (rewardsError) {
          console.error('Error processing rewards data:', rewardsError);
        }
      }
      
      // Add refetch function to the returned data
      responseData.refetch = fetchCommunityData;

      setData(responseData);
    } catch (err) {
      console.error('Error fetching community data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to load community data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [communityName]);

  // Return the data with the refetch function attached
  return { data, loading, error, refetch: fetchCommunityData };
};
