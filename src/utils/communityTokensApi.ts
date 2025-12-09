import { createAuthHeaders } from './apiBase';

// Community Token API Types
export interface CreateTokenRequest {
  name: string;
  ticker: string;
  image?: string;
  description?: string;
  rewardPercent?: number;
  initialDepositEth: number;
}

export interface CreateTokenResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    ticker: string;
    name: string;
    communityAdmin: string;
    rewardPool: string;
    flatSaleStartTime: string;
    flatSaleRate: number;
    totalSupply: number;
    maxFlatSaleTokens: number;
    contractAddresses: {
      factory: string;
      flatSaleManager: string;
    };
  };
  error?: string;
}

export interface TickerValidationResponse {
  success: boolean;
  message: string;
  data?: {
    ticker: string;
    isAvailable: boolean;
    isValidFormat: boolean;
    formatRules: {
      allowedCharacters: string;
      maxLength: number;
      minLength: number;
      caseSensitive: boolean;
    };
  };
  error?: string;
}

export interface TokenStatus {
  id: number;
  ticker: string;
  name: string;
  image?: string;
  description?: string;
  communityAdmin: string;
  rewardPool: string;
  tokenAddress?: string;
  hookAddress?: string;
  totalSupply: number;
  holders: number;
  graduated: boolean;
  flatSaleStartTime: string;
  flatSaleEndTime: string;
  flatSaleRate: number;
  maxFlatSaleTokens: number;
  flatSaleTokensSold: number;
  flatEtherCollection: number;
  timeElapsed: number;
  timeRemaining: number;
  isTimeExpired: boolean;
  isEthCapReached: boolean;
  canGraduate: boolean;
  currentRate: number;
  currentPriceEth: number;
  currentPriceUsd: number;
  marketCap: number;
  volume24h: number;
  contractAddresses: {
    factory: string;
    flatSaleManager: string;
  };
  createdOn: string;
}

export interface TokenListResponse {
  success: boolean;
  data?: {
    tokens: Array<{
      id: number;
      ticker: string;
      name: string;
      image?: string;
      description?: string;
      graduated: boolean;
      holders: number;
      flatEtherCollection: number;
      currentRate: number;
      marketCap: number;
      volume24h: number;
      createdOn: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTokens: number;
      limit: number;
    };
  };
  error?: string;
}

export interface QuoteBuyRequest {
  ticker: string;
  ethAmount: number;
}

export interface QuoteBuyResponse {
  success: boolean;
  data?: {
    ticker: string;
    quote: {
      ethAmount: number;
      tokensGross: number;
      feeTokens: number;
      tokensNet: number;
      rate: number;
      feePercentage: number;
    };
    saleStatus: {
      isActive: boolean;
      isTimeExpired: boolean;
      isEthCapReached: boolean;
      isTokenCapReached: boolean;
      timeRemaining: number;
      ethCollected: number;
      tokensRemaining: number;
    };
    caps: {
      maxEthCollection: number;
      maxTokenSale: number;
      ethRemaining: number;
      tokensRemaining: number;
    };
  };
  error?: string;
}

export interface BuyTokenRequest {
  ticker: string;
  ethAmount: number;
}

export interface BuyTokenResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: number;
    ticker: string;
    ethAmount: number;
    tokensReceived: number;
    feeTokens: number;
    txnHash: string;
    shouldGraduate: boolean;
    finalStats: {
      ethCollected: number;
      tokensSold: number;
    };
  };
  error?: string;
}

export interface UserHoldingsResponse {
  success: boolean;
  data?: {
    holdings: Array<{
      ticker: string;
      name: string;
      image?: string;
      balance: number;
      totalInvestedEth: number;
      avgPurchasePrice: number;
      currentRate: number;
      currentValueEth: number;
      profitLossEth: number;
      profitLossPercent: number;
      graduated: boolean;
      tokenAddress?: string;
      firstPurchaseAt: string;
      lastPurchaseAt: string;
    }>;
    portfolio: {
      totalHoldings: number;
      totalInvestedEth: number;
      totalCurrentValueEth: number;
      totalProfitLossEth: number;
      totalProfitLossPercent: number;
    };
  };
  error?: string;
}

