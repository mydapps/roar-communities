
import { toast } from 'sonner';

// Base API URL
const API_BASE_URL = 'https://api.dapps.co';

export interface PostAuthor {
  id: number;
  handle: string;
  avatar: string;
}

export interface Reply {
  id: number;
  user_id: number;
  handle: string;
  avatar: string;
  content: string;
  created_at: string;
  time_ago: string;
  upvotes: number;
  has_meowed: boolean;
  meow_count: number;
  replies?: Reply[];
}

export interface OriginalPost {
  code: string;
  community: string;
  title: string;
  body: string;
  author: string;
  author_avatar: string;
  created_at: string;
  time_ago: string;
  media: {
    image: number;
    image_url: string;
    multiple_images: number;
    images: string[];
    has_video: number;
  };
}

export interface PostDetails {
  id: number;
  code: string;
  title: string;
  body: string;
  upvotes: number;
  community: string | null;
  created_at: string;
  time_ago: string;
  ipfs: string;
  author: PostAuthor;
  has_upvoted: boolean;
  featured_image?: string;
  images?: string[];
  is_encrypted: boolean;
  is_mirror: number;
  original_post_code?: string;
  original_community?: string;
  original_title?: string;
  original_body?: string;
  original_author?: string;
  original_author_avatar?: string;
  original_created_on?: string;
  original_images?: string[];
  handle?: string;
  avatar?: string;
  timeAgo?: string;
  can_interact: boolean | number;
  pinned: boolean | number;
  multiple_images?: number;
  mirror_quote?: string;
}

export interface PostResponse {
  success: boolean;
  post: PostDetails;
  replies: Reply[];
  reply_count: number;
  original_post?: OriginalPost;
}

/**
 * Fetch a post by its code
 */
export const fetchPost = async (postCode: string): Promise<PostResponse> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (userKey) {
      headers['x-user-key'] = userKey;
    }
    
    const response = await fetch(`${API_BASE_URL}/get_post?code=${postCode}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch post');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching post:', error);
    toast.error('Could not load the post. Please try again later.');
    throw error;
  }
};

/**
 * Create a reply to a post or another reply
 */
export const createReply = async (
  postCode: string,
  content: string,
  parentId: number = 0
): Promise<any> => {
  try {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      toast.error('You need to be logged in to comment');
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/create_reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-key': userKey
      },
      body: JSON.stringify({
        postCode,
        content,
        parentId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create reply: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create reply');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating reply:', error);
    toast.error('Could not post your reply. Please try again later.');
    throw error;
  }
};
