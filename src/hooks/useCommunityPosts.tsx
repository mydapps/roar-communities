import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { PollData } from '@/utils/postApi';

export interface PostImage {
  url: string;
}

export interface PollOptionDisplay {
  text: string;
  imageUrl?: string;
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
  pinned?: number;
  mirror_quote?: string;
  original_post_code?: string;
  original_author?: string;
  original_community?: string;
  original_body?: string;
  original_created_on?: string;
  original_author_avatar?: string;
  original_images?: string[];
  original_title?: string;
  is_poll?: boolean;
  poll_data?: PollData | null;
}

export const useCommunityPosts = (communityName: string | undefined) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const currentPage = useRef<number>(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingElementRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  
  const fetchPosts = useCallback(async (pageToFetch: number, limit: number = 10) => {
    if (isFetchingRef.current && pageToFetch !== 1) return;
    if (!communityName) {
        setPosts([]);
        setHasMore(false);
        return;
    }

    isFetchingRef.current = true;
    if(pageToFetch === 1) setLoading(true);
      setError(null);
    
    try {
      const url = `/api/fetch_posts?c=${encodeURIComponent(communityName)}&page=${pageToFetch}&limit=${limit}`;
      const response = await fetch(url, {
          method: 'GET',
          credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const fetchedPosts = Array.isArray(data) ? data : (data.posts || []); 
      
      setPosts(prev => pageToFetch === 1 ? fetchedPosts : [...prev, ...fetchedPosts]);
      setHasMore(fetchedPosts.length === limit);
      currentPage.current = pageToFetch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error("Failed to fetch community posts:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [communityName]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log("Intersection observer triggered: ", entry.isIntersecting, "hasMore:", hasMore, "loading:", loading);
        if (entry.isIntersecting && hasMore && !loading && !isFetchingRef.current) {
          console.log("Loading element is visible, loading more posts...");
          loadMore();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '500px' // Increased rootMargin to detect earlier
      }
    );
    
    observerRef.current = observer;
    
    // Immediately observe loading element if it exists
    if (loadingElementRef.current) {
      observer.observe(loadingElementRef.current);
      console.log("Observer attached to loading element");
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading]);

  // Observe the loading element when it exists
  useEffect(() => {
    const currentObserver = observerRef.current;
    const currentLoadingElement = loadingElementRef.current;
    
    if (currentObserver && currentLoadingElement) {
      console.log("Observer attached to loading element");
      currentObserver.observe(currentLoadingElement);
    }
    
    return () => {
      if (currentObserver && currentLoadingElement) {
        currentObserver.unobserve(currentLoadingElement);
      }
    };
  }, [loadingElementRef.current]);

  useEffect(() => {
    setPosts([]);
    currentPage.current = 1;
    setHasMore(true);
    isFetchingRef.current = false;
    if (communityName) {
      fetchPosts(1);
    }
  }, [communityName, fetchPosts]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || isFetchingRef.current) {
      return;
    }
    const nextPage = currentPage.current + 1;
    fetchPosts(nextPage);
  }, [loading, hasMore, fetchPosts]);

  const refetch = useCallback(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  return { 
    posts, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    loadingElementRef,
    fetchPosts,
    refetch
  };
};
