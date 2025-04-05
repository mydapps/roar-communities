import { toast } from 'sonner';
import { API_BASE_URL, getUserApiKey, createAuthHeaders } from './apiBase';

/**
 * Interface for comment reply data
 */
export interface CommentReply {
  id: number;
  uid: number;
  handle: string;
  avatar_url: string;
  content: string;
  created_on: string;
  time_ago: string;
  upvotes: number;
  meow_count: number;
  has_meowed: boolean;
  sub_replies?: CommentReply[];
}

/**
 * Fetch replies for a post
 */
export const fetchReplies = async (postCode: string, limit = 10): Promise<{
  success: boolean;
  replies: CommentReply[];
  total_count: number;
}> => {
  try {
    const userKey = getUserApiKey();
    
    if (!userKey) {
      return { success: false, replies: [], total_count: 0 };
    }
    
    console.log(`Fetching replies for post: ${postCode}, limit: ${limit}`);
    
    // Use the correct API endpoint and parameter name
    const response = await fetch(`${API_BASE_URL}/get_replies?postCode=${postCode}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
      },
    });
    
    console.log(`Replies API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to fetch replies: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.replies?.length || 0} replies`);
    
    return {
      success: true,
      replies: data.replies || [],
      total_count: data.total_count || 0
    };
  } catch (error) {
    console.error('Error fetching replies:', error);
    toast.error('Failed to load comments. Please try again.');
    return { success: false, replies: [], total_count: 0 };
  }
};

/**
 * Create a reply to a post or another reply
 */
export const createReply = async (postCode: string, content: string, parentId = 0): Promise<{
  success: boolean;
  reply_id?: number;
  handle?: string;
  avatar_url?: string;
  created_on?: string;
}> => {
  try {
    const userKey = getUserApiKey();
    
    if (!userKey) {
      toast.error('Authentication required. Please log in again.');
      return { success: false };
    }
    
    // Get user handle and avatar from localStorage
    const userHandle = localStorage.getItem('dapps_user_handle');
    const userAvatar = localStorage.getItem('dapps_user_avatar');
    
    console.log(`Creating reply to post ${postCode}, parent ${parentId}, content: ${content}`);
    
    const response = await fetch(`${API_BASE_URL}/create_reply`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        postCode,
        content,
        parentId
      })
    });
    
    console.log(`Create reply API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to create reply: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Create reply API response:', data);
    
    if (data.success) {
      return {
        success: true,
        reply_id: data.reply_id || data.id,
        handle: data.handle || userHandle || 'you',
        avatar_url: data.avatar_url || userAvatar || 'default',
        created_on: data.created_on
      };
    } else {
      console.error('API returned success: false', data);
      return { success: false };
    }
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

/**
 * Toggle "meow" (like) status for a comment
 */
export const toggleMeow = async (commentId: number): Promise<{
  success: boolean;
  message?: string;
  action?: string;
  meow_count?: number;
}> => {
  try {
    const userKey = getUserApiKey();
    
    if (!userKey) {
      toast.error('Authentication required. Please log in again.');
      return { success: false, message: 'Not authenticated' };
    }
    
    console.log(`Toggling meow for comment: ${commentId}`);
    
    const response = await fetch(`${API_BASE_URL}/meow_reply`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        replyId: commentId
      })
    });
    
    console.log(`Toggle meow API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed response body: ${errorText}`);
      throw new Error(`Failed to toggle meow: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Toggle meow API response:', data);
    
    return {
      success: data.success === true,
      message: data.message,
      action: data.action,
      meow_count: data.meow_count
    };
  } catch (error) {
    console.error('Error toggling meow:', error);
    return { success: false, message: 'An error occurred' };
  }
};
