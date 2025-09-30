import { createAuthHeaders } from './apiBase';

// Types for Referral API
export interface ReferralSignupRequest {
  referral_code?: string;
}

export interface ReferralSignupResponse {
  success: boolean;
  message: string;
  data?: {
    countdown_expires_at: string;
    countdown_duration_hours: number;
    ab_test_group: string;
    has_referrer: boolean;
    referrer_code?: string;
  };
}

export interface RewardTier {
  eligible: boolean;
  claimed: boolean;
  progress: string;
}

export interface ReferralStatusResponse {
  success: boolean;
  data?: {
    user_progress: {
      countdown_active: boolean;
      countdown_expires_at: string;
      countdown_seconds_remaining: number;
      countdown_duration_hours: number;
      ab_test_group: string;
      first_trade_completed: boolean;
      first_trade_timestamp: string | null;
      total_trades: number;
      trades_this_week: number;
      trades_this_month: number;
      campaign_status: string;
      next_milestone: string;
    };
    referrer_info?: {
      referrer_id: number;
      referrer_handle: string;
    };
    rewards: {
      tier1: RewardTier;
      tier2: RewardTier;
      tier3: RewardTier;
    };
    pending_reward_boxes: any[];
  };
}

export interface TrackTradeRequest {
  trade_type: string;
  ticker: string;
  amount: string;
  eth_value: string;
  transaction_hash: string;
}

export interface RewardToken {
  ticker: string;
  amount: string;
}

export interface RewardBox {
  tier: string;
  tokens: RewardToken[];
}

export interface ClaimRewardResponse {
  success: boolean;
  message: string;
  data?: {
    reward_box: RewardBox;
    distribution: {
      transaction_hash: string;
      status: string;
      gas_sponsored: boolean;
    };
  };
  error?: string;
}

/**
 * Initialize referral tracking for new user signup
 */
