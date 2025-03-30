
import { toast } from 'sonner';

// Base API URL
const API_BASE_URL = 'https://api.dapps.co';

export type CommentReply = {
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

export interface RepliesResponse {
  success: boolean;
  post_code: string;
  community: string;
  total_count: number;
  displayed_count: number;
  replies: CommentReply[];
}

export interface MeowResponse {
  success: boolean;
  message: string;
  action: string;
  reply_id: number;
  meow_count: number;
}

export interface CreateReplyResponse {
  success: boolean;
  message: string;
  reply_id: number;
  post_code: string;
  parent_id: number;
  created_on: string;
  handle: string;
  avatar_url: string;
}

/**
 * Fetch replies for a post
 */
export const fetchReplies = async (postCode: string, limit: number = 10): Promise<RepliesResponse> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found for fetching replies');
      throw new Error('Authentication required');
    }
    
    console.log(`Fetching replies for post ${postCode} with limit ${limit}`);
    const response = await fetch(`${API_BASE_URL}/get_replies?postCode=${postCode}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'x-user-key': userKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch replies: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Reply data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching replies:', error);
    toast.error('Could not load comments. Please try again later.');
    return {
      success: false,
      post_code: postCode,
      community: '',
      total_count: 0,
      displayed_count: 0,
      replies: []
    };
  }
};

/**
 * Toggle meow for a reply
 */
export const toggleMeow = async (replyId: number): Promise<MeowResponse> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found for meowing');
      throw new Error('Authentication required');
    }
    
    // Validate reply ID is a valid number
    if (!replyId || isNaN(replyId) || replyId <= 0) {
      console.error(`Invalid reply ID for meow: ${replyId}`);
      throw new Error('Invalid reply ID');
    }
    
    console.log(`Sending meow toggle request for reply ID: ${replyId}`);
    
    const response = await fetch(`${API_BASE_URL}/meow_reply`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ replyId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Meow API error (${response.status}):`, errorText);
      throw new Error(`Failed to toggle meow: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Meow toggle API response:', data);
    return data;
  } catch (error) {
    console.error('Error toggling meow:', error);
    toast.error('Could not update meow. Please try again later.');
    return {
      success: false,
      message: 'Failed to update meow',
      action: 'error',
      reply_id: replyId,
      meow_count: 0
    };
  }
};

/**
 * Create a new reply for a post
 */
export const createReply = async (postCode: string, content: string, parentId: number = 0): Promise<CreateReplyResponse> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      console.error('No user key found for creating reply');
      throw new Error('Authentication required');
    }
    
    const payload: Record<string, any> = {
      postCode,
      content
    };
    
    if (parentId !== undefined && parentId !== null && parentId !== 0) {
      payload.parentId = parentId;
    }
    
    console.log('Creating reply with payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/create_reply`, {
      method: 'POST',
      headers: {
        'x-user-key': userKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to create reply: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Reply created:', data);
    
    // Validate that we received a valid reply_id
    if (!data.success || !data.reply_id || isNaN(data.reply_id) || data.reply_id <= 0) {
      console.error('API returned success but no valid reply_id:', data);
      throw new Error('API returned invalid reply ID');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating reply:', error);
    toast.error('Could not post your comment. Please try again later.');
    return {
      success: false,
      message: 'Failed to create reply',
      reply_id: 0,
      post_code: postCode,
      parent_id: parentId || 0,
      created_on: new Date().toISOString(),
      handle: '',
      avatar_url: ''
    };
  }
};
