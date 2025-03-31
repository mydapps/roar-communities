
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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingElementRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  
  const fetchPosts = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!communityName || isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const userKey = localStorage.getItem('dapps_user_key');
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      if (userKey) {
        headers['x-user-key'] = userKey;
      }

      console.log(`Fetching community posts: ${communityName}, page: ${page}`);
      
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
      
      console.log(`Received posts data: ${data.length} posts for page ${page}`);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format for community posts');
      }

      // Check if we received fewer posts than expected (assuming 10 per page)
      // This means we've reached the end of the list
      const hasMorePosts = data.length > 0;
      
      setPosts(prev => append ? [...prev, ...data] : data);
      setHasMore(hasMorePosts);
      currentPage.current = page;

    } catch (err) {
      console.error('Error fetching community posts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to load community posts. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 200); // Reduced delay to make infinite scrolling more responsive
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
    // Reset and fetch first page when community name changes
    console.log("Community name changed, resetting posts:", communityName);
    setPosts([]);
    currentPage.current = 1;
    setHasMore(true);
    isFetchingRef.current = false;
    
    if (communityName) {
      fetchPosts(1, false);
    }
  }, [communityName, fetchPosts]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || isFetchingRef.current) {
      console.log("Cannot load more:", { loading, hasMore, isFetching: isFetchingRef.current });
      return;
    }
    
    console.log("Loading more posts, page:", currentPage.current + 1);
    const nextPage = currentPage.current + 1;
    fetchPosts(nextPage, true);
  }, [loading, hasMore, fetchPosts]);

  return { 
    posts, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    loadingElementRef
  };
};
