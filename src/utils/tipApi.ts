import { toast } from 'sonner';

export interface TipRequest {
  postCode: string;
  asset: 'roar' | 'eth';
  amount: number;
}

export interface TipResponse {
  success: boolean;
  message: string;
  tipId?: number;
  transaction?: {
    sender: number;
    receiver: number;
    amount: number;
    asset: string;
    usdValue?: number;
    txnHash?: string;
  };
}

export interface TipLimits {
  maxPerTransaction: number;
  maxPerDay: number;
  currentDailyUsage: number;
  remainingDailyLimit: number;
  currentTipCount: number;
  userROARBalance: number;
}

export interface TipLimitsResponse {
  success: boolean;
  limits: TipLimits;
}

export interface TipHistoryItem {
  id: number;
  asset_type: 'roar' | 'eth';
  amount: string;
  usd_value: number | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  sender_handle: string;
  receiver_handle: string;
}

export interface TipHistoryResponse {
  success: boolean;
  postCode: string;
  tips: TipHistoryItem[];
  summary: {
    totalTips: number;
    totalROAR: number;
    totalETH: number;
    totalUSD: number;
    roarTipsCount: number;
    ethTipsCount: number;
  };
}

/**
 * Send a tip to a post creator
 */
export const sendTip = async (tipData: TipRequest): Promise<TipResponse> => {
  try {
    const response = await fetch('/api/tip', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tipData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send tip');
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send tip';
    toast.error(message);
    throw error;
  }
};

/**
 * Get user's tipping limits and current usage
 */
export const getTipLimits = async (): Promise<TipLimitsResponse> => {
  try {
    const response = await fetch('/api/tip/limits', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get tip limits');
    }

    return data;
  } catch (error) {
    console.error('Error getting tip limits:', error);
    throw error;
  }
};

/**
 * Get tipping history for a specific post
 */
export const getTipHistory = async (postCode: string): Promise<TipHistoryResponse> => {
  try {
    const response = await fetch(`/api/tip/history/${postCode}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get tip history');
    }

    return data;
  } catch (error) {
    console.error('Error getting tip history:', error);
    throw error;
  }
};

/**
 * Format tip amount for display
 */
export const formatTipAmount = (amount: number, asset: 'roar' | 'eth'): string => {
  if (asset === 'roar') {
    return `${amount.toLocaleString()} 🦁`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Calculate USD value for ROAR tips (approximate)
 * This is a placeholder - you might want to get real ROAR price from an API
 */
export const calculateROARUSDValue = (roarAmount: number): number => {
  // Placeholder conversion rate - replace with real data
  const roarToUsdRate = 0.001; // $0.001 per ROAR
  return roarAmount * roarToUsdRate;
};

/**
 * Validate tip amount
 */
export const validateTipAmount = (
  amount: number,
  asset: 'roar' | 'eth',
  limits?: TipLimits
): { isValid: boolean; error?: string } => {
  if (!amount || amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (asset === 'roar' && limits) {
    if (amount > limits.userROARBalance) {
      return { 
        isValid: false, 
        error: `Insufficient ROAR balance. You have ${limits.userROARBalance.toLocaleString()} ROAR` 
      };
    }

    if (amount > limits.maxPerTransaction) {
      return { 
        isValid: false, 
        error: `Maximum ${limits.maxPerTransaction.toLocaleString()} ROAR per tip` 
      };
    }

    if (amount > limits.remainingDailyLimit) {
      return { 
        isValid: false, 
        error: `Daily limit exceeded. You can tip ${limits.remainingDailyLimit.toLocaleString()} more ROAR today` 
      };
    }
  }

  // ETH validation (basic)
  if (asset === 'eth') {
    if (amount > 100) {
      return { isValid: false, error: 'Maximum $100 per ETH tip' };
    }
  }

  return { isValid: true };
}; 