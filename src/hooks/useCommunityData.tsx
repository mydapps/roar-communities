import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface CommunityPrices {
  buy_price: number;
  sell_price: number;
  buy_price_usd: number;
  sell_price_usd: number;
  price_change_percent: number;
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

      // Use relative proxy path
      const response = await fetch(`/api/get_community?name=${encodeURIComponent(communityName)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Add credentials
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setData(data);
      } else {
        throw new Error(data.message || 'Failed to load community data');
      }
    } catch (err) {
      console.error("Failed to fetch community data:", err);
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
