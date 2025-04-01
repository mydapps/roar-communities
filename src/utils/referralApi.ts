
import { toast } from 'sonner';
import { createAuthHeaders } from './apiBase';

/**
 * Fetch the user's referral earnings
 * @returns Promise with the earnings data
 */
export const fetchReferralEarnings = async () => {
  try {
    const response = await fetch('https://api.dapps.co/referral_earnings', {
      headers: createAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching referral earnings: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch referral earnings');
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchReferralEarnings:', error);
    toast.error('Failed to load referral earnings. Please try again later.');
    return {
      success: false,
      wallet: '',
      referral_earnings: 0,
      address_balance: 0,
      total_withdrawn: 0,
      available_to_withdraw: 0
    };
  }
};

/**
 * Fetch the list of users invited by the current user
 * @param page Page number for pagination
 * @param limit Number of items per page
 * @returns Promise with the invited users data
 */
export const fetchInvitedUsers = async (page = 1, limit = 20) => {
  try {
    const response = await fetch(`https://api.dapps.co/invited_users?page=${page}&limit=${limit}`, {
      headers: createAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching invited users: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch invited users');
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchInvitedUsers:', error);
    toast.error('Failed to load invited users. Please try again later.');
    return { success: false, invited_users: [], total: 0, page: 1, limit, total_pages: 1 };
  }
};

/**
 * Claim available referral rewards
 * @returns Promise with the claim result
 */
export const claimReferralRewards = async () => {
  try {
    // This API endpoint is hypothetical and would need to be implemented
    const response = await fetch('https://api.dapps.co/claim_referral_rewards', {
      method: 'POST',
      headers: createAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error claiming rewards: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to claim rewards');
    }
    
    return data;
  } catch (error) {
    console.error('Error in claimReferralRewards:', error);
    toast.error('Failed to claim rewards. Please try again later.');
    return { success: false };
  }
};