// API Functions
export const createCommunityToken = async (data: CreateTokenRequest): Promise<CreateTokenResponse> => {
  try {
    const response = await fetch('/api/community_tokens/create', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Failed to create community token',
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error creating community token:', error);
    return {
      success: false,
      message: 'Failed to create community token',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getTokenStatus = async (ticker: string): Promise<{ success: boolean; data?: TokenStatus; error?: string }> => {
  try {
    const response = await fetch(`/api/community_tokens/status/${ticker}`, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching token status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const listCommunityTokens = async (params?: {
  page?: number;
  limit?: number;
  graduated?: boolean;
  search?: string;
}): Promise<TokenListResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.graduated !== undefined) queryParams.append('graduated', params.graduated.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/api/community_tokens/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error listing community tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getQuoteBuy = async (data: QuoteBuyRequest): Promise<QuoteBuyResponse> => {
  try {
    const response = await fetch('/api/community_tokens/quote_buy', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error getting buy quote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const buyToken = async (data: BuyTokenRequest): Promise<BuyTokenResponse> => {
  try {
    const response = await fetch('/api/community_tokens/buy_flat', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Failed to buy token',
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error buying token:', error);
    return {
      success: false,
      message: 'Failed to buy token',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Quote for selling tokens during flat sale
export interface QuoteSellRequest {
  ticker: string;
  tokenAmount: number;
}

export interface QuoteSellResponse {
  success: boolean;
  data?: {
    ticker: string;
    quote: {
      tokenAmount: number;
      ethGross: number;
      feeEth: number;
      ethNet: number;
      rate: number;
      feePercentage: number;
    };
    saleStatus: {
      isActive: boolean;
      isGraduated: boolean;
    };
  };
  message?: string;
  error?: string;
}

export const getQuoteSell = async (data: QuoteSellRequest): Promise<QuoteSellResponse> => {
  try {
    const response = await fetch('/api/community_tokens/quote_sell', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error getting sell quote:', error);
    return {
      success: false,
      message: 'Failed to get sell quote',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Sell tokens during flat sale
export interface SellTokenRequest {
  ticker: string;
  tokenAmount: number;
}

export interface SellTokenResponse {
  success: boolean;
  data?: {
    transactionId: number;
    ticker: string;
    tokensSold: number;
    ethReceived: number;
    feeEth: number;
    txnHash: string;
    newBalance: number;
    rate: number;
  };
  message?: string;
  error?: string;
}

export const sellToken = async (data: SellTokenRequest): Promise<SellTokenResponse> => {
  try {
    const response = await fetch('/api/community_tokens/sell_flat', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error selling tokens:', error);
    return {
      success: false,
      message: 'Failed to sell tokens',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Validation helpers
export const validateTokenCreation = (data: CreateTokenRequest): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Token name is required';
  } else if (data.name.length > 50) {
    errors.name = 'Token name must be 50 characters or less';
  }

  // Ticker validation
  if (!data.ticker || data.ticker.trim().length === 0) {
    errors.ticker = 'Ticker is required';
  } else if (!/^[A-Z0-9]+$/.test(data.ticker)) {
    errors.ticker = 'Ticker must contain only uppercase letters and numbers';
  } else if (data.ticker.length > 15) {
    errors.ticker = 'Ticker must be 15 characters or less';
  }

  // Initial deposit validation
  if (!data.initialDepositEth || data.initialDepositEth < 0.0001) {
    errors.initialDepositEth = 'Initial deposit must be at least 0.0001 ETH';
  } else if (data.initialDepositEth > 1) {
    errors.initialDepositEth = 'Initial deposit cannot exceed 1 ETH';
  }

  // Reward percent validation
  if (data.rewardPercent !== undefined && (data.rewardPercent < 0 || data.rewardPercent > 50)) {
    errors.rewardPercent = 'Reward percentage must be between 0 and 50';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// User Holdings API Types
export interface UserHolding {
  ticker: string;
  name: string;
  givenName?: string; // Original name as entered by creator
  image?: string;
  description?: string;
  balance: number;
  totalInvestedEth: number;
  avgPurchasePrice: number;
  currentRate: number;
  currentValueEth: number;
  currentValueUsd: number; // Added USD value from API
  profitLossEth: number;
  profitLossPercent: number;
  graduated: boolean;
  tokenAddress?: string;
  hookAddress?: string;
  marketCap: number;
  volume24h: number;
  totalHolders: number;
  firstPurchaseAt: string;
  lastPurchaseAt: string;
  lastUpdated: string;
  tokenCreatedOn: string;
}

export interface UserHoldingsResponse {
  success: boolean;
  data?: {
    holdings: UserHolding[];
    portfolio: {
      totalHoldings: number;
      totalInvestedEth: number;
      totalCurrentValueEth: number;
      totalProfitLossEth: number;
      totalProfitLossPercent: number;
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      totalHoldings: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  error?: string;
}

export interface TransferTokenRequest {
  ticker: string;
  amount: number;
  recipient: string;
  recipientType: 'handle' | 'address';
}

export interface TransferTokenResponse {
  success: boolean;
  message: string;
  data?: {
    ticker: string;
    amount: number;
    recipient: string;
    recipientType: string;
    recipientAddress: string;
    transactionHash: string;
    blockNumber: string;
    gasUsed: string;
  };
  error?: string;
}

// Get user's community token holdings
export const getUserHoldings = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<UserHoldingsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/api/community_tokens/user_holdings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching user holdings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get user balance for a specific token
export interface UserTokenBalanceResponse {
  success: boolean;
  data?: {
    ticker: string;
    balance: number;
  };
  error?: string;
}

export const getUserTokenBalance = async (ticker: string): Promise<UserTokenBalanceResponse> => {
  try {
    const response = await fetch(`/api/community_tokens/user_balance/${ticker}`, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching user token balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Transfer community tokens
export const transferTokens = async (data: TransferTokenRequest): Promise<TransferTokenResponse> => {
  try {
    const response = await fetch('/api/community_tokens/transfer', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error transferring tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Additional API Types for Analytics
export interface RecentTrade {
  trade_type: 'token_creation' | 'flat_buy' | 'flat_sell' | 'amm_buy' | 'amm_sell';
  ticker: string;
  token_name: string;
  token_image?: string;
  user_handle: string;
  eth_amount: number;
  eth_amount_usd: number;
  token_amount: number;
  trade_time: string;
  trade_time_formatted: string;
  tx_hash: string;
  status: string;
  eth_to_usd_rate: number;
}

export interface RecentTradesResponse {
  success: boolean;
  data?: {
    trades: RecentTrade[];
    eth_to_usd_rate: number;
  };
  error?: string;
}

export interface TopGainer {
  ticker: string;
  name: string;
  image?: string;
  graduated: boolean;
  holders: number;
  created_on: string;
  current_rate_eth: number;
  current_rate_usd: number;
  initial_rate_eth: number;
  initial_rate_usd: number;
  market_cap_eth: number;
  market_cap_usd: number;
  volume_24h: number;
  price_change_percent: number;
  eth_to_usd_rate: number;
}

export interface TopGainersResponse {
  success: boolean;
  data?: {
    gainers: TopGainer[];
    period: string;
    eth_to_usd_rate: number;
  };
  error?: string;
}

export interface TokensListItem {
  id: number;
  ticker: string;
  name: string;
  image?: string;
  description?: string;
  graduated: boolean;
  holders: number;
  flatEtherCollection: number;
  currentRate: number;
  currentRateUsd: number;
  marketCap: number;
  marketCapUsd: number;
  volume24h: number;
  createdOn: string;
}

export interface TokensListResponse {
  success: boolean;
  data?: {
    tokens: TokensListItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTokens: number;
      limit: number;
    };
  };
  error?: string;
}

// Get recent trades across all tokens
export const getAllRecentTrades = async (params?: {
  limit?: number;
}): Promise<RecentTradesResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/community_tokens/recent_trades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get top gaining tokens
export const getTopGainers = async (params?: {
  period?: '24h' | '7d';
  limit?: number;
}): Promise<TopGainersResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/community_tokens/top_gainers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching top gainers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get tokens list with graduation countdown
export const getTokensList = async (params?: {
  page?: number;
  limit?: number;
  graduated?: boolean;
  search?: string;
}): Promise<TokensListResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.graduated !== undefined) queryParams.append('graduated', params.graduated.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/api/community_tokens/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching tokens list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Extended token interface for graduation countdown
export interface GraduationTokenItem {
  id: number;
  ticker: string;
  name: string;
  givenName?: string;
  image?: string;
  description?: string;
  graduated: boolean;
  holders: number;
  flatEtherCollection: number;
  currentRate: string;
  currentRateUsd: string;
  marketCap: string;
  marketCapUsd: string;
  volume24h: string;
  recentTrades: number;
  priceChange24h: number;
  priceChange1h: number;
  createdOn: string;
  // Legacy snake_case fields for backward compatibility
  flat_sale_start_time?: string;
  flat_ether_sale_collection?: number;
  total_supply?: number;
  flat_sale_tokens_sold?: number;
  max_flat_sale_tokens?: number;
  flat_sale_rate?: number;
  token_address?: string;
  hook_address?: string;
  created_on?: string;
  current_rate_eth?: number;
  current_rate_usd?: number;
  market_cap_eth?: number;
  market_cap_usd?: number;
  volume_24h?: number;
  graduation_time_remaining_seconds?: number;
  graduation_time_remaining_minutes?: number;
  sale_status?: 'not_started' | 'active' | 'time_expired' | 'eth_cap_reached' | 'token_cap_reached' | 'graduated';
  eth_to_usd_rate?: number;
}

export interface GraduationTokensResponse {
  success: boolean;
  data?: {
    tokens: GraduationTokenItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTokens: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    eth_to_usd_rate: number;
  };
  error?: string;
}

// Get tokens with graduation countdown data
export const getGraduationTokensList = async (params?: {
  page?: number;
  limit?: number;
  graduated?: boolean;
  search?: string;
}): Promise<GraduationTokensResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.graduated !== undefined) queryParams.append('graduated', params.graduated.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/api/community_tokens/tokens_list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching graduation tokens list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Check ticker availability and validation
export const checkTickerAvailability = async (ticker: string): Promise<TickerValidationResponse> => {
  try {
    const headers = await createAuthHeaders();
    const response = await fetch(`/api/community_tokens/check_ticker/${encodeURIComponent(ticker)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking ticker availability:', error);
    return {
      success: false,
      message: 'Failed to check ticker availability',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ===== POST-GRADUATION SWAP API FUNCTIONS =====

// Quote ETH to Token (for graduated tokens)
export interface QuoteEthToTokenRequest {
  ticker: string;
  ethAmount: number;
}

export interface QuoteEthToTokenResponse {
  success: boolean;
  data?: {
    ticker: string;
    quote: {
      ethAmountIn: number;
      estimatedTokensOut: number;
      currentPrice: number;
      priceImpact: number;
      minimumTokensOut: number;
    };
    poolInfo: {
      sqrtPriceX96: string;
      tick: number;
      tokenIsC0: boolean;
      hookAddress: string;
    };
  };
  message?: string;
  error?: string;
}

export const quoteEthToToken = async (data: QuoteEthToTokenRequest): Promise<QuoteEthToTokenResponse> => {
  try {
    const response = await fetch('/api/community_tokens/quote_eth_to_token', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error getting ETH to token quote:', error);
    return {
      success: false,
      message: 'Failed to get quote',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Quote Token to ETH (for graduated tokens)
export interface QuoteTokenToEthRequest {
  ticker: string;
  tokenAmount: number;
}

export interface QuoteTokenToEthResponse {
  success: boolean;
  data?: {
    ticker: string;
    quote: {
      tokenAmountIn: number;
      estimatedEthOut: number;
      currentPrice: number;
      priceImpact: number;
      minimumEthOut: number;
    };
    poolInfo: {
      sqrtPriceX96: string;
      tick: number;
      tokenIsC0: boolean;
      hookAddress: string;
    };
  };
  message?: string;
  error?: string;
}

export const quoteTokenToEth = async (data: QuoteTokenToEthRequest): Promise<QuoteTokenToEthResponse> => {
  try {
    const response = await fetch('/api/community_tokens/quote_token_to_eth', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error getting token to ETH quote:', error);
    return {
      success: false,
      message: 'Failed to get quote',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Execute ETH to Token Swap (for graduated tokens)
export interface SwapEthToTokenRequest {
  ticker: string;
  ethAmount: number;
  slippageTolerance: number; // percentage (e.g., 5 for 5%)
}

export interface SwapEthToTokenResponse {
  success: boolean;
  data?: {
    transactionId: number;
    ticker: string;
    ethAmountIn: number;
    tokensReceived: number;
    transactionHash: string;
    blockNumber: number;
    gasUsed: number;
  };
  message?: string;
  error?: string;
}

export const swapEthToToken = async (data: SwapEthToTokenRequest): Promise<SwapEthToTokenResponse> => {
  try {
    const response = await fetch('/api/community_tokens/swap_eth_to_token', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error executing ETH to token swap:', error);
    return {
      success: false,
      message: 'Failed to execute swap',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Execute Token to ETH Swap (for graduated tokens)
export interface SwapTokenToEthRequest {
  ticker: string;
  tokenAmount: number;
  slippageTolerance: number; // percentage (e.g., 5 for 5%)
}

export interface SwapTokenToEthResponse {
  success: boolean;
  data?: {
    transactionId: number;
    ticker: string;
    tokenAmountIn: number;
    ethReceived: number;
    transactionHash: string;
    blockNumber: number;
    gasUsed: number;
  };
  message?: string;
  error?: string;
}

export const swapTokenToEth = async (data: SwapTokenToEthRequest): Promise<SwapTokenToEthResponse> => {
  try {
    const response = await fetch('/api/community_tokens/swap_token_to_eth', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error executing token to ETH swap:', error);
    return {
      success: false,
      message: 'Failed to execute swap',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Price Change API Types and Functions
export interface PriceChangeResponse {
  success: boolean;
  data?: {
    token_info: {
      ticker: string;
      name: string;
      graduated: number;
    };
    current_time: string;
    current_price: {
      eth: number;
      usd: number;
      snapshot_time: string;
    };
    price_changes: {
      '15m': {
        change_percent_eth: number;
        change_percent_usd: number;
        current_price_eth: number;
        current_price_usd: number;
        historical_price_eth: number | null;
        historical_price_usd: number | null;
        historical_time: string | null;
        note?: string;
      };
      '1h': {
        change_percent_eth: number;
        change_percent_usd: number;
        current_price_eth: number;
        current_price_usd: number;
        historical_price_eth: number | null;
        historical_price_usd: number | null;
        historical_time: string | null;
        note?: string;
      };
      '4h': {
        change_percent_eth: number;
        change_percent_usd: number;
        current_price_eth: number;
        current_price_usd: number;
        historical_price_eth: number | null;
        historical_price_usd: number | null;
        historical_time: string | null;
        note?: string;
      };
      '1d': {
        change_percent_eth: number;
        change_percent_usd: number;
        current_price_eth: number;
        current_price_usd: number;
        historical_price_eth: number | null;
        historical_price_usd: number | null;
        historical_time: string | null;
        note?: string;
      };
    };
  };
  message?: string;
  error?: string;
}

export const getPriceChange = async (ticker: string): Promise<PriceChangeResponse> => {
  try {
    const response = await fetch(`/api/community_tokens/price_change/${ticker}`, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching price change data:', error);
    return {
      success: false,
      message: 'Failed to fetch price change data',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Reward Pool API Types and Functions
export interface RewardPoolResponse {
  success: boolean;
  data?: {
    token: {
      ticker: string;
      name: string;
      image: string;
      graduated: boolean;
    };
    rewardPool: {
      address: string;
      ethBalance: number;
      ethBalanceUsd: number;
      tokenBalance: number;
      tokenPriceEth: number;
      tokenPriceUsd: number;
      tokenValueEth: number;
      tokenValueUsd: number;
      totalValueEth: number;
      totalValueUsd: number;
      ethToUsdRate: number;
    };
  };
  message?: string;
  error?: string;
}

export const getRewardPool = async (ticker: string): Promise<RewardPoolResponse> => {
  try {
    const response = await fetch(`/api/community_tokens/reward_pool/${ticker}`, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching reward pool data:', error);
    return {
      success: false,
      message: 'Failed to fetch reward pool data',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ===== NEW API ENDPOINTS =====

// Platform Stats
export interface PlatformStatsResponse {
  success: boolean;
  data?: {
    totalTokens: number;
    totalHolders: number;
    graduatedTokens: number;
    incubatingTokens: number;
    volume24h: {
      eth: string;
      usd: string;
      flatSale: string;
      uniswap: string;
    };
    totalMarketCap: {
      eth: string;
      usd: string;
    };
    ethToUsdRate: number;
    lastUpdated: string;
  };
  message?: string;
  error?: string;
}

export const getPlatformStats = async (): Promise<PlatformStatsResponse> => {
  try {
    const response = await fetch('/api/community_tokens/platform/stats', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return {
      success: false,
      message: 'Failed to fetch platform stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Incubation Tokens (Last Chance)
export interface IncubationToken {
  id: number;
  ticker: string;
  name: string;
  givenName: string;
  image: string | null;
  description: string;
  holders: number;
  flatEtherCollection: number;
  currentRate: string;
  marketCap: string;
  volume24h: string;
  minutesElapsed: number;
  minutesRemaining: number;
  flatSaleStartTime: string;
  createdOn: string;
}

export interface IncubationTokensResponse {
  success: boolean;
  data?: {
    tokens: IncubationToken[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTokens: number;
      limit: number;
    };
  };
  message?: string;
  error?: string;
}

export const getIncubationTokens = async (params?: {
  page?: number;
  limit?: number;
}): Promise<IncubationTokensResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/community_tokens/incubation${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching incubation tokens:', error);
    return {
      success: false,
      message: 'Failed to fetch incubation tokens',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Trending Tokens
export interface TrendingToken {
  id: number;
  ticker: string;
  name: string;
  givenName: string;
  image: string | null;
  description: string;
  graduated: boolean;
  holders: number;
  flatEtherCollection: number;
  currentRate: string;
  marketCap: string;
  volume24h: string;
  recentTrades: number;
  recentVolume: string;
  createdOn: string;
}

export interface TrendingTokensResponse {
  success: boolean;
  data?: {
    tokens: TrendingToken[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTokens: number;
      limit: number;
    };
    timeframe: string;
  };
  message?: string;
  error?: string;
}

export const getTrendingTokens = async (params?: {
  page?: number;
  limit?: number;
  timeframe?: '1h' | '6h' | '12h' | '24h' | '7d';
}): Promise<TrendingTokensResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.timeframe) queryParams.append('timeframe', params.timeframe);

    const url = `/api/community_tokens/trending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return {
      success: false,
      message: 'Failed to fetch trending tokens',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Enhanced List with Sorting
export type SortByOption = 'holders' | 'newest' | 'hottest' | 'top_gainers_24h' | 'top_gainers_1h' | 'market_cap' | 'volume';

export interface EnhancedListResponse {
  success: boolean;
  data?: {
    tokens: GraduationTokenItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTokens: number;
      limit: number;
    };
    sortBy: string;
  };
  message?: string;
  error?: string;
}

export const getEnhancedTokensList = async (params?: {
  page?: number;
  limit?: number;
  graduated?: boolean;
  search?: string;
  sortBy?: SortByOption;
}): Promise<EnhancedListResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.graduated !== undefined) queryParams.append('graduated', params.graduated.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const url = `/api/community_tokens/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching enhanced tokens list:', error);
    return {
      success: false,
      message: 'Failed to fetch tokens list',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get community name from ticker
export interface CommunityNameResponse {
  success: boolean;
  data?: {
    ticker: string;
    name: string;
    givenName: string;
    communityType: string;
  };
  error?: string;
}

export const getCommunityNameFromTicker = async (ticker: string): Promise<CommunityNameResponse> => {
  try {
    const url = `/api/community_tokens/name/${ticker}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching community name from ticker:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Get volume analysis for buy pressure
export interface VolumeAnalysisResponse {
  success: boolean;
  data?: {
    period: string;
    ticker: string;
    buy_volume_eth: number;
    sell_volume_eth: number;
    total_volume_eth: number;
    buy_volume_usd: number;
    sell_volume_usd: number;
    total_volume_usd: number;
    buy_percentage: number;
    sell_percentage: number;
    buy_count: number;
    sell_count: number;
    total_trades: number;
    eth_to_usd_rate: number;
  };
  error?: string;
}

export const getVolumeAnalysis = async (ticker: string, period: string = '24h'): Promise<VolumeAnalysisResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('period', period);
    queryParams.append('ticker', ticker);

    const url = `/api/community_tokens/volume_analysis?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching volume analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Get recent trades for a token
export interface RecentTradesResponse {
  success: boolean;
  data?: {
    trades: Array<{
      id: number;
      ticker: string;
      user_handle: string;
      user_avatar?: string;
      action: 'buy' | 'sell';
      token_amount: number;
      eth_amount: number;
      usd_amount: number;
      price_per_token: number;
      timestamp: string;
      transaction_hash?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      has_more: boolean;
    };
  };
  error?: string;
}

export const getRecentTrades = async (ticker: string, page: number = 1, limit: number = 20): Promise<RecentTradesResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    const url = `/api/community_tokens/recent_trades/${ticker}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Get price history for charts
export interface PriceHistoryResponse {
  success: boolean;
  data?: {
    token_info: {
      ticker: string;
      name: string;
      graduated: number;
    };
    timeframe: string;
    price_history: Array<{
      time: string;
      open_eth: string;
      high_eth: string;
      low_eth: string;
      close_eth: string;
      open_usd: string;
      high_usd: string;
      low_usd: string;
      close_usd: string;
      volume_eth: string;
      volume_usd: string;
      data_points: number;
    }>;
    data_points: number;
  };
  error?: string;
}

export const getPriceHistory = async (ticker: string, period: string = '24h'): Promise<PriceHistoryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('period', period);

    const url = `/api/community_tokens/price_history/${ticker}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching price history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export interface TokenHoldersResponse {
  success: boolean;
  data?: {
    token: {
      ticker: string;
      name: string;
      image: string;
    };
    holders: Array<{
      rank: number;
      userId: number;
      handle: string;
      avatar: string;
      balance: number;
      isCreator: boolean;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalHolders: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  error?: string;
}

export const getTokenHolders = async (ticker: string, page: number = 1, limit: number = 10): Promise<TokenHoldersResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    const url = `/api/community_tokens/holders/${ticker}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`
      };
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error fetching token holders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};




