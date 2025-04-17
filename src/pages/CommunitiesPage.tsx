import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Plus,
  Filter,
  User,
  Loader2,
  RefreshCw,
  Clock,
  Gift
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import CommunityCard from '@/components/communities/CommunityCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useCommunities } from '@/hooks/useCommunities';
import { Community, buySharesConfirm, sellSharesConfirm, CommunityPortfolioItem } from '@/utils/communityApi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeSheet } from '@/components/shares/TradeSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { getWalletBalance } from '@/utils/communityApi';

const CommunitiesPage = () => {
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // State for trading dialog
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell' | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const isMobile = useIsMobile();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('popular');
  
  // Fetch popular communities (default)
  const {
    communities: popularCommunities,
    isLoading: isLoadingPopular,
    isRefreshing: isRefreshingPopular,
    refreshCommunities: refreshPopularCommunities,
    loadMoreRef: popularLoadMoreRef,
  } = useCommunities({
    search: activeTab === 'popular' ? debouncedSearchQuery : '',
  });
  
  // Fetch my communities
  const {
    communities: myCommunities,
    isLoading: isLoadingMy,
    isRefreshing: isRefreshingMy,
    refreshCommunities: refreshMyCommunities,
    loadMoreRef: myLoadMoreRef,
  } = useCommunities({
    search: activeTab === 'my' ? debouncedSearchQuery : '',
    personal: true
  });
  
  // Fetch trending communities
  const {
    communities: trendingCommunities,
    isLoading: isLoadingTrending,
    isRefreshing: isRefreshingTrending,
    refreshCommunities: refreshTrendingCommunities,
    loadMoreRef: trendingLoadMoreRef,
  } = useCommunities({
    search: activeTab === 'trending' ? debouncedSearchQuery : '',
    trending: true
  });
  
  // Fetch newest communities
  const {
    communities: newestCommunities,
    isLoading: isLoadingNewest,
    isRefreshing: isRefreshingNewest,
    refreshCommunities: refreshNewestCommunities,
    loadMoreRef: newestLoadMoreRef,
  } = useCommunities({
    search: activeTab === 'newest' ? debouncedSearchQuery : '',
    newest: true
  });
  
  // Fetch most rewards communities
  const {
    communities: mostRewardsCommunities,
    isLoading: isLoadingMostRewards,
    isRefreshing: isRefreshingMostRewards,
    refreshCommunities: refreshMostRewardsCommunities,
    loadMoreRef: mostRewardsLoadMoreRef,
  } = useCommunities({
    search: activeTab === 'most-rewards' ? debouncedSearchQuery : '',
    mostRewards: true
  });
  
  // Fetch user's wallet balance for trading
  const fetchWalletBalance = async () => {
    try {
      const balanceData = await getWalletBalance();
      setUserEthBalance(balanceData.balance.eth);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setUserEthBalance("0.000");
    }
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // If changing to a different tab, reset the search
    if (value !== activeTab) {
      setSearchQuery('');
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    switch (activeTab) {
      case 'popular':
        refreshPopularCommunities();
        break;
      case 'my':
        refreshMyCommunities();
        break;
      case 'trending':
        refreshTrendingCommunities();
        break;
      case 'newest':
        refreshNewestCommunities();
        break;
      case 'most-rewards':
        refreshMostRewardsCommunities();
        break;
    }
    toast.success("Refreshing communities data...");
  };
  
  // Handle buy/sell action
  const handleTradeAction = (community: Community, action: 'buy' | 'sell') => {
    // Reset all trade states
    setTradeDialogOpen(false);
    setSelectedCommunity(null);
    setTradeAction(null);
    setTradeLoading(false);
    setTradeSuccess(false);
    
    // Small delay before opening new sheet to ensure clean state
    setTimeout(() => {
      setSelectedCommunity(community);
      setTradeAction(action);
      setTradeDialogOpen(true);
      
      // Fetch fresh balance when buying
      if (action === 'buy') {
        fetchWalletBalance();
      }
    }, 50);
  };
  
  // Handle trade success
  const handleTradeSuccess = () => {
    // Refresh wallet balance regardless of transaction type
    fetchWalletBalance();
    
    // Only reload communities list
    handleRefresh();
  };
  
  // Update trading confirmation handlers to fetch balance after transaction
  const handleBuySharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setTradeLoading(true);
      setTradeSuccess(false);
      const result = await buySharesConfirm(communityName, quantity);
      
      if (result && result.status === 'SUCCESS') {
        toast.success('Successfully purchased shares!');
        
        // IMPORTANT FIX: First set success true, then set loading false after a delay
        // This ensures the success screen is visible
        setTradeSuccess(true);
        
        setTimeout(() => {
          setTradeLoading(false);
        }, 300);
        
        // Don't hide the trade dialog immediately - let the success screen show
        // for a sufficient amount of time (reduced from 7000ms to 3500ms)
        setTimeout(() => {
          // Close the dialog after the success screen has been shown
          setTradeDialogOpen(false);
          setTradeSuccess(false);
          
          // After closing, refresh data
          fetchWalletBalance();
          handleRefresh();
        }, 5000); // Extended to 5 seconds for better visibility
      } else {
        // Set loading to false immediately for error cases
        setTradeLoading(false);
        toast.error(result?.message || 'Failed to purchase shares');
      }
    } catch (error) {
      setTradeLoading(false);
      toast.error('An error occurred while purchasing shares');
    }
  };
  
  const handleSellSharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setTradeLoading(true);
      setTradeSuccess(false);
      const result = await sellSharesConfirm(communityName, quantity);
      
      if (result && result.status === 'SUCCESS') {
        toast.success('Successfully sold shares!');
        
        // IMPORTANT FIX: First set success true, then set loading false after a delay
        // This ensures the success screen is visible
        setTradeSuccess(true);
        
        setTimeout(() => {
          setTradeLoading(false);
        }, 300);
        
        // Don't hide the trade dialog immediately - let the success screen show
        // for a sufficient amount of time (reduced from 7000ms to 3500ms)
        setTimeout(() => {
          // Close the dialog after the success screen has been shown
          setTradeDialogOpen(false);
          setTradeSuccess(false);
          
          // After closing, refresh data
          fetchWalletBalance();
          handleRefresh();
        }, 5000); // Extended to 5 seconds for better visibility
      } else {
        // Set loading to false immediately for error cases
        setTradeLoading(false);
        toast.error(result?.message || 'Failed to sell shares');
      }
    } catch (error) {
      setTradeLoading(false);
      toast.error('An error occurred while selling shares');
    }
  };
  
  // Based on the active tab, select the relevant data
  const getActiveTabData = () => {
    switch (activeTab) {
      case 'popular':
        return {
          communities: popularCommunities,
          isLoading: isLoadingPopular,
          isRefreshing: isRefreshingPopular,
          loadMoreRef: popularLoadMoreRef,
        };
      case 'my':
        return {
          communities: myCommunities,
          isLoading: isLoadingMy,
          isRefreshing: isRefreshingMy,
          loadMoreRef: myLoadMoreRef,
        };
      case 'trending':
        return {
          communities: trendingCommunities,
          isLoading: isLoadingTrending,
          isRefreshing: isRefreshingTrending,
          loadMoreRef: trendingLoadMoreRef,
        };
      case 'newest':
        return {
          communities: newestCommunities,
          isLoading: isLoadingNewest,
          isRefreshing: isRefreshingNewest,
          loadMoreRef: newestLoadMoreRef,
        };
      case 'most-rewards':
        return {
          communities: mostRewardsCommunities,
          isLoading: isLoadingMostRewards,
          isRefreshing: isRefreshingMostRewards,
          loadMoreRef: mostRewardsLoadMoreRef,
        };
      default:
        return {
          communities: popularCommunities,
          isLoading: isLoadingPopular,
          isRefreshing: isRefreshingPopular,
          loadMoreRef: popularLoadMoreRef,
        };
    }
  };

  const { communities: currentCommunities, isLoading, isRefreshing, loadMoreRef } = getActiveTabData();

  return (
    <div className="px-4 pt-16 pb-6 space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Communities</h1>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          <div className="w-full md:w-64 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search communities..."
              className="pl-9 pr-4 py-6 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-12 w-12 flex-shrink-0"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>

          <Link to="/create-community" className="hidden md:block">
            <Button
              variant="default"
              className="h-12 bg-[#31bcc3] hover:bg-[#31bcc3]/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="popular" value={activeTab} onValueChange={handleTabChange}>
        <div className="scrollbar-hide overflow-x-auto pb-4 -mx-4 px-4 tab-container">
          <TabsList className="h-auto p-1.5 inline-flex whitespace-nowrap w-auto min-w-full sm:w-auto sm:min-w-0 no-scrollbar bg-background border border-border/40 overflow-x-auto overflow-y-hidden scroll-smooth gap-2">
            <TabsTrigger 
              value="popular"
              className="flex items-center gap-1.5 text-sm py-3 px-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none mobile-friendly-tap"
            >
              <Users className="h-4 w-4" />
              <span>Popular</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="my"
              className="flex items-center gap-1.5 text-sm py-3 px-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none mobile-friendly-tap"
            >
              <User className="h-4 w-4" />
              <span>My Communities</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="trending"
              className="flex items-center gap-1.5 text-sm py-3 px-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none mobile-friendly-tap"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="newest"
              className="flex items-center gap-1.5 text-sm py-3 px-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none mobile-friendly-tap"
            >
              <Clock className="h-4 w-4" />
              <span>Newest</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="most-rewards"
              className="flex items-center gap-1.5 text-sm py-3 px-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none mobile-friendly-tap"
            >
              <Gift className="h-4 w-4" />
              <span>Most Rewards</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="space-y-4 animate-fade-in">
          {isLoading && currentCommunities.length === 0 ? (
            <CommunityCardSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Show debug information if "My Communities" is selected and empty */}
              {activeTab === 'my' && currentCommunities.length === 0 && !isLoading && (
                <MyCommunitiesDebug communities={myCommunities} isLoading={isLoadingMy} />
              )}
              
              {currentCommunities.map((community) => (
                <CommunityCard 
                  key={community.name}
                  name={community.name}
                  description={community.description || ''}
                  members={community.membersCount || 0}
                  pricePerShare={community.sharePrice?.buyPrice || 0}
                  priceChange={community.priceChange?.change24h || 0}
                  priceChangePercent={community.priceChange?.change24hPercent || '0%'}
                  rewardPool={community.rewards?.available_rewards || 0}
                  lastDistributed={community.rewards?.last_distributed || ''}
                  marketCap={parseFloat(community.marketCap || '0')}
                  image={community.image || ''}
                  isMember={!!community.userShares && community.userShares > 0}
                  isAdmin={!!community.isAdmin}
                  userShares={community.userShares || 0}
                  onBuy={() => handleTradeAction(community, 'buy')}
                  onSell={() => handleTradeAction(community, 'sell')}
                />
              ))}
              
              {currentCommunities.length > 0 && (
                <div 
                  ref={loadMoreRef} 
                  className="col-span-full flex justify-center py-4 mt-2"
                >
                  {isLoading && !isRefreshing && (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                    </div>
                  )}
                </div>
              )}
              
              {currentCommunities.length === 0 && !isLoading && activeTab !== 'my' && (
                <div className="col-span-full p-8 text-center bg-muted/20 rounded-lg border border-border/40">
                  <h3 className="font-medium text-lg">No communities found</h3>
                  <p className="text-muted-foreground mt-2">Try adjusting your search or explore other categories.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Tabs>

      {selectedCommunity && (
        <TradeSheet
          open={tradeDialogOpen}
          onOpenChange={setTradeDialogOpen}
          community={{
            community: selectedCommunity.name,
            shares: selectedCommunity.userShares || 0,
            image: selectedCommunity.image || '',
            currentPrice: {
              eth: selectedCommunity.sharePrice?.buyPrice || 0.001,
              usd: selectedCommunity.usdPrice || 2.5
            },
            value: {
              eth: (selectedCommunity.userShares || 0) * (selectedCommunity.sharePrice?.buyPrice || 0),
              usd: (selectedCommunity.userShares || 0) * (selectedCommunity.usdPrice || 0)
            }
          }}
          action={tradeAction}
          userEthBalance={userEthBalance}
          loadingAction={tradeLoading}
          onBuyConfirm={handleBuySharesConfirm}
          onSellConfirm={handleSellSharesConfirm}
          forceSuccessVisible={tradeSuccess}
        />
      )}
      
      {/* Mobile FAB for creating community */}
      <Link 
        to="/create-community" 
        className="md:hidden fixed bottom-20 right-4 z-50"
      >
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full bg-[#31bcc3] hover:bg-[#31bcc3]/90 text-white shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
};

// Skeleton loader for community cards
const CommunityCardSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(count).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden border-border/20 bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-slate-900/20">
          <div className="p-4 sm:p-5 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-3.5 w-16 rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="py-3 space-y-2.5 border-t border-b border-border/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-10" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-1.5">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Debug component for "My Communities" section
const MyCommunitiesDebug = ({ communities, isLoading }: { communities: Community[], isLoading: boolean }) => {
  if (isLoading) return null;
  
  // Check for authentication
  const isAuthenticated = localStorage.getItem('dapps_user_key') !== null;
  
  return (
    <div className="col-span-full">
      {!isAuthenticated ? (
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-lg mb-4">
          <div className="flex flex-col items-center text-center mb-3">
            <h4 className="font-medium text-lg text-blue-800 mb-1">Authentication Required</h4>
            <p className="text-blue-700 text-sm mb-3">Please log in to view your communities</p>
            
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                <User className="h-3.5 w-3.5 mr-2" />
                Login
              </Button>
              <p className="text-xs text-blue-600">
                You need to be logged in to see your personal communities and track your investments.
              </p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-blue-100 text-sm">
            <h5 className="font-medium text-blue-900 mb-2">How to access your communities:</h5>
            <ol className="list-decimal list-inside text-xs space-y-1 text-blue-800">
              <li>Login with your account credentials</li>
              <li>After login, this tab will automatically show your communities</li>
              <li>You can buy shares in any community to add it to this list</li>
            </ol>
          </div>
        </div>
      ) : communities.length === 0 ? (
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-lg mb-4">
          <div className="text-center mb-4">
            <h4 className="font-medium text-lg text-amber-800 mb-1">No Communities Yet</h4>
            <p className="text-amber-700 text-sm">You haven't joined any communities yet</p>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-amber-100 text-sm">
            <h5 className="font-medium text-amber-800 mb-2">How to join communities:</h5>
            <ol className="list-decimal list-inside text-xs space-y-1.5 text-amber-700">
              <li>Browse the <span className="font-medium">Popular</span> or <span className="font-medium">Trending</span> tabs</li>
              <li>Find a community that interests you</li>
              <li>Click the <span className="font-medium">Join</span> button to become a member</li>
              <li>Your joined communities will appear here</li>
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CommunitiesPage;
