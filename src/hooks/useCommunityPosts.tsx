
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface PostImage {
  url: string;
}

export interface CommunityPost {
  code: string;
  community: string;
  avatar: string;
  handle: string;
  timeAgo: string;
  title: string;
  body: string;
  body_shrunk: number;
  upvotes: number;
  comments: number;
  roar: number;
  engagement: number;
  roarable: number;
  image: number;
  image_url: string;
  multiple_images: number;
  images: string[];
  reply_count: number;
  replies?: {
    handle: string;
    avatar: string;
    date: string;
    body: string;
  }[];
  is_mirror: number;
}

export const useCommunityPosts = (communityName: string | undefined) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const currentPage = useRef<number>(1);
  
  const fetchPosts = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!communityName) {
      setError('Community name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userKey = localStorage.getItem('dapps_user_key');
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      if (userKey) {
        headers['x-user-key'] = userKey;
      }

      const response = await fetch(
        `https://api.dapps.co/fetch_posts?c=${encodeURIComponent(communityName)}&page=${page}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch community posts: ${response.status} ${response.statusText}`);
      }

      const data: CommunityPost[] = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format for community posts');
      }

      // Check if we received fewer posts than expected (assuming 10 per page)
      // This means we've reached the end of the list
      const hasMorePosts = data.length >= 10;
      
      setPosts(prev => append ? [...prev, ...data] : data);
      setHasMore(hasMorePosts);
      currentPage.current = page;

    } catch (err) {
      console.error('Error fetching community posts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to load community posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [communityName]);

  useEffect(() => {
    // Reset and fetch first page when community name changes
    setPosts([]);
    currentPage.current = 1;
    fetchPosts(1, false);
  }, [communityName, fetchPosts]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    const nextPage = currentPage.current + 1;
    fetchPosts(nextPage, true);
  }, [loading, hasMore, fetchPosts]);

  return { posts, loading, error, hasMore, loadMore };
};
