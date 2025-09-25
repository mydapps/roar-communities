import { createAuthHeaders } from './api';
import { toast } from 'sonner';

// DAO Proposal interfaces based on API documentation
export interface DaoProposal {
  id: number;
  ticker: string;
  title: string;
  purpose: string;
  quantity: string;
  currency: 'eth' | 'tokens';
  to_address: string;
  voting_period_days: string;
  created_on: string;
  voting_ends_on: string;
  proposal_status: 'active' | 'passed' | 'failed' | 'expired' | 'cancelled';
  votes_for: number;
  votes_against: number;
  total_voters: number;
  total_eligible_votes: number;
  proposer_handle: string;
  turnout_percentage: number;
  seconds_remaining: number;
  sending_status?: string | null;
}

export interface CreateProposalRequest {
  ticker: string;
  title: string;
  purpose: string;
  to_address: string;
  quantity: string;
  currency?: 'eth' | 'tokens';
  voting_period_days?: '3' | '7' | '14';
}

export interface CreateProposalResponse {
  success: boolean;
  message: string;
  data?: {
    proposal_id: number;
    post_code: string;
    voting_ends_on: string;
    total_eligible_votes: number;
  };
  error?: string;
}

export interface ListProposalsResponse {
  success: boolean;
  data: {
    proposals: DaoProposal[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  };
}

export interface VoteRequest {
  proposal_id: number;
  vote_choice: 'for' | 'against' | 'abstain';
  vote_reason?: string;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  data?: {
    vote_choice: string;
    voting_power: number;
    proposal_id: number;
  };
  error?: string;
}

/**
 * Create a new DAO proposal
 */
export const createDaoProposal = async (proposalData: CreateProposalRequest): Promise<CreateProposalResponse> => {
  try {
    const response = await fetch('/api/dao/create_proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(false),
      },
      credentials: 'include',
      body: JSON.stringify(proposalData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || `HTTP ${response.status}`,
        error: result.error
      };
    }

    return result;
  } catch (error) {
    console.error('Error creating DAO proposal:', error);
    return {
      success: false,
      message: 'Failed to create proposal',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get list of DAO proposals for a community
 */
export const listDaoProposals = async (
  ticker: string,
  status: string = 'all',
  limit: number = 20,
  offset: number = 0
): Promise<ListProposalsResponse> => {
  try {
    const params = new URLSearchParams({
      ticker,
      status,
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await fetch(`/api/dao/proposals?${params}`, {
      method: 'GET',
      headers: createAuthHeaders(false),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching DAO proposals:', error);
    throw error;
  }
};

/**
 * Cast a vote on a DAO proposal
 */
export const castDaoVote = async (voteData: VoteRequest): Promise<VoteResponse> => {
  try {
    const response = await fetch('/api/dao/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(false),
      },
      credentials: 'include',
      body: JSON.stringify(voteData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || `HTTP ${response.status}`,
        error: result.error
      };
    }
    return result;
  } catch (error) {
    console.error('Error casting DAO vote:', error);
    return {
      success: false,
      message: 'Failed to cast vote',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Format proposal status for display
 */
export const getProposalStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return { text: 'Active', variant: 'default' as const, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'passed':
      return { text: 'Passed', variant: 'default' as const, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'failed':
      return { text: 'Failed', variant: 'destructive' as const, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    case 'expired':
      return { text: 'Expired', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' };
    case 'cancelled':
      return { text: 'Cancelled', variant: 'destructive' as const, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    default:
      return { text: 'Unknown', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' };
  }
};

/**
 * Format currency amount for display
 */
export const formatProposalAmount = (quantity: string, currency: string, ticker?: string) => {
  const amount = parseFloat(quantity);
  if (currency === 'eth') {
    return `${amount} ETH`;
  } else {
    return `${amount.toLocaleString()} ${ticker || 'tokens'}`;
  }
};

/**
 * Format time remaining for active proposals
 */
export const formatTimeRemaining = (secondsRemaining: number) => {
  if (secondsRemaining <= 0) return 'Voting ended';
  
  const days = Math.floor(secondsRemaining / (24 * 60 * 60));
  const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};

/**
 * Validate Ethereum address format
 */
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Truncate Ethereum address for display
 */
export const truncateAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
