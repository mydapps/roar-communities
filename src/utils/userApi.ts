import { createAuthHeaders } from './apiBase';
import { PollData } from './postApi';

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
  about?: string;
  dob?: string;
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
    
    const response = await fetch(`/api/user/${handle}`, {
      method: 'GET',
      headers,
      credentials: 'include'
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
    
    const response = await fetch(`/api/follow/${handle}`, {
      method: 'POST',
      headers,
      credentials: 'include'
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
  about?: string;
  dob?: string;
  avatar_code?: string;
}

export const updateUserProfile = async (
  params: UpdateProfileParams
): Promise<{ success: boolean, user: UserProfile }> => {
  try {
    const headers = createAuthHeaders();
    
    const response = await fetch(`/api/update_user_details`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      credentials: 'include'
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

/**
 * Update user avatar
 */
export const updateUserAvatar = async (
  avatarCode: string
): Promise<{ success: boolean, message?: string, avatar_url?: string }> => {
  try {
    const headers = createAuthHeaders();
    
    const response = await fetch(`/api/update_avatar`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ avatarCode }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update avatar: ${response.status}`);
    }

    const data = await response.json();
    
    // Update localStorage with new avatar code
    if (data.success) {
      localStorage.setItem('dapps_user_avatar', avatarCode);
    }

    return data;
  } catch (error) {
    console.error('Error updating avatar:', error);
    throw error;
  }
};

/**
 * Fetch posts from a specific user 
 */
export interface UserPost {
  id: number;
  code: string;
  community: string | null;
  title: string;
  body: string;
  body_preview: string;
  body_shrunk: number;
  upvotes: number;
  comments: number;
  created_at: string;
  time_ago: string;
  author: {
    id: number;
    handle: string;
    avatar: string;
  };
  handle: string;
  avatar: string;
  timeAgo: string;
  roar: number;
  has_upvoted: boolean;
  image: number;
  image_url: string;
  multiple_images: number;
  images: string[];
  has_video: number;
  // Mirror-related fields
  is_mirror: number;
  mirror_quote?: string;
  original_post_code?: string;
  original_community?: string;
  original_title?: string;
  original_body?: string;
  original_author?: string;
  original_author_avatar?: string;
  original_created_on?: string;
  original_image?: number;
  original_image_url?: string;
  original_multiple_images?: number;
  original_images?: string[];
  original_has_video?: number;
  // Poll-related fields
  is_poll?: boolean;
  poll_data?: PollData | null;
}

export interface UserPostsResponse {
  success: boolean;
  posts: UserPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export const getUserPosts = async (
  handle: string,
  page: number = 1,
  limit: number = 10
): Promise<UserPostsResponse> => {
  try {
    const headers = createAuthHeaders();
    
    const response = await fetch(`/api/user/${handle}/posts?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch user posts: ${response.status}`);
    }

    const data = await response.json();
    
    // Process the response to ensure mirror-related fields are properly formatted
    // AND to map poll data if available
    if (data.success && data.posts) {
      data.posts = data.posts.map((post: any) => {
        return {
          ...post,
          // Ensure type consistency by converting numeric flags to numbers if they're boolean
          is_mirror: typeof post.is_mirror === 'boolean' ? (post.is_mirror ? 1 : 0) : post.is_mirror,
          image: typeof post.image === 'boolean' ? (post.image ? 1 : 0) : post.image,
          multiple_images: typeof post.multiple_images === 'boolean' ? (post.multiple_images ? 1 : 0) : post.multiple_images,
          has_video: typeof post.has_video === 'boolean' ? (post.has_video ? 1 : 0) : post.has_video,
          original_image: typeof post.original_image === 'boolean' ? (post.original_image ? 1 : 0) : post.original_image,
          original_multiple_images: typeof post.original_multiple_images === 'boolean' ? (post.original_multiple_images ? 1 : 0) : post.original_multiple_images,
          original_has_video: typeof post.original_has_video === 'boolean' ? (post.original_has_video ? 1 : 0) : post.original_has_video,
          
          // Explicitly map poll data
          is_poll: post.is_poll || post.isPoll || false, // Check for is_poll or isPoll, default to false
          poll_data: post.poll_data || post.pollData || null // Check for poll_data or pollData, default to null
        };
      });
    }

    return data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

/**
 * Fetch replies from a specific user 
 */
export interface UserReplyPost {
  id: number;
  code: string;
  community: string | null;
  title: string;
  body: string;
  body_shrunk: number;
  upvotes: number;
  comments: number;
  created_at: string;
  time_ago: string;
  author: {
    id: number;
    handle: string;
    avatar: string;
  };
  image: number;
  image_url: string;
  multiple_images: number;
  images: string[];
  has_video: number;
}

export interface UserReply {
  id: number;
  post_code: string;
  content: string;
  created_at: string;
  time_ago: string;
  upvotes: number;
  meow_count: number;
  author?: {
    id: number;
    handle: string;
    avatar: string;
  };
}

export interface UserReplyData {
  post: UserReplyPost;
  reply: UserReply;
}

export interface UserRepliesResponse {
  success: boolean;
  data: UserReplyData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export const getUserReplies = async (
  handle: string,
  page: number = 1,
  limit: number = 10
): Promise<UserRepliesResponse> => {
  try {
    const headers = createAuthHeaders();
    
    console.log(`Fetching replies for ${handle}, page ${page}, limit ${limit}`);
    
    const response = await fetch(`/api/user/${handle}/replies?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch user replies: ${response.status}`);
    }

    const result = await response.json();
    console.log('API raw response:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching user replies:', error);
    throw error;
  }
}; 

export interface FollowUser {
    id: number;
    handle: string;
    avatar_url: string;
    name: string;
    follows_back: boolean;
}

export interface PaginatedFollowResponse {
    success: boolean;
    data: FollowUser[];
    pagination: {
        currentPage: number;
        totalPages: number;
        perPage: number;
        totalResults: number;
    };
    message?: string;
}

export const getFollowers = async (handle: string, page = 1, limit = 20): Promise<PaginatedFollowResponse> => {
    try {
        const headers = createAuthHeaders();
        const response = await fetch(`/api/${handle}/followers?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers,
            credentials: 'include',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch followers');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching followers:', error);
        throw error;
    }
};

export const getFollowing = async (handle: string, page = 1, limit = 20): Promise<PaginatedFollowResponse> => {
    try {
        const headers = createAuthHeaders();
        const response = await fetch(`/api/${handle}/following?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers,
            credentials: 'include',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch following');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching following:', error);
        throw error;
    }
}; 