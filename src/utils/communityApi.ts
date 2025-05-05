import { toast } from 'sonner';
import { createAuthHeaders, validateAuthentication } from './apiBase';

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
    const { personal, search, page = 1, limit = 10, category, trending, newest, mostRewards } = options;
    
  try {
    // Build the URL with query parameters
    const queryParams = new URLSearchParams();
    if (personal) queryParams.append('personal', '1');
    if (search) queryParams.append('search', search);
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (category) queryParams.append('category', category);
    if (trending) queryParams.append('trending', '1');
    if (newest) queryParams.append('newest', '1');
    if (mostRewards) queryParams.append('most_rewards', '1');
    
    // Create base URL
    const url = `/api/get_communities?${queryParams.toString()}`;
    
    // Create the request headers
    const headers = createAuthHeaders();
    
    // If this is a request that requires authentication, validate authentication first
    if (personal) {
      const isAuthenticated = await validateAuthentication();
      if (!isAuthenticated) {
        return [];
      }
    }
    
    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
    
    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    // Check if the request was successful
    if (data.success) {
      return data.communities || [];
    } else {
      throw new Error(data.message || 'Failed to fetch communities');
    }
  } catch (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
};

/**
 * Get share price information
 */
export const getSharePrice = async (communityName: string, shareQuantity: number): Promise<SharePriceResponse> => {
  try {
    const url = `/api/get_share_price?communityName=${encodeURIComponent(communityName)}&shares=${shareQuantity}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch share price: ${errorText}`);
    }
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Perform a precheck for buying community shares
 */
export const buySharesPrecheck = async (communityName: string, shareQuantity: number): Promise<SharePrecheckResponse> => {
  try {
    // First, validate the user's authentication
    const isAuthenticated = await validateAuthentication();
    if (!isAuthenticated) {
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
    
    const url = `/api/buy_shares_precheck`;
    const headers = createAuthHeaders();
    
    if (!communityName) {
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
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    const responseStatus = response.status;
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${responseStatus}): ${errorText}`);
    }
    
    const data = await response.json();
    
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
    throw error;
  }
};

/**
 * Confirm buying community shares
 */
export const buySharesConfirm = async (communityName: string, shareQuantity: number): Promise<ShareConfirmResponse> => {
  try {
    const url = `/api/buy_shares_confirm`;
    const headers = createAuthHeaders();
    
    if (!communityName) {
      throw new Error('Community name is required');
    }
    
    if (isNaN(shareQuantity) || shareQuantity <= 0) {
      throw new Error('Invalid share quantity');
    }
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to confirm share purchase: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || data.error || 'Transaction failed');
    }
    
    return {
      ...data,
      shareQuantity: Number(data.shareQuantity || shareQuantity),
      newShareBalance: data.newShareBalance || (data.communityData?.shares || 0)
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Perform a precheck for selling community shares
 */
export const sellSharesPrecheck = async (communityName: string, shareQuantity: number): Promise<SharePrecheckResponse> => {
  try {
    // First, validate the user's authentication
    const isAuthenticated = await validateAuthentication();
    if (!isAuthenticated) {
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
    
    const url = `/api/sell_shares_precheck`;
    const headers = createAuthHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to precheck share sale: ${errorText}`);
    }
    
    const data = await response.json();
    
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
    
    // Handle totalSharePrice if it exists in the response
    if (data.totalSharePrice !== undefined) {
      result.totalSharePrice = typeof data.totalSharePrice === 'string' ? 
        parseFloat(data.totalSharePrice) : data.totalSharePrice;
    } else if (data.sharePrice) {
      // Calculate totalSharePrice if not provided (price * quantity)
      const price = typeof data.sharePrice === 'string' ? 
        parseFloat(data.sharePrice) : data.sharePrice;
      result.totalSharePrice = price * shareQuantity;
    }
    
    // Handle totalSharePriceUsd if it exists in the response
    if (data.totalSharePriceUsd !== undefined) {
      result.totalSharePriceUsd = typeof data.totalSharePriceUsd === 'string' ? 
        parseFloat(data.totalSharePriceUsd) : data.totalSharePriceUsd;
    } else if (data.sharePriceUsd) {
      // Calculate totalSharePriceUsd if not provided (price * quantity)
      const priceUsd = typeof data.sharePriceUsd === 'string' ? 
        parseFloat(data.sharePriceUsd) : data.sharePriceUsd;
      result.totalSharePriceUsd = priceUsd * shareQuantity;
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Confirm selling community shares
 */
export const sellSharesConfirm = async (communityName: string, shareQuantity: number): Promise<ShareConfirmResponse> => {
  try {
    const url = `/api/sell_shares_confirm`;
    const headers = createAuthHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        communityName,
        shareQuantity
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to confirm share sale: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || data.error || 'Transaction failed');
    }
    
    return {
      ...data,
      soldShares: Number(data.soldShares || shareQuantity),
      newShareBalance: data.newShareBalance || (data.communityData?.shares || 0)
    };
  } catch (error) {
    throw error;
  }
};