export const initializeReferralTracking = async (referralCode?: string): Promise<ReferralSignupResponse> => {
  try {
    const response = await fetch('/api/referral/signup_tracking', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(false),
      },
      body: JSON.stringify({
        referral_code: referralCode
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error initializing referral tracking:', error);
    return {
      success: false,
      message: 'Failed to initialize referral tracking',
    };
  }
};


/**
 * Get user's current referral reward status and progress
 */
export const getReferralStatus = async (): Promise<ReferralStatusResponse> => {
  try {
    const response = await fetch('/api/referral/status', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      // If user doesn't have referral tracking (404), try to initialize it
      if (response.status === 404) {
        console.log('📝 No referral tracking found, initializing...');
        const initResult = await initializeReferralTracking();
        
        if (initResult.success) {
          // Try to get status again after initialization
          const retryResponse = await fetch('/api/referral/status', {
            method: 'GET',
            credentials: 'include',
            headers: createAuthHeaders(false),
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return retryData;
          }
        }
        
        // Return a failed status response if initialization failed
        return {
          success: false
        };
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting referral status:', error);
    return {
      success: false
    };
  }
};

/**
 * Track a completed trade for referral reward calculations
 */
export const trackTrade = async (tradeData: TrackTradeRequest): Promise<any> => {
  try {
    const response = await fetch('/api/referral/track_trade', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(false),
      },
      body: JSON.stringify(tradeData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error tracking trade:', error);
    return {
      success: false,
      message: 'Failed to track trade',
    };
  }
};

/**
 * Claim reward box by tier
 */
export const claimReward = async (tier: string): Promise<ClaimRewardResponse> => {
  try {
    const response = await fetch('/api/referral/claim_reward', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(false),
      },
      body: JSON.stringify({ tier })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error claiming reward:', error);
    return {
      success: false,
      message: 'Failed to claim reward',
    };
  }
};

/**
 * Claim referrer reward box by box ID
 */
export const claimReferrerReward = async (boxId: number): Promise<ClaimRewardResponse> => {
  try {
    const response = await fetch('/api/referral/claim_referrer_reward', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(false),
      },
      body: JSON.stringify({ box_id: boxId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error claiming referrer reward:', error);
    return {
      success: false,
      message: 'Failed to claim referrer reward',
    };
  }
};

/**
 * Get referrer rewards and statistics
 */
export interface ReferrerRewardsResponse {
  success: boolean;
  data?: {
    box_statistics: {
      total_boxes: number;
      available_boxes: number;
      opened_boxes: number;
    };
    available_boxes: Array<{
      box_id: number;
      tier: string;
      tokens: RewardToken[];
      created_at: string;
    }>;
    total_boxes: number;
  };
}

// Combined interface for display purposes
export interface ReferralDashboardData {
  referral_statistics: {
    total_referrals: number;
    successful_referrals: number;
    conversion_rate: number;
    rewards_earned: number;
  };
  reward_boxes: Array<{
    box_id: number;
    tier: string;
    status: string;
    tokens: RewardToken[];
    created_at: string;
  }>;
}

export interface ReferredUser {
  id: number;
  handle: string;
  avatar_url: string | null;
  signup_date: string;
  first_trade_completed: boolean;
  first_trade_date: string | null;
  total_trades: number;
  rewards_status: {
    tier1_claimed: boolean;
    tier2_claimed: boolean;
    tier3_claimed: boolean;
  };
}

export interface ReferredUsersResponse {
  success: boolean;
  data?: {
    referred_users: ReferredUser[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
      has_next_page: boolean;
      has_prev_page: boolean;
    };
  };
}

export const getReferrerRewards = async (): Promise<ReferrerRewardsResponse> => {
  try {
    const response = await fetch('/api/referral/referrer_boxes', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting referrer rewards:', error);
    return {
      success: false,
    };
  }
};

export const getReferredUsers = async (page: number = 1, limit: number = 10): Promise<ReferredUsersResponse> => {
  try {
    const response = await fetch(`/api/referral/referred_users?page=${page}&limit=${limit}`, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(false),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting referred users:', error);
    return {
      success: false,
    };
  }
};

/**
 * Mock data for testing without API
 */
export const getMockReferralStatus = (): ReferralStatusResponse => {
  return {
    success: true,
    data: {
      user_progress: {
        countdown_active: true,
        countdown_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        countdown_seconds_remaining: 7200,
        countdown_duration_hours: 24,
        ab_test_group: "group_b",
        first_trade_completed: false,
        first_trade_timestamp: null,
        total_trades: 0,
        trades_this_week: 0,
        trades_this_month: 0,
        campaign_status: "countdown_active",
        next_milestone: "Complete 1 trade to unlock Tier 1 reward"
      },
      rewards: {
        tier1: {
          eligible: false,
          claimed: false,
          progress: "Pending first trade"
        },
        tier2: {
          eligible: false,
          claimed: false,
          progress: "0/5 trades this week"
        },
        tier3: {
          eligible: false,
          claimed: false,
          progress: "0/15 trades this month"
        }
      },
      pending_reward_boxes: []
    }
  };
};

/**
 * Mock data for testing reward claiming
 */
export const getMockClaimReward = (tier: string): ClaimRewardResponse => {
  const tierTokens = {
    tier1: [
      { ticker: "BUILD", amount: "45.67" },
      { ticker: "ROAR", amount: "23.45" },
      { ticker: "FIRST", amount: "12.34" }
    ],
    tier2: [
      { ticker: "BUILD", amount: "125.50" },
      { ticker: "ROAR", amount: "87.25" },
      { ticker: "ALPHA", amount: "45.75" }
    ],
    tier3: [
      { ticker: "BUILD", amount: "350.00" },
      { ticker: "ROAR", amount: "200.00" },
      { ticker: "DIAMOND", amount: "100.00" }
    ]
  };

  return {
    success: true,
    message: "Reward box claimed and tokens distributed successfully",
    data: {
      reward_box: {
        tier,
        tokens: tierTokens[tier as keyof typeof tierTokens] || tierTokens.tier1
      },
      distribution: {
        transaction_hash: "0x" + Math.random().toString(16).substr(2, 40),
        status: "completed",
        gas_sponsored: true
      }
    }
  };
};