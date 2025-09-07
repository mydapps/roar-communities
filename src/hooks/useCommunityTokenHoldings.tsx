import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { 
  getUserHoldings, 
  UserHolding, 
  UserHoldingsResponse
} from '@/utils/communityTokensApi';
import { toast } from 'sonner';

export function useCommunityTokenHoldings() {
  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [portfolio, setPortfolio] = useState<{
    totalHoldings: number;
    totalInvestedEth: number;
    totalCurrentValueEth: number;
    totalProfitLossEth: number;
    totalProfitLossPercent: number;
  } | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalHoldings: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Set up intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const fetchNextPage = useCallback(async () => {
    if (!pagination || !pagination.hasNextPage || isLoading) return;
    
    try {
      setIsLoading(true);
      const nextPage = pagination.currentPage + 1;
      console.log(`Fetching next page of holdings: ${nextPage}`);
      const result = await getUserHoldings({ page: nextPage });
      
      if (result.success && result.data) {
        const newHoldings = result.data.holdings || [];
        setHoldings(prev => [...prev, ...newHoldings]);
        setPagination(result.data.pagination || null);
        setPortfolio(result.data.portfolio || null);
      }
    } catch (error) {
      console.error('Failed to fetch next page of holdings:', error);
      toast.error('Failed to load more holdings');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [pagination, isLoading]);

  const refreshHoldings = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('Refreshing community token holdings...');
      const result = await getUserHoldings({ page: 1 });
      
      if (result.success && result.data) {
        setHoldings(result.data.holdings || []);
        setPagination(result.data.pagination || null);
        setPortfolio(result.data.portfolio || null);
        setIsError(false);
      } else {
        console.error('Failed to fetch holdings:', result.error);
        toast.error('Failed to load community token holdings');
        setIsError(true);
      }
    } catch (error) {
      console.error('Failed to refresh holdings:', error);
      toast.error('Failed to refresh holdings');
      setIsError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshHoldings();
  }, []);

  // Load more when scrolling to the bottom
  useEffect(() => {
    if (inView && pagination?.hasNextPage) {
      console.log('Load more element in view, fetching next page...');
      fetchNextPage();
    }
  }, [inView, fetchNextPage, pagination]);

  return {
    holdings,
    portfolio,
    pagination,
    isLoading,
    isRefreshing,
    isError,
    refreshHoldings,
    loadMoreRef: ref
  };
}


