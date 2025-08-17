import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction, getTransactions } from '@/utils/communityApi';
import { TransactionListItem } from '@/components/transactions/TransactionListItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer'; // For infinite scroll
import { ScrollArea } from '@/components/ui/scroll-area'; // Use ScrollArea if needed

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const limit = 20; // Number of items per page

  // Ref for the infinite scroll trigger element
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5, // Trigger when 50% visible
  });

  // Function to fetch transactions
  const fetchTransactions = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTransactions(page, limit);
      if (response && response.success) {
        setTransactions(prev => page === 1 ? response.transactions : [...prev, ...response.transactions]);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
      } else {
        // Error handled by getTransactions toast, but set local error state too
        setError(response?.message || 'Failed to load transactions.');
        // If page 1 fails, clear transactions
        if(page === 1) setTransactions([]);
      }
    } catch (err) {
      // Catch any unexpected errors from the fetch call itself
      console.error("Error in fetchTransactions component:", err);
      setError('An unexpected error occurred.');
      if(page === 1) setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  // Infinite scroll effect
  useEffect(() => {
    // Check if not loading, in view, and there are more pages
    if (inView && !isLoading && currentPage < totalPages) {
      fetchTransactions(currentPage + 1);
    }
  }, [inView, isLoading, currentPage, totalPages, fetchTransactions]);

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4 md:px-0 animate-fade-in pb-20 md:pb-10 pt-20 md:pt-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Initial Loading State */}
          {isLoading && transactions.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && transactions.length === 0 && (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
              <button 
                onClick={() => fetchTransactions(1)} 
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && transactions.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <p>You haven't made any transactions yet.</p>
            </div>
          )}

          {/* Transaction List */}
          {transactions.length > 0 && (
            <div>
              {transactions.map((tx) => (
                <TransactionListItem key={tx.id} transaction={tx} />
              ))}
            </div>
          )}

          {/* Loading More Indicator */}
          {isLoading && transactions.length > 0 && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
            </div>
          )}

          {/* Infinite Scroll Trigger (hidden element) */}
          {!isLoading && currentPage < totalPages && (
            <div ref={loadMoreRef} style={{ height: '10px' }} />
          )}

          {/* End of List Indicator */}
          {!isLoading && transactions.length > 0 && currentPage >= totalPages && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              You've reached the end of your transaction history.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistoryPage; 