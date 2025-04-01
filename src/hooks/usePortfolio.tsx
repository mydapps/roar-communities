
import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { 
  getUserPortfolio, 
  CommunityPortfolioItem, 
  PortfolioPagination,
  PortfolioSummaryData
} from '@/utils/communityApi';
import { toast } from 'sonner';

export function usePortfolio() {
  const [portfolioItems, setPortfolioItems] = useState<CommunityPortfolioItem[]>([]);
  const [pagination, setPagination] = useState<PortfolioPagination | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummaryData | null>(null);
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
      console.log(`Fetching next page: ${nextPage}`);
      const result = await getUserPortfolio(nextPage);
      
      if (result.success && result.data) {
        // Ensure we're getting valid data before updating state
        const newCommunities = result.data.communities || [];
        const validCommunities = newCommunities.filter(c => c && typeof c === 'object');
        
        setPortfolioItems(prev => [...prev, ...validCommunities]);
        setPagination(result.data.pagination || null);
        setPortfolioSummary(result.data.portfolio || null);
      }
    } catch (error) {
      console.error('Failed to fetch next page:', error);
      toast.error('Failed to load more items');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [pagination, isLoading]);

  const refreshPortfolio = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('Refreshing portfolio data...');
      const result = await getUserPortfolio(1);
      
      if (result.success && result.data) {
        // Ensure we're getting valid data before updating state
        const communities = result.data.communities || [];
        const validCommunities = communities.filter(c => c && typeof c === 'object');
        
        setPortfolioItems(validCommunities);
        setPagination(result.data.pagination || null);
        if (result.data.portfolio) {
          setPortfolioSummary({
            totalValueEth: result.data.portfolio.totalValueEth || result.data.portfolio.total_value_eth || 0,
            totalValueUsd: result.data.portfolio.totalValueUsd || result.data.portfolio.total_value_usd || 0
          });
        }
        setIsError(false);
      }
    } catch (error) {
      console.error('Failed to refresh portfolio:', error);
      toast.error('Failed to refresh portfolio');
      setIsError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshPortfolio();
  }, []);

  // Load more when scrolling to the bottom
  useEffect(() => {
    if (inView && pagination?.hasNextPage) {
      console.log('Load more element in view, fetching next page...');
      fetchNextPage();
    }
  }, [inView, fetchNextPage, pagination]);

  return {
    portfolioItems,
    portfolioSummary,
    pagination,
    isLoading,
    isRefreshing,
    isError,
    refreshPortfolio,
    loadMoreRef: ref
  };
}
