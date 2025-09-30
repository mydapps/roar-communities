import { createAuthHeaders } from './apiBase';

// Types for Missing Tokens API
export interface TokenChange {
  ticker: string;
  tokenName: string;
  tokenAddress: string;
  action: 'added' | 'updated';
  oldBalance: number;
  newBalance: number;
  blockchainBalance: number;
}

export interface TokenDiscrepancy {
  ticker: string;
  tokenName: string;
  tokenAddress: string;
  databaseBalance: number;
  blockchainBalance: number;
  difference: number;
  actionNeeded: 'add' | 'update' | 'update_to_zero';
}

export interface SyncSummary {
  tokensChecked: number;
  tokensAdded: number;
  tokensUpdated: number;
  tokensUnchanged: number;
  errors: number;
}

export interface CheckSummary {
  tokensChecked: number;
  discrepanciesFound: number;
  errorsEncountered: number;
}

export interface SyncTokensResponse {
  success: boolean;
  message: string;
  data?: {
    userId: number;
    walletAddress: string;
    processingTimeMs: number;
    summary: SyncSummary;
    changes: TokenChange[];
    errors: any[];
  };
  error?: string;
}

export interface CheckTokensResponse {
  success: boolean;
  message: string;
  data?: {
    userId: number;
    walletAddress: string;
    processingTimeMs: number;
    summary: CheckSummary;
    discrepancies: TokenDiscrepancy[];
    errors: any[];
  };
  error?: string;
}

/**
 * Check for missing tokens without making changes (dry run)
 */
export const checkMissingTokens = async (): Promise<CheckTokensResponse> => {
  try {
    const response = await fetch('/api/missing_tokens/check', {
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
    console.error('Error checking missing tokens:', error);
    return {
      success: false,
      message: 'Failed to check for missing tokens',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Sync missing tokens (actually update the database)
 */
export const syncMissingTokens = async (): Promise<SyncTokensResponse> => {
  try {
    const response = await fetch('/api/missing_tokens', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(false),
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error syncing missing tokens:', error);
    return {
      success: false,
      message: 'Failed to sync missing tokens',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

