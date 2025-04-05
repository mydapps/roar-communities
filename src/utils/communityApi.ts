import { toast } from 'sonner';
import { API_BASE_URL, getUserApiKey, createAuthHeaders, validateUserApiKey } from './apiBase';

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
  priceChange?: {
    change24h?: number;
    change24hPercent?: string;
    change7d?: number;
    change7dPercent?: string;
  };
  rewards?: {
    available_rewards: number;
    last_distributed: string;
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

// Portfolio interfaces
export interface CommunityPortfolioItem {
  community: string;
  shares: number;
  description?: string;
  image: string;
  currentPrice?: {
    eth: number;
    usd: number;
    sell_eth?: number;
    sell_usd?: number;
  };
  price?: {
    eth: number;
    usd: number;
    sell_eth?: number;
    sell_usd?: number;
  };
  percentageChange?: string;
  price_change_percentage?: number;
  price_direction?: 'up' | 'down';
  value: {
    eth: number;
    usd: number;
  };
}

export interface PortfolioPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage?: boolean;
  has_next_page?: boolean;
  has_prev_page?: boolean;
  current_page?: number;
  total_pages?: number;
  total_items?: number;
}

export interface PortfolioSummaryData {
  totalValueEth: number;
  totalValueUsd: number;
  total_value_eth?: number;
  total_value_usd?: number;
}

export interface UserPortfolioResponse {
  success: boolean;
  userId?: number;
  data: {
    communities: CommunityPortfolioItem[];
    pagination: PortfolioPagination;
    portfolio: PortfolioSummaryData;
  };
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
  trending?: boolean;
  newest?: boolean;
  mostRewards?: boolean;
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
  totalSharePrice?: number | string;
  totalSharePriceUsd?: number | string;
  totalValue: string;
  communityName: string;
  error?: string;
  shares?: number;
}

/**
 * Share transaction confirmation response interface
 */
export interface ShareConfirmResponse {
  status: string;
  message: string;
  shareQuantity?: number;
  soldShares?: number; // For sell confirmation
  transactionHash?: string;
  totalReceived?: number; // For sell confirmation
  communityData?: {
    shares: number;
    members: number;
    description: string;
  };
  newShareBalance?: number; // Add this property for current user's updated share balance
  error?: string;
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
 * Interface for share value response
 */
export interface ShareValueResponse {
  success: boolean;
  data: {
    community: string;
    shares: number;
    image: string;
    price: {
      buy: {
        eth: number;
        usd: number;
      };
      sell: {
        eth: number;
        usd: number;
      };
      change_percentage: number;
      direction: 'up' | 'down';
    };
    value: {
      buy: {
        eth: number;
        usd: number;
      };
      sell: {
        eth: number;
        usd: number;
      };
    };
  };
}

/**
 * Fetch communities with optional search query
 */
export const fetchCommunities = async (options: FetchCommunitiesOptions): Promise<Community[]> => {
  try {
    const { personal, search, page = 1, limit = 10, category, trending, newest, mostRewards } = options;
    
    // Get user API key from local storage
    const userKey = getUserApiKey();
    
    if (!userKey && personal) {
      console.warn('User key is required for personal communities');
      return [];
    }
    
    // If this is a request that requires authentication, validate the key first
    if (personal && userKey) {
      const isValidKey = await validateUserApiKey();
      if (!isValidKey) {
        console.warn('Invalid user key detected, aborting fetchCommunities request');
        return [];
      }
    }
    
    // Construct API URL based on options
    let url = `${API_BASE_URL}/get_communities?page=${page}&limit=${limit}`;
    
    if (personal) {
      url += '&personal=1';
    }
    
    if (trending) {
      url += '&trending=1';
    }
    
    if (newest) {
      url += '&newest=1';
    }
    
    if (mostRewards) {
      url += '&mostRewards=1';
    }
    
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    if (search && search.trim() !== '') {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    
    console.log(`Fetching communities from: ${url}`);
    
    // Make the API request with headers
    const headers: HeadersInit = {};
    if (userKey) {
      headers['x-user-key'] = userKey;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    console.log(`Communities API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to fetch communities: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Communities API response structure:`, Object.keys(data));
    
    if (!data.success) {
      console.error('API returned success: false', data);
      return [];
    }
    
    if (!Array.isArray(data.communities)) {
      console.error('Expected communities array in response', data);
      return [];
    }
    
    return data.communities;
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

    // Ensure shareQuantity is passed correctly as a number
    const quantity = Number(shareQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      console.error(`Invalid share quantity: ${shareQuantity}, defaulting to 1`);
      shareQuantity = 1;
    }

    // Use the correct parameter name 'shares' instead of 'shareQuantity'
    const url = `${API_BASE_URL}/get_share_price?communityName=${encodeURIComponent(communityName)}&shares=${quantity}`;
    
    console.log(`Fetching share price for ${communityName}, quantity: ${quantity}`);
    
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
    // First, validate the user's API key
    const isValidApiKey = await validateUserApiKey();
    if (!isValidApiKey) {
      console.error('Invalid API key detected in buySharesPrecheck, aborting request');
      return {
        status: 'ERROR',
        error: 'Authentication error. Please refresh the page and try again.',
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalValue: '',
        communityName: communityName || ''
      };
    }
    
    const url = `${API_BASE_URL}/buy_shares_precheck`;
    const headers = createAuthHeaders();
    
    console.log(`Buy shares precheck for ${communityName}, quantity: ${shareQuantity}`);
    
    if (!communityName) {
      console.error('No community name provided to buySharesPrecheck');
      return {
        status: 'ERROR',
        error: 'Community name is required',
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalValue: '',
        communityName: ''
      };
    }
    
    if (isNaN(shareQuantity) || shareQuantity <= 0) {
      console.error(`Invalid share quantity: ${shareQuantity}`);
      return {
        status: 'ERROR',
        error: 'Invalid share quantity',
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalValue: '',
        communityName
      };
    }
    
    console.log('Request headers:', headers);
    console.log('Request body:', JSON.stringify({
      communityName,
      shareQuantity
    }));
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    const responseStatus = response.status;
    console.log(`Buy shares precheck response status: ${responseStatus}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Buy shares precheck failed with status ${responseStatus}: ${errorText}`);
      return {
        status: 'ERROR',
        error: `API error (${responseStatus}): ${errorText}`,
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalValue: '',
        communityName
      };
    }
    
    const data = await response.json();
    console.log('Buy shares precheck response:', data);
    
    if (!data || typeof data !== 'object') {
      console.error('Invalid API response format', data);
      return {
        status: 'ERROR',
        error: 'Invalid API response format',
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalValue: '',
        communityName
      };
    }
    
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
      console.error('Transaction precheck failed:', data.message || data.error);
      return {
        status: 'ERROR',
        error: data.message || data.error || 'Transaction precheck failed',
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalValue: '',
        communityName
      };
    }
    
    // Ensure numeric fields are properly parsed from strings if needed
    const result: SharePrecheckResponse = {
      ...data,
      status: data.status || 'ERROR',
      sharePrice: typeof data.sharePrice === 'string' ? parseFloat(data.sharePrice) : (data.sharePrice || 0),
      sharePriceUsd: typeof data.sharePriceUsd === 'string' ? parseFloat(data.sharePriceUsd) : (data.sharePriceUsd || 0),
      shareQuantity: Number(data.shareQuantity || shareQuantity),
      fee: data.fee || '0 ETH',
      totalValue: data.totalValue || '0 ETH',
      communityName: data.communityName || communityName
    };
    
    if (data.totalSharePrice !== undefined) {
      result.totalSharePrice = typeof data.totalSharePrice === 'string' ? 
        parseFloat(data.totalSharePrice) : data.totalSharePrice;
    }
    
    if (data.totalSharePriceUsd !== undefined) {
      result.totalSharePriceUsd = typeof data.totalSharePriceUsd === 'string' ? 
        parseFloat(data.totalSharePriceUsd) : data.totalSharePriceUsd;
    }
    
    return result;
  } catch (error) {
    console.error('Error in buy shares precheck:', error);
    return {
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fee: '',
      sharePrice: 0,
      sharePriceUsd: 0,
      shareQuantity: 0,
      totalValue: '',
      communityName
    };
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
    
    // Add validation
    if (!communityName) {
      console.error('No community name provided to buySharesConfirm');
      throw new Error('Community name is required');
    }
    
    if (isNaN(shareQuantity) || shareQuantity <= 0) {
      console.error(`Invalid share quantity: ${shareQuantity}`);
      throw new Error('Invalid share quantity');
    }
    
    // Log the API request details
    console.log('Buy shares confirm request:');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('Request body:', JSON.stringify({
      communityName,
      shareQuantity
    }));
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    console.log(`Buy shares confirm response status: ${response.status}`);
    
    // Check if the response is non-OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Buy shares confirmation failed with status ${response.status}: ${errorText}`);
      throw new Error(`Failed to confirm share purchase: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Buy shares confirmation response:', data);
    
    if (data.status !== 'SUCCESS') {
      console.error(`Buy shares confirmation returned non-success status: ${data.status}`);
      console.error('Error message:', data.message || data.error || 'Unknown error');
      return {
        status: data.status || 'ERROR',
        message: data.message || data.error || 'Transaction failed',
      };
    }
    
    return {
      ...data,
      shareQuantity: Number(data.shareQuantity || shareQuantity),
      newShareBalance: data.newShareBalance || (data.communityData?.shares || 0)
    };
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
    // First, validate the user's API key
    const isValidApiKey = await validateUserApiKey();
    if (!isValidApiKey) {
      console.error('Invalid API key detected in sellSharesPrecheck, aborting request');
      return {
        status: 'ERROR',
        error: 'Authentication error. Please refresh the page and try again.',
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalValue: '',
        communityName: communityName || ''
      };
    }
    
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
    
    if (data.status === 'DEPOSIT') {
      return {
        status: 'DEPOSIT',
        error: data.error || 'Insufficient ETH for gas fees. Please deposit ETH to proceed.',
        fee: '',
        sharePrice: 0,
        sharePriceUsd: 0,
        shareQuantity: 0,
        totalValue: '',
        communityName
      };
    }
    
    if (data.status === 'ERROR') {
      throw new Error(data.error || 'Failed to precheck share sale');
    }
    
    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || data.error || 'Transaction precheck failed');
    }
    
    // Ensure numeric fields are properly parsed from strings if needed
    const result: SharePrecheckResponse = {
      ...data,
      sharePrice: typeof data.sharePrice === 'string' ? parseFloat(data.sharePrice) : data.sharePrice,
      sharePriceUsd: typeof data.sharePriceUsd === 'string' ? parseFloat(data.sharePriceUsd) : data.sharePriceUsd,
      shareQuantity: Number(data.shareQuantity || shareQuantity),
      shares: Number(data.shares || shareQuantity)
    };
    
    return result;
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
      throw new Error(data.message || data.error || 'Transaction failed');
    }
    
    return {
      ...data,
      soldShares: Number(data.soldShares || shareQuantity),
      newShareBalance: data.newShareBalance || (data.communityData?.shares || 0)
    };
  } catch (error) {
    console.error('Error in sell shares confirmation:', error);
    throw error;
  }
};

// Development-only logging helper
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable dev logs when needed
    console.log(`[API] ${message}`, ...args);
  }
};

// Add a wallet balance cache to prevent excessive API calls
let walletBalanceCache: {
  data: WalletBalanceResponse | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

export const getWalletBalance = async (): Promise<WalletBalanceResponse> => {
  // Use cached data if available and not expired (5 minutes)
  const now = Date.now();
  if (walletBalanceCache.data && (now - walletBalanceCache.timestamp < 5 * 60 * 1000)) {
    debugLog("Using cached wallet balance");
    return walletBalanceCache.data;
  }

  debugLog("Fetching wallet balance");
  
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      // Return a default response with empty balance if no user key
      return {
        success: true,
        wallet: '',
        balance: {
          eth: '0.000',
          usd: 0,
          formatted: '0.000 ETH ($0.00)'
        },
        recentActivity: null
      };
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-user-key': userKey
    };
    
    const response = await fetch('https://api.dapps.co/get_wallet_balance', {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      // Get status code to handle different errors
      const statusCode = response.status;
      const errorData = await response.json();
      
      // Only log the error, don't throw
      debugLog(`Wallet balance fetch failed (${statusCode}):`, errorData);
      
      // If it's an auth error, don't treat it as critical
      if (statusCode === 401) {
        // Return a default balance
        const defaultResponse = {
          success: true,
          wallet: '',
          balance: {
            eth: '0.000',
            usd: 0,
            formatted: '0.000 ETH ($0.00)'
          },
          recentActivity: null
        };
        return defaultResponse;
      }
      
      throw new Error(`Failed to fetch wallet balance: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    debugLog("Wallet balance response:", data);
    
    // Update the cache
    walletBalanceCache = {
      data,
      timestamp: now
    };
    
    return data;
  } catch (error) {
    // Only log the error here, don't notify the user
    debugLog("Error fetching wallet balance:", error);
    
    // Return a default response to prevent app disruption
    return {
      success: true,
      wallet: '',
      balance: {
        eth: '0.000',
        usd: 0,
        formatted: '0.000 ETH ($0.00)'
      },
      recentActivity: null
    };
  }
};

/**
 * Get share value for a specific community
 */
export const getShareValue = async (communityName: string): Promise<ShareValueResponse> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) {
      throw new Error('User key not found');
    }
    
