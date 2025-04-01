import { toast } from 'sonner';
import { API_BASE_URL, getUserApiKey, createAuthHeaders } from './apiBase';

/**
 * Interface for community data
 */
export interface Community {
  name: string;
  description?: string;
  image?: string;
  type?: string;
  sharePrice?: {
    buyPrice: number;
    sellPrice: number;
  };
  userShares?: number;
  isAdmin?: number;
  membersCount: number;
  usdPrice?: number;
  marketCap?: string;
  last7Prices?: number[];
  userAvatars?: string[];
  metaUserInfo?: number;
}

/**
 * Options for fetching communities
 */
export interface FetchCommunitiesOptions {
  personal?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  category?: string;
}

/**
 * Share transaction precheck response interface
 */
export interface SharePrecheckResponse {
  status: string;
  fee: string;
  sharePrice: number | string;
  sharePriceUsd: number | string;
  shareQuantity: number;
  totalSharePrice: number | string;
  totalSharePriceUsd: number | string;
  totalValue: string;
  communityName: string;
  error?: string;
}

/**
 * Share transaction confirmation response interface
 */
export interface ShareConfirmResponse {
  status: string;
  message: string;
  shareQuantity: number;
  transactionHash: string;
  communityData: {
    shares: number;
    members: number;
    description: string;
  };
}

/**
 * Wallet balance response interface
 */
export interface WalletBalanceResponse {
  success: boolean;
  wallet: string;
  balance: {
    eth: string;
    usd: number;
    formatted: string;
  };
  recentActivity: {
    count: number;
    lastUpdated: string;
  };
}

/**
 * Share price response interface
 */
export interface SharePriceResponse {
  currentBuyPrice: string;
  currentSellPrice: string;
  totalShares: string;
  requestedShares: number;
  buyTotalRequired: string;
  buyShareCost: string;
  buyScAdminFee: string;
  buyCommunityAdminFee: string;
  buyMemberRewardsFee: string;
  sellTotalReturn: string;
  sellNetReturn: string;
  sellScAdminFee: string;
  sellCommunityAdminFee: string;
  sellMemberRewardsFee: string;
  buyPriceImpact: string;
  sellPriceImpact: string;
}

/**
 * Fetch communities with optional search query
 */
export const fetchCommunities = async (options: FetchCommunitiesOptions): Promise<Community[]> => {
  try {
    const { personal, search, page = 1, limit = 10, category } = options;
    
    // Get user API key from local storage
    const userKey = getUserApiKey();
    
    if (!userKey) {
      return [];
    }
    
    // Construct API URL based on options
    let url = `${API_BASE_URL}/get_communities?page=${page}&limit=${limit}`;
    if (personal) {
      url += '&personal=1';
    }
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (search && search.trim() !== '') {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    
    console.log(`Fetching communities from: ${url}`);
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
      },
    });
    
    console.log(`Communities API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to fetch communities: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Communities API response structure:`, Object.keys(data));
    console.log(`Success property:`, data.success);
    
    let communities: Community[] = [];
    
    if (data.success && data.communities && Array.isArray(data.communities)) {
      // New API format
      console.log(`Found communities array with length: ${data.communities.length}`);
      if (data.communities.length > 0) {
        console.log('First community data sample:', data.communities[0]);
      }
      
      communities = data.communities.map((community: any) => ({
        name: community.name || 'Unknown Community',
        description: community.description || '',
        image: community.image || '',
        type: community.type || 'General',
        sharePrice: community.sharePrice,
        userShares: community.userShares,
        isAdmin: community.isAdmin,
        membersCount: parseInt(String(community.membersCount || '0'), 10),
        usdPrice: community.usdPrice,
        marketCap: community.marketCap,
        last7Prices: community.last7Prices,
        userAvatars: community.userAvatars,
        metaUserInfo: community.metaUserInfo
      }));
    } else if (Array.isArray(data)) {
      // Old API format
      console.log(`Fetched ${data.length} communities successfully (old format)`);
      communities = data.map((community: any) => ({
        name: community.name || 'Unknown Community',
        description: community.description || '',
        image: community.image || '',
        membersCount: parseInt(String(community.membersCount || '0'), 10),
        userAvatars: community.userAvatars || []
      }));
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format');
    }
    
    console.log('Transformed communities:', communities.length);
    return communities;
  } catch (error) {
    console.error('Error fetching communities:', error);
    toast.error('Failed to load communities. Please try again.');
    return [];
  }
};

/**
 * Get share price information
 */
