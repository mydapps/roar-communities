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
        communities: (rawData.data?.communities || []).map((item: any) => ({
          community: item.community,
          shares: item.shares,
          description: item.description,
          image: item.image,
          currentPrice: item.currentPrice || item.price,
          price: item.price,
          percentageChange: item.percentageChange || (item.price_change_percentage?.toString() || "0"),
          price_change_percentage: item.price_change_percentage || parseFloat(item.percentageChange || "0"),
          price_direction: item.price_direction || (parseFloat(item.percentageChange || "0") >= 0 ? 'up' : 'down'),
          value: item.value
        })),
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
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        communityName,
        amount,
        toAddress
      })
    });
    
    console.log(`Transfer shares response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Transfer shares failed with status ${response.status}: ${errorText}`);
      
      try {
        // Try to parse error as JSON
        const errorJson = JSON.parse(errorText);
        return {
          success: false,
          message: errorJson.message || `Error: ${response.status}`,
          error: errorJson.message
        };
      } catch {
        // If not JSON, return the error text
        return {
          success: false,
          message: errorText || `Error: ${response.status}`,
          error: errorText
        };
      }
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