    const url = `${API_BASE_URL}/share_value?community=${encodeURIComponent(communityName)}`;
    
    console.log(`Fetching share value for ${communityName}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Share value fetch failed: ${errorText}`);
      throw new Error(`Failed to fetch share value: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Share value response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch share value');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching share value:', error);
    throw error;
  }
};

/**
 * Fetch user portfolio data with pagination
 */
export const getUserPortfolio = async (page = 1, limit = 10): Promise<UserPortfolioResponse> => {
  try {
    const userKey = getUserApiKey();
    if (!userKey) {
      throw new Error('User key not found');
    }
    
    const url = `${API_BASE_URL}/user_portfolio?page=${page}&limit=${limit}`;
    
    console.log(`Fetching user portfolio from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-key': userKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Portfolio fetch failed: ${errorText}`);
      throw new Error(`Failed to fetch portfolio: ${errorText}`);
    }
    
    const rawData = await response.json();
    console.log('User portfolio response:', rawData);
    
    if (!rawData.success) {
      throw new Error(rawData.message || 'Failed to fetch portfolio data');
    }
    
    // Normalize the API response to handle both response formats
    const result: UserPortfolioResponse = {
      success: rawData.success,
      userId: rawData.userId,
      data: {
        communities: (rawData.data?.communities || []).map((item: any) => {
          // Ensure we have valid price change data
          let priceChangePercentage = 0;
          if (typeof item.price_change_percentage === 'number') {
            priceChangePercentage = item.price_change_percentage;
          } else if (item.percentageChange) {
            priceChangePercentage = parseFloat(item.percentageChange);
          }
          
          // Format the percentage change with proper precision
          const formattedPercentage = priceChangePercentage !== 0 
            ? priceChangePercentage.toFixed(2) 
            : "0.00";
          
          // Log the price change data for debugging
          console.log(`Community ${item.community} price change:`, {
            original: item.price_change_percentage,
            percentageChange: item.percentageChange,
            normalized: priceChangePercentage,
            formatted: formattedPercentage
          });
          
          return {
            community: item.community,
            shares: item.shares,
            description: item.description,
            image: item.image,
            currentPrice: item.currentPrice || item.price,
            price: item.price,
            percentageChange: formattedPercentage,
            price_change_percentage: priceChangePercentage,
            price_direction: priceChangePercentage >= 0 ? 'up' : 'down',
            value: item.value
          };
        }),
        pagination: {
          currentPage: rawData.data?.pagination?.currentPage || rawData.data?.pagination?.current_page || 1,
          totalPages: rawData.data?.pagination?.totalPages || rawData.data?.pagination?.total_pages || 1,
          totalItems: rawData.data?.pagination?.totalItems || rawData.data?.pagination?.total_items || 0,
          hasNextPage: rawData.data?.pagination?.hasNextPage || rawData.data?.pagination?.has_next_page || false,
          hasPrevPage: rawData.data?.pagination?.hasPrevPage || rawData.data?.pagination?.has_prev_page || false
        },
        portfolio: {
          totalValueEth: rawData.data?.portfolio?.totalValueEth || rawData.data?.portfolio?.total_value_eth || 0,
          totalValueUsd: rawData.data?.portfolio?.totalValueUsd || rawData.data?.portfolio?.total_value_usd || 0
        }
      }
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    toast.error('Failed to load portfolio. Please try again.');
    throw error;
  }
};