export const getSharePrice = async (communityName: string, shareQuantity: number): Promise<SharePriceResponse> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) {
      throw new Error('User key not found');
    }

    const url = `${API_BASE_URL}/get_share_price?communityName=${encodeURIComponent(communityName)}&shareQuantity=${shareQuantity}`;
    
    console.log(`Fetching share price for ${communityName}, quantity: ${shareQuantity}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Share price fetch failed: ${errorText}`);
      throw new Error(`Failed to fetch share price: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Share price response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching share price:', error);
    throw error;
  }
};

/**
 * Perform a precheck for buying community shares
 */
export const buySharesPrecheck = async (communityName: string, shareQuantity: number): Promise<SharePrecheckResponse> => {
  try {
    const url = `${API_BASE_URL}/buy_shares_precheck`;
    const headers = createAuthHeaders();
    
    console.log(`Buy shares precheck for ${communityName}, quantity: ${shareQuantity}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Buy shares precheck failed: ${errorText}`);
      throw new Error(`Failed to precheck share purchase: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Buy shares precheck response:', data);
    
    if (data.status === 'DEPOSIT') {
      return {
        status: 'DEPOSIT',
        error: data.error || 'Insufficient ETH balance. Please deposit ETH to proceed.',
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalSharePrice: 0,
        totalSharePriceUsd: 0,
        totalValue: '',
        communityName
      };
    }
    
    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || data.error || 'Transaction precheck failed');
    }
    
    // Ensure numeric fields are properly parsed from strings if needed
    if (typeof data.sharePrice === 'string') {
      data.sharePrice = parseFloat(data.sharePrice);
    }
    
    if (typeof data.sharePriceUsd === 'string') {
      data.sharePriceUsd = parseFloat(data.sharePriceUsd);
    }
    
    if (typeof data.totalSharePrice === 'string') {
      data.totalSharePrice = parseFloat(data.totalSharePrice);
    }
    
    if (typeof data.totalSharePriceUsd === 'string') {
      data.totalSharePriceUsd = parseFloat(data.totalSharePriceUsd);
    }
    
    return data;
  } catch (error) {
    console.error('Error in buy shares precheck:', error);
    throw error;
  }
};

/**
 * Confirm buying community shares
 */
export const buySharesConfirm = async (communityName: string, shareQuantity: number): Promise<ShareConfirmResponse> => {
  try {
    const url = `${API_BASE_URL}/buy_shares_confirm`;
    const headers = createAuthHeaders();
    
    console.log(`Confirming buy shares for ${communityName}, quantity: ${shareQuantity}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Buy shares confirmation failed: ${errorText}`);
      throw new Error(`Failed to confirm share purchase: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Buy shares confirmation response:', data);
    
    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || 'Transaction failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error in buy shares confirmation:', error);
    throw error;
  }
};

/**
 * Perform a precheck for selling community shares
 */
export const sellSharesPrecheck = async (communityName: string, shareQuantity: number): Promise<SharePrecheckResponse> => {
  try {
    const url = `${API_BASE_URL}/sell_shares_precheck`;
    const headers = createAuthHeaders();
    
    console.log(`Sell shares precheck for ${communityName}, quantity: ${shareQuantity}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sell shares precheck failed: ${errorText}`);
      throw new Error(`Failed to precheck share sale: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Sell shares precheck response:', data);
    
    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || 'Transaction precheck failed');
    }
    
    // Ensure numeric fields are properly parsed from strings if needed
    if (typeof data.sharePrice === 'string') {
      data.sharePrice = parseFloat(data.sharePrice);
    }
    
    if (typeof data.sharePriceUsd === 'string') {
      data.sharePriceUsd = parseFloat(data.sharePriceUsd);
    }
    
    if (typeof data.totalSharePrice === 'string') {
      data.totalSharePrice = parseFloat(data.totalSharePrice);
    }
    
    if (typeof data.totalSharePriceUsd === 'string') {
      data.totalSharePriceUsd = parseFloat(data.totalSharePriceUsd);
    }
    
    return data;
  } catch (error) {
    console.error('Error in sell shares precheck:', error);
    throw error;
  }
};

/**
 * Confirm selling community shares
 */
export const sellSharesConfirm = async (communityName: string, shareQuantity: number): Promise<ShareConfirmResponse> => {
  try {
    const url = `${API_BASE_URL}/sell_shares_confirm`;
    const headers = createAuthHeaders();
    
    console.log(`Confirming sell shares for ${communityName}, quantity: ${shareQuantity}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sell shares confirmation failed: ${errorText}`);
      throw new Error(`Failed to confirm share sale: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Sell shares confirmation response:', data);
    
    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || 'Transaction failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error in sell shares confirmation:', error);
    throw error;
  }
};

/**
 * Get user's wallet balance
 */
export const getWalletBalance = async (): Promise<WalletBalanceResponse> => {
  try {
    const url = `${API_BASE_URL}/get_wallet_balance`;
    const headers = createAuthHeaders(false);
    
    console.log('Fetching wallet balance');
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Wallet balance fetch failed: ${errorText}`);
      throw new Error(`Failed to fetch wallet balance: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Wallet balance response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch wallet balance');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
};
