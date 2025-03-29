
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
}

export const useCommunityData = (communityName: string | undefined) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommunityApiResponse | null>(null);

  useEffect(() => {
    if (!communityName) {
      setError('Community name is required');
      setLoading(false);
      return;
    }

    const fetchCommunityData = async () => {
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

        console.log(`Fetching community data for: ${communityName}`);

        const response = await fetch(`https://api.dapps.co/get_community?name=${encodeURIComponent(communityName)}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch community data: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        
        console.log("Community API response:", responseData);
        
        if (!responseData.success) {
          throw new Error(responseData.message || 'Failed to fetch community data');
        }

        // Enhanced debug logging for rewards data
        if (responseData.community) {
          console.log("Full community data received:", responseData.community);
          
          if (responseData.community.rewards) {
            console.log("Raw rewards data:", responseData.community.rewards);
            console.log("Rewards type:", typeof responseData.community.rewards);
            console.log("Available rewards type:", typeof responseData.community.rewards.available_rewards);
            console.log("Available rewards value:", responseData.community.rewards.available_rewards);
            
            // Make sure rewards.available_rewards is a number
            if (responseData.community.rewards.available_rewards === null || 
                responseData.community.rewards.available_rewards === undefined) {
              console.warn("Rewards available was null or undefined, defaulting to 0");
              responseData.community.rewards.available_rewards = 0;
            } else if (typeof responseData.community.rewards.available_rewards === 'string') {
              console.log("Converting rewards from string to number:", responseData.community.rewards.available_rewards);
              const parsedValue = parseFloat(responseData.community.rewards.available_rewards);
              if (isNaN(parsedValue)) {
                console.warn("Failed to parse rewards as number, defaulting to 0");
                responseData.community.rewards.available_rewards = 0;
              } else {
                responseData.community.rewards.available_rewards = parsedValue;
              }
            }
            
            console.log("Processed rewards data:", responseData.community.rewards);
          } else {
            console.warn("No rewards data found in the community object");
            // Initialize rewards if missing
            responseData.community.rewards = {
              available_rewards: 0,
              last_distributed: ""
            };
          }
        }

        setData(responseData);
      } catch (err) {
        console.error('Error fetching community data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast.error('Failed to load community data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [communityName]);

  return { data, loading, error };
};