/**
 * Transfer shares to another user or wallet address
 */
export interface ShareTransferResponse {
  success: boolean;
  message: string;
  transaction?: {
    hash: string;
    from: string;
    to: string;
    amount: string;
    community: string;
  };
  error?: string;
}

/**
 * Transfer shares to another user or wallet address
 */
export const transferShares = async (
  communityName: string, 
  amount: string, 
  toAddress: string
): Promise<ShareTransferResponse> => {
  try {
    const url = `${API_BASE_URL}/transfer_shares`;
    const headers = createAuthHeaders();
    
    console.log(`Transferring ${amount} shares of ${communityName} to ${toAddress}`);
    
    if (!communityName) {
      throw new Error('Community name is required');
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (!toAddress) {
      throw new Error('Recipient address is required');
    }
    
    // Prepare the request body
    const requestBody = {
      communityName,
      amount,
      toAddress
    };
    
    console.log('Transfer shares request payload:', JSON.stringify(requestBody));
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log(`Transfer shares response status: ${response.status}`);
    
    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        console.error(`Transfer shares failed with status ${response.status}: ${errorText}`);
        
        try {
          // Try to parse error as JSON
          errorData = JSON.parse(errorText);
        } catch {
          // If not JSON, use the text directly
          errorData = { message: errorText };
        }
      } catch (parseError) {
        errorData = { message: `Error ${response.status}` };
      }
      
      return {
        success: false,
        message: errorData.message || `Error: ${response.status}`,
        error: errorData.error || errorData.message
      };
    }
    
    const data = await response.json();
    console.log('Transfer shares response:', data);
    
    return data as ShareTransferResponse;
  } catch (error) {
    console.error('Error in transferring shares:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Search for users by handle
 */
export interface UserSearchResponse {
  success: boolean;
  users?: {
    items: Array<{
      id: number;
      handle: string;
      avatar_url: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    }
  };
  error?: string;
}

/**
 * Search for users by handle
 */
export const searchUsers = async (query: string, page: number = 1, limit: number = 5): Promise<UserSearchResponse> => {
  try {
    const url = `${API_BASE_URL}/search?user=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    const headers = createAuthHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`User search failed: ${errorText}`);
      return {
        success: false,
        error: errorText
      };
    }
    
    const data = await response.json();
    return data as UserSearchResponse;
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * ETH gas estimation response
 */
export interface ETHGasEstimateResponse {
  success: boolean;
  estimatedGasFee?: string;
  currentBalance?: string;
  totalCost?: string;
  hasSufficientBalance?: boolean;
  recipient?: string;
  message?: string;
  error?: string;
}

/**
 * ETH withdrawal response
 */
export interface ETHWithdrawalResponse {
  success: boolean;
  transaction?: {
    hash: string;
    from: string;
    to: string;
    amount: string;
  };
  message?: string;
  error?: string;
}

/**
 * Get estimated gas fee for ETH withdrawal
 */
export const getETHWithdrawalGasEstimate = async (
  amount: string,
  recipient: string,
  isAddress: boolean
): Promise<ETHGasEstimateResponse> => {
  try {
    const url = `${API_BASE_URL}/withdraw_eth_gas_estimate`;
    const headers = createAuthHeaders();
    
    // Build request body based on whether recipient is an address or handle
    const requestBody = {
      amount,
      ...(isAddress ? { address: recipient } : { handle: recipient.toLowerCase() })
    };
    
    console.log('ETH gas estimate request payload:', JSON.stringify(requestBody));
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log(`ETH gas estimate response status: ${response.status}`);
    
    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        console.error(`ETH gas estimate failed with status ${response.status}: ${errorText}`);
        
        try {
          // Try to parse error as JSON
          errorData = JSON.parse(errorText);
        } catch {
          // If not JSON, use the text directly
          errorData = { message: errorText };
        }
      } catch (parseError) {
        errorData = { message: `Error ${response.status}` };
      }
      
      return {
        success: false,
        message: errorData.message || `Error: ${response.status}`,
        error: errorData.error || errorData.message
      };
    }
    
    const data = await response.json();
    console.log('ETH gas estimate response:', data);
    
    return data as ETHGasEstimateResponse;
  } catch (error) {
    console.error('Error estimating ETH withdrawal gas:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Withdraw ETH to address or handle
 */
export const withdrawETH = async (
  amount: string,
  recipient: string,
  isAddress: boolean
): Promise<ETHWithdrawalResponse> => {
  try {
    const url = `${API_BASE_URL}/withdraw_eth`;
    const headers = createAuthHeaders();
    
    // Build request body based on whether recipient is an address or handle
    const requestBody = {
      amount,
      ...(isAddress ? { address: recipient } : { handle: recipient.toLowerCase() })
    };
    
    console.log('ETH withdrawal request payload:', JSON.stringify(requestBody));
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log(`ETH withdrawal response status: ${response.status}`);
    
    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        console.error(`ETH withdrawal failed with status ${response.status}: ${errorText}`);
        
        try {
          // Try to parse error as JSON
          errorData = JSON.parse(errorText);
        } catch {
          // If not JSON, use the text directly
          errorData = { message: errorText };
        }
      } catch (parseError) {
        errorData = { message: `Error ${response.status}` };
      }
      
      return {
        success: false,
        message: errorData.message || `Error: ${response.status}`,
        error: errorData.error || errorData.message
      };
    }
    
    const data = await response.json();
    console.log('ETH withdrawal response:', data);
    
    return data as ETHWithdrawalResponse;
  } catch (error) {
    console.error('Error withdrawing ETH:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Interface for creating a community
 */
export interface CreateCommunityConfig {
  name: string;
  handle: string;
  description?: string;
  isEncrypted: boolean;
  communityType: number; // 0 for General, 1 for Niche, 2 for Custom
  advancedConfig?: {
    k: number; // 1, 2, or 3
    alpha: number; // in ETH
    basePrice: number; // in ETH
    rewardPercentage: number; // max 5%
    adminEarningPercentage: number; // max 5%
  };
}

/**
 * Validates community creation parameters
 * @param config Community creation configuration
 * @returns Validation result with success flag and any error messages
 */
export const validateCommunityConfig = (config: CreateCommunityConfig): { 
  isValid: boolean; 
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};
  
  // Validate name
  if (!config.name) {
    errors.name = "Community name is required";
  } else if (config.name.length < 3) {
    errors.name = "Community name must be at least 3 characters";
  } else if (config.name.length > 50) {
    errors.name = "Community name must be less than 50 characters";
  }
  
  // Validate handle
  if (!config.handle) {
    errors.handle = "Community handle is required";
  } else {
    // Handle must be alphanumeric with hyphens only
    const handleRegex = /^[a-zA-Z0-9-]+$/;
    if (!handleRegex.test(config.handle)) {
      errors.handle = "Handle can only contain letters, numbers, and hyphens";
    } else if (config.handle.length > 64) {
      errors.handle = "Handle must be less than 64 characters";
    }
  }
  
  // Validate advanced config if applicable
  if (config.communityType === 2 && config.advancedConfig) {
    const { k, alpha, basePrice, rewardPercentage, adminEarningPercentage } = config.advancedConfig;
    
    // Validate k
    if (![1, 2, 3].includes(k)) {
      errors.k = "k must be 1, 2, or 3";
    }
    
    // Validate alpha
    if (alpha <= 0) {
      errors.alpha = "Alpha must be greater than 0";
    }
    
    // Validate basePrice
    if (basePrice < 0) {
      errors.basePrice = "Base price cannot be negative";
    }
    
    // Validate reward percentage
    if (rewardPercentage < 0 || rewardPercentage > 5) {
      errors.rewardPercentage = "Reward percentage must be between 0 and 5%";
    }
    
    // Validate admin earning percentage
    if (adminEarningPercentage < 0 || adminEarningPercentage > 5) {
      errors.adminEarningPercentage = "Admin earning percentage must be between 0 and 5%";
    }
    
    // Validate sum of percentages
    if (rewardPercentage + adminEarningPercentage > 5) {
      errors.totalPercentage = "Total of reward and admin percentages cannot exceed 5%";
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Creates a community with advanced configuration
 * @param config Advanced community configuration
 * @returns Promise with the creation response
 */
export const createCommunityConfig = async (config: CreateCommunityConfig): Promise<any> => {
  try {
    // Validate the configuration first
    const validation = validateCommunityConfig(config);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Invalid community configuration"
      };
    }

    // Check if we have a valid API key
    if (!(await validateUserApiKey())) {
      return {
        success: false,
        message: "Authentication failed. Please log in again."
      };
    }

    // Prepare the request body
    const requestBody: any = {
      name: config.name,
      handle: config.handle,
      description: config.description || "",
      is_encrypted: config.isEncrypted,
      community_type: config.communityType
    };

    // Add advanced config if applicable
    if (config.communityType === 2 && config.advancedConfig) {
      requestBody.advanced_config = {
        k: config.advancedConfig.k,
        alpha: config.advancedConfig.alpha,
        base_price: config.advancedConfig.basePrice,
        reward_percentage: config.advancedConfig.rewardPercentage,
        admin_earning_percentage: config.advancedConfig.adminEarningPercentage
      };
    }

    // Make the API call
    const response = await fetch(`${API_BASE_URL}/create_community_config`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to create community configuration",
        errors: data.errors
      };
    }

    return {
      success: true,
      data,
      message: "Community configuration created successfully"
    };
  } catch (error) {
    console.error("Error creating community config:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again."
    };
  }
};

/**
 * Creates a community with the given configuration
 * @param config Community configuration
 * @returns Promise with the creation response
 */
export const createCommunity = async (config: CreateCommunityConfig): Promise<any> => {
  try {
    // For advanced communities, we need a two-step process
    if (config.communityType === 2) {
      // First create the config
      const configResult = await createCommunityConfig(config);
      if (!configResult.success) {
        return configResult;
      }
      
      // Then create the community with the config ID
      const requestBody = {
        config_id: configResult.data.config_id
      };
      
      const response = await fetch(`${API_BASE_URL}/create_community`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Failed to create community",
          errors: data.errors
        };
      }
      
      return {
        success: true,
        data,
        message: "Community created successfully!"
      };
    } else {
      // For standard communities, we can create directly
      // Validate the configuration first
      const validation = validateCommunityConfig(config);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          message: "Invalid community configuration"
        };
      }
      
      // Prepare the request body
      const requestBody = {
        name: config.name,
        handle: config.handle,
        description: config.description || "",
        is_encrypted: config.isEncrypted,
        community_type: config.communityType
      };
      
      // Make the API call
      const response = await fetch(`${API_BASE_URL}/create_community`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Failed to create community",
          errors: data.errors
        };
      }
      
      return {
        success: true,
        data,
        message: "Community created successfully!"
      };
    }
  } catch (error) {
    console.error("Error creating community:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again."
    };
  }
};