// Development-only logging helper
const debugLog = (message: string, ...args: any[]) => {
  // Removed console.log
};

// Add a wallet balance cache variable at the top of the file
const walletBalanceCache: {
  data: WalletBalanceResponse | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

export const getWalletBalance = async (forceRefresh = false): Promise<WalletBalanceResponse> => {
  try {
    // First, validate the user's authentication
    const isAuthenticated = await validateAuthentication();
    if (!isAuthenticated) {
      return {
        success: false,
        wallet: '',
        balance: {
          eth: '0',
          usd: 0,
          formatted: '0'
        },
        recentActivity: {
          count: 0,
          lastUpdated: ''
        }
      };
    }
    
    const cachedBalance = localStorage.getItem('dapps_wallet_balance');
    const cachedTimestamp = localStorage.getItem('dapps_wallet_balance_timestamp');
    
    // Use cached balance if available and not forced refresh
    if (!forceRefresh && cachedBalance && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;
      
      if (now - timestamp < fiveMinutesInMs) {
        return JSON.parse(cachedBalance);
      }
    }
    
    // Fetch fresh balance
    const response = await fetch('/api/get_wallet_balance', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get wallet balance: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Cache the result
      localStorage.setItem('dapps_wallet_balance', JSON.stringify(data));
      localStorage.setItem('dapps_wallet_balance_timestamp', Date.now().toString());
    
    return data;
    } else {
      throw new Error(data.message || 'Failed to get wallet balance');
    }
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    toast.error('Failed to get wallet balance');
    
    // Create a default response
    return {
      success: false,
      wallet: '',
      balance: {
        eth: '0',
        usd: 0,
        formatted: '0'
      },
      recentActivity: {
        count: 0,
        lastUpdated: ''
      }
    };
  }
};

/**
 * Get share value for a specific community
 */
export const getShareValue = async (communityName: string): Promise<ShareValueResponse> => {
  try {
    const url = `/api/share_value?community=${encodeURIComponent(communityName)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch share value: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch share value');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch user portfolio data with pagination
 */
export const getUserPortfolio = async (page = 1, limit = 10): Promise<UserPortfolioResponse> => {
  try {
    const url = `/api/user_portfolio?page=${page}&limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch portfolio: ${errorText}`);
    }
    
    const rawData = await response.json();
    
    if (!rawData.success) {
      throw new Error(rawData.message || 'Failed to fetch portfolio');
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
    // Check if we have a valid API key
    if (!(await validateAuthentication())) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'Not authenticated'
      };
    }
    
    const url = `/api/transfer_shares`;
    
    const requestBody = {
      community: communityName,
      amount: amount,
      to: toAddress
    };
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        
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
    
    return data as ShareTransferResponse;
  } catch (error) {
    throw error;
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
    const url = `/api/search?user=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    const headers = createAuthHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText
      };
    }
    
    const data = await response.json();
    return data as UserSearchResponse;
  } catch (error) {
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
    const url = `/api/withdraw_eth_gas_estimate`;
    const headers = createAuthHeaders();
    
    // Build request body based on whether recipient is an address or handle
    const requestBody = {
      amount,
      ...(isAddress ? { address: recipient } : { handle: recipient.toLowerCase() })
    };
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        
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
    
    return data as ETHGasEstimateResponse;
  } catch (error) {
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
    const url = `/api/withdraw_eth`;
    const headers = createAuthHeaders();
    
    // Build request body based on whether recipient is an address or handle
    const requestBody = {
      amount,
      ...(isAddress ? { address: recipient } : { handle: recipient.toLowerCase() })
    };
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        
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
    
    return data as ETHWithdrawalResponse;
  } catch (error) {
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
    if (!(await validateAuthentication())) {
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
    const response = await fetch(`/api/create_community_config`, {
      method: 'POST',
      credentials: 'include',
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
      
      const response = await fetch(`/api/create_community`, {
        method: 'POST',
        credentials: 'include',
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
      const response = await fetch(`/api/create_community`, {
        method: 'POST',
        credentials: 'include',
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
    return {
      success: false,
      message: "An unexpected error occurred. Please try again."
    };
  }
};

// --- ADDED: Function to update community settings (Admin) ---
export const updateCommunityAdmin = async (communityName: string, updates: Record<string, any>) => {
  try {
    const token = localStorage.getItem('privy:token');
    if (!token) {
      throw new Error('Authentication required.');
    }

    const response = await fetch(`/api/communities/${encodeURIComponent(communityName)}/admin`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! Status: ${response.status}`);
    }

    return result; // Should contain { success: true, message: "..." }
  } catch (error) {
    console.error('Error updating community admin settings:', error);
    // Re-throw a structured error or return a standard error format
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred during update.' 
    };
  }
};
// --- END ADDED Function ---

// --- Interface for Muted User Data ---
export interface MutedUser {
  mute_id: number;
  uid: number;
  reason: string;
  muted_on: string;
  valid_upto: string;
  user_handle: string;
}

// --- Interface for Muted Users API Response ---
export interface MutedUsersApiResponse {
  success: boolean;
  data: MutedUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    has_next?: boolean; // Optional based on potential API variations
    has_prev?: boolean; // Optional
  };
  message?: string; // For errors
}

// --- Interface for Mute/Unmute API Response ---
export interface MuteActionResponse {
  success: boolean;
  message: string;
}


// --- ADDED: Function to mute a user in a community (Admin) ---
export const muteUserInCommunity = async (
  communityName: string, 
  userToMute: string, 
  reason: string, 
  durationHours: number
): Promise<MuteActionResponse> => {
  try {
    const token = localStorage.getItem('privy:token');
    if (!token) throw new Error('Authentication required.');

    const response = await fetch(`/api/communities/${encodeURIComponent(communityName)}/admin/mute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userHandleToMute: userToMute, reason, durationHours }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || `HTTP error! Status: ${response.status}`);
    return result;

  } catch (error) {
    console.error('Error muting user:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred while muting user.' 
    };
  }
};

// --- ADDED: Function to get muted users list (Admin) ---
export const getMutedUsers = async (
  communityName: string, 
  page: number = 1, 
  limit: number = 20
): Promise<MutedUsersApiResponse> => {
  try {
    const token = localStorage.getItem('privy:token');
    if (!token) throw new Error('Authentication required.');

    const response = await fetch(`/api/communities/${encodeURIComponent(communityName)}/admin/muted-users?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || `HTTP error! Status: ${response.status}`);
    
    // Basic validation of expected structure
    if (!result.success || !Array.isArray(result.data) || !result.pagination) {
      throw new Error('Invalid response structure from muted users API.');
    }

    return result;

  } catch (error) {
    console.error('Error fetching muted users:', error);
    return { 
      success: false, 
      data: [],
      pagination: { total: 0, page: 1, limit: limit, totalPages: 0 },
      message: error instanceof Error ? error.message : 'An unknown error occurred while fetching muted users.' 
    };
  }
};

// --- ADDED: Function to unmute a user in a community (Admin) ---
export const unmuteUserInCommunity = async (
  communityName: string, 
  userHandleToUnmute: string
): Promise<MuteActionResponse> => {
  try {
    const token = localStorage.getItem('privy:token');
    if (!token) throw new Error('Authentication required.');

    const response = await fetch(`/api/communities/${encodeURIComponent(communityName)}/admin/mute/${encodeURIComponent(userHandleToUnmute)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    // DELETE might return 204 No Content on success with no body, or 200 with body
    if (!response.ok && response.status !== 204) {
         throw new Error(result.message || `HTTP error! Status: ${response.status}`);
    }
    // Ensure success is true even if body might be empty on 204
    return { success: true, message: result.message || "User unmuted successfully." }; 

  } catch (error) {
    console.error('Error unmuting user:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred while unmuting user.' 
    };
  }
};


// --- END ADDED Functions ---

// Interface for invitable user
export interface InvitableUser {
  id: number;
  handle: string;
  avatar: string | null;
  invite_status: 'not_invited' | 'invited' | 'joined';
}

// Response interface for invitable followers
export interface InvitableUsersResponse {
  success: boolean;
  data: InvitableUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

// Response interface for invite action
export interface InviteActionResponse {
  success: boolean;
  message: string;
}

/**
 * Fetches followers that can be invited to a community
 */
export const getInvitableFollowers = async (
  communityName: string,
  page: number = 1,
  limit: number = 10
): Promise<InvitableUsersResponse> => {
  try {
    const isAuthenticated = await validateAuthentication();
    if (!isAuthenticated) {
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        },
        message: "Authentication required"
      };
    }
    
    const headers = createAuthHeaders();
    const url = `/api/communities/${encodeURIComponent(communityName)}/admin/invitable-followers?page=${page}&limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch invitable followers");
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Error fetching invitable followers:", error);
    return {
      success: false,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      },
      message: error.message || "Failed to fetch invitable followers"
    };
  }
};

/**
 * Invites a user to join a community
 */
export const inviteUserToCommunity = async (
  communityName: string,
  userHandleToInvite: string
): Promise<InviteActionResponse> => {
  try {
    const isAuthenticated = await validateAuthentication();
    if (!isAuthenticated) {
      return {
        success: false,
        message: "Authentication required"
      };
    }
    
    const headers = createAuthHeaders();
    const url = `/api/communities/${encodeURIComponent(communityName)}/admin/invites`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userHandleToInvite })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to send invitation");
    }
    
    return result;
  } catch (error: any) {
    console.error("Error inviting user to community:", error);
    return {
      success: false,
      message: error.message || "Failed to send invitation"
    };
  }
};

// Interface for admin fees response
export interface AdminFeesResponse {
  success: boolean;
  currentBalance?: {
    totalFees: number;
    adminFeesBalance: number;
  };
  pastWithdrawals?: Array<{
    amount: number;
    timestamp: string;
    txHash: string;
  }>;
  message?: string;
}

// Interface for gas estimation response
export interface WithdrawalGasEstimateResponse {
  success: boolean;
  estimatedGasCostEth?: number;
  message?: string;
}

// Interface for withdrawal response
export interface AdminFeesWithdrawalResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
  withdrawnAmount?: number;
}

/**
 * Fetches admin fees for a community
 */
export const getAdminFees = async (communityName: string): Promise<AdminFeesResponse> => {
  try {
    const isAuthenticated = await validateAuthentication();
    if (!isAuthenticated) {
      return {
        success: false,
        message: "Authentication required"
      };
    }
    
    const headers = createAuthHeaders();
    const url = `/api/communities/${encodeURIComponent(communityName)}/admin/fees`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch admin fees");
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Error fetching admin fees:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch admin fees"
    };
  }
};

/**
 * Estimates gas fee for admin fees withdrawal
 */
export const estimateWithdrawalGas = async (communityName: string): Promise<WithdrawalGasEstimateResponse> => {
  try {
    const isAuthenticated = await validateAuthentication();
    if (!isAuthenticated) {
      return {
        success: false,
        message: "Authentication required"
      };
    }
    
    const headers = createAuthHeaders();
    const url = `/api/communities/${encodeURIComponent(communityName)}/admin/fees/estimate-withdrawal-gas`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})  // Empty body since no parameters are required
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to estimate withdrawal gas");
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Error estimating withdrawal gas:", error);
    return {
      success: false,
      message: error.message || "Failed to estimate withdrawal gas"
    };
  }
};

/**
 * Withdraws admin fees for a community
 */
export const withdrawAdminFees = async (communityName: string): Promise<AdminFeesWithdrawalResponse> => {
  try {
    const isAuthenticated = await validateAuthentication();
    if (!isAuthenticated) {
      return {
        success: false,
        message: "Authentication required"
      };
    }
    
    const headers = createAuthHeaders();
    const url = `/api/communities/${encodeURIComponent(communityName)}/admin/fees/withdraw`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to withdraw admin fees");
    }
    
    return result;
  } catch (error: any) {
    console.error("Error withdrawing admin fees:", error);
    return {
      success: false,
      message: error.message || "Failed to withdraw admin fees"
    };
  }
};
