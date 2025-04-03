import { API_BASE_URL, createAuthHeaders } from './apiBase';

// User profile interface
export interface UserCommunity {
  name: string;
  shares: number;
  is_admin: boolean;
  image: string;
}

export interface UserProfile {
  id: number;
  handle: string;
  avatar_url: string;
  followers: number;
  followings: number;
  roar_holdings: number;
  formatted_roar_holdings: string;
  communities: UserCommunity[];
  is_founding_user: boolean;
  post_count: number;
  reply_count: number;
  background_image?: string;
  age?: number;
  location?: string;
  link?: string;
  answer?: string;
  profile_updated_at?: string;
  wallet_address?: string;
  is_following?: boolean;
  is_followed_by?: boolean;
}

export interface UserProfileResponse {
  success: boolean;
  user: UserProfile;
}

/**
 * Get user profile details
 * If authenticated, will include relationship info
 */
export const getUserProfile = async (handle: string): Promise<UserProfileResponse> => {
  try {
    const headers = createAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/user/${handle}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch user profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Follow a user
 */
export const followUser = async (handle: string): Promise<{ success: boolean, message?: string, is_following?: boolean }> => {
  try {
    const headers = createAuthHeaders();
    
    if (!headers['x-user-key']) {
      throw new Error('Authentication required to follow a user');
    }
    
    const response = await fetch(`${API_BASE_URL}/follow/${handle}`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to follow user: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

/**
 * Unfollow a user - uses the same endpoint as follow with a second request to toggle status
 */
export const unfollowUser = async (handle: string): Promise<{ success: boolean, message?: string, is_following?: boolean }> => {
  try {
    // We use the same endpoint for both follow and unfollow, it works as a toggle
    return await followUser(handle);
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export interface UpdateProfileParams {
  background_image?: string;
  age?: number;
  location?: string;
  link?: string;
  answer?: string;
}

export const updateUserProfile = async (
  params: UpdateProfileParams
): Promise<{ success: boolean, user: UserProfile }> => {
  try {
    const headers = createAuthHeaders();
    
    if (!headers['x-user-key']) {
      throw new Error('Authentication required to update profile');
    }
    
    const response = await fetch(`${API_BASE_URL}/user/update`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}; 