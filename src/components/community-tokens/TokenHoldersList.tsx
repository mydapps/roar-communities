import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Crown } from 'lucide-react';
import { getTokenHolders, TokenHoldersResponse } from '@/utils/communityTokensApi';

interface TokenHolder {
  rank: number;
  userId: number;
  handle: string;
  avatar: string;
  balance: number;
  isCreator: boolean;
}

interface TokenHoldersListProps {
  ticker: string;
  tokenSymbol: string;
}

const TokenHoldersList: React.FC<TokenHoldersListProps> = ({ ticker, tokenSymbol }) => {
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalHolders, setTotalHolders] = useState(0);

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(2)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(2)}K`;
    }
    return balance.toLocaleString();
  };

  const fetchHolders = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await getTokenHolders(ticker, page, 20);
      
      if (response.success && response.data) {
        const newHolders = response.data.holders;
        
        if (append) {
          setHolders(prev => [...prev, ...newHolders]);
        } else {
          setHolders(newHolders);
        }
        
        setHasNextPage(response.data.pagination.hasNextPage);
        setTotalHolders(response.data.pagination.totalHolders);
        setCurrentPage(page);
      } else {
        setError(response.error || 'Failed to fetch holders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [ticker]);

  const loadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchHolders(currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (ticker) {
      fetchHolders(1, false);
    }
  }, [ticker, fetchHolders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading holders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchHolders(1, false)} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No holders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        {totalHolders.toLocaleString()} total holders
      </div>
      
      <div className="space-y-3">
        {holders.map((holder) => (
          <div
            key={`${holder.userId}-${holder.rank}`}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <span className="text-xs md:text-sm font-medium text-muted-foreground w-6 md:w-8">
                  #{holder.rank}
                </span>
                {holder.isCreator && (
                  <Crown className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
                )}
              </div>
              
              <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                <AvatarImage src={holder.avatar} alt={holder.handle} />
                <AvatarFallback className="text-xs">
                  {holder.handle.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 md:gap-2">
                  <p className="font-medium text-sm md:text-base truncate">@{holder.handle}</p>
                  {holder.isCreator && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0 hidden md:inline-flex">
                      Creator
                    </Badge>
                  )}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Token holder
                </p>
              </div>
            </div>
            
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-xs md:text-sm font-medium">
                {formatBalance(holder.balance)}
              </p>
              <p className="text-xs text-muted-foreground">
                ${tokenSymbol}
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            disabled={loadingMore}
            variant="outline"
            className="w-full"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading more...
              </>
            ) : (
              'Load More Holders'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TokenHoldersList;

