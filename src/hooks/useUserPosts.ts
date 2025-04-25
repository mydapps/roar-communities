import { useState, useEffect, useCallback } from 'react';
import { getUserPosts, UserPost } from '@/utils/userApi';
import { toast } from 'sonner';

interface UseUserPostsProps {
  handle: string;
  initialLimit?: number;
}

interface UseUserPostsReturn {
  posts: UserPost[];
  loading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  totalPosts: number;
  refreshPosts: () => Promise<void>;
}

export const useUserPosts = ({ 
  handle, 
  initialLimit = 10 
}: UseUserPostsProps): UseUserPostsReturn => {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  
  const fetchPosts = useCallback(async (pageNum: number, replace = false) => {
    if (!handle) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserPosts(handle, pageNum, initialLimit);
      
      if (response.success) {
        // Log received posts for debugging roar status
        if (response.posts.length > 0) {
          console.log(`Received ${response.posts.length} posts, first post roar status:`, 
            response.posts[0].code, 
            'has_upvoted:', response.posts[0].has_upvoted);
        }
        
        if (replace) {
          setPosts(response.posts);
        } else {
          setPosts(prev => [...prev, ...response.posts]);
        }
        
        setTotalPosts(response.pagination.total);
        setHasMore(response.pagination.has_next_page);
      } else {
        setError("Failed to load posts");
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError('Failed to load posts. Please try again.');
      toast.error('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [handle, initialLimit]);
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    await fetchPosts(nextPage);
    setPage(nextPage);
  }, [fetchPosts, hasMore, loading, page]);
  
  const refreshPosts = useCallback(async () => {
    console.log('Refreshing posts after roar...');
    setPage(1);
    await fetchPosts(1, true);
  }, [fetchPosts]);
  
  // Initial load
  useEffect(() => {
    if (handle) {
      setPage(1);
      fetchPosts(1, true);
    }
  }, [handle, fetchPosts]);
  
  return {
    posts,
    loading,
    error,
    loadMore,
    hasMore,
    totalPosts,
    refreshPosts
  };
}; 