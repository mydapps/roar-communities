import { useState, useEffect, useCallback } from 'react';
import { getUserReplies, UserReplyData } from '@/utils/userApi';
import { toast } from 'sonner';

interface UseUserRepliesProps {
  handle: string;
  initialLimit?: number;
}

interface UseUserRepliesReturn {
  replies: UserReplyData[];
  loading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  totalReplies: number;
  refreshReplies: () => Promise<void>;
}

export const useUserReplies = ({ 
  handle, 
  initialLimit = 10 
}: UseUserRepliesProps): UseUserRepliesReturn => {
  const [replies, setReplies] = useState<UserReplyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalReplies, setTotalReplies] = useState(0);
  
  const fetchReplies = useCallback(async (pageNum: number, replace = false) => {
    if (!handle) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserReplies(handle, pageNum, initialLimit);
      
      if (response.success) {
        if (replace) {
          setReplies(response.data);
        } else {
          setReplies(prev => [...prev, ...response.data]);
        }
        
        setTotalReplies(response.pagination.total);
        setHasMore(response.pagination.has_next_page);
      } else {
        setError("Failed to load replies");
      }
    } catch (err) {
      console.error('Error fetching user replies:', err);
      setError('Failed to load replies. Please try again.');
      toast.error('Failed to load replies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [handle, initialLimit]);
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    await fetchReplies(nextPage);
    setPage(nextPage);
  }, [fetchReplies, hasMore, loading, page]);
  
  const refreshReplies = useCallback(async () => {
    setPage(1);
    await fetchReplies(1, true);
  }, [fetchReplies]);
  
  // Initial load
  useEffect(() => {
    if (handle) {
      setPage(1);
      fetchReplies(1, true);
    }
  }, [handle, fetchReplies]);
  
  return {
    replies,
    loading,
    error,
    loadMore,
    hasMore,
    totalReplies,
    refreshReplies
  };
}; 