import { createAuthHeaders } from './apiBase';

// Types for search responses
export interface SearchUserItem {
  id: number;
  handle: string;
  avatar_url: string;
}

export interface SearchCommunityItem {
  name: string;
  description: string;
  image: string;
  shares: number;
  members_count: number;
  encrypted: boolean;
}

export interface SearchPostItem {
  id: number;
  code: string;
  type: 'post' | 'reply';
  community: string;
  author: {
    handle: string;
    avatar_url: string;
  };
  content: string;
  created_at: string;
  time_ago: string;
  upvotes: number;
  reply_count: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UsersSearchResponse {
  success: boolean;
  users?: {
    items: SearchUserItem[];
    pagination: Pagination;
  };
  error?: string;
}

export interface CommunitiesSearchResponse {
  success: boolean;
  communities?: {
    items: SearchCommunityItem[];
    pagination: Pagination;
  };
  error?: string;
}

export interface PostsSearchResponse {
  success: boolean;
  posts?: {
    items: SearchPostItem[];
    pagination: Pagination;
  };
  error?: string;
}

/**
 * Search for users
 */
export const searchUsers = async (query: string, page = 1, limit = 10): Promise<UsersSearchResponse> => {
  try {
    const headers = createAuthHeaders();

    const response = await fetch(`/api/search?user=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`API returned status code ${response.status}`);
    }

    const data: UsersSearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
};

/**
 * Search for communities
 */
export const searchCommunities = async (query: string, page = 1, limit = 10): Promise<CommunitiesSearchResponse> => {
  try {
    const headers = createAuthHeaders();

    const response = await fetch(`/api/search?community=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`API returned status code ${response.status}`);
    }

    const data: CommunitiesSearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching communities:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
};

/**
 * Search for posts and replies
 */
export const searchPosts = async (query: string, page = 1, limit = 10): Promise<PostsSearchResponse> => {
  try {
    const headers = createAuthHeaders();

    const response = await fetch(`/api/search?post=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`API returned status code ${response.status}`);
    }

    const data: PostsSearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching posts:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
};

/**
 * Combined search function that returns all types of results
 */
export const searchAll = async (query: string, page = 1, limit = 5): Promise<{
  users: UsersSearchResponse,
  communities: CommunitiesSearchResponse,
  posts: PostsSearchResponse
}> => {
  try {
    const [usersResponse, communitiesResponse, postsResponse] = await Promise.all([
      searchUsers(query, page, limit),
      searchCommunities(query, page, limit),
      searchPosts(query, page, limit)
    ]);

    return {
      users: usersResponse,
      communities: communitiesResponse,
      posts: postsResponse
    };
  } catch (error) {
    console.error('Error in combined search:', error);
    const errorResponse = { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
    return {
      users: errorResponse as UsersSearchResponse,
      communities: errorResponse as CommunitiesSearchResponse,
      posts: errorResponse as PostsSearchResponse
    };
  }
}; 