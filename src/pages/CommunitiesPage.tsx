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
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [tradeLoading, setTradeLoading] = useState(false);
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
    setSelectedCommunity(community);
    setTradeAction(action);
    setTradeDialogOpen(true);
    fetchWalletBalance();
  };
  
  // Trading confirmation handlers
  const handleBuySharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setTradeLoading(true);
      
      const result = await buySharesConfirm(communityName, quantity);
      
      if (result.status === 'SUCCESS') {
        toast.success(`Successfully purchased ${result.shareQuantity} shares of ${communityName}`);
        handleTradeSuccess();
      } else {
        toast.error(result.message || 'Transaction failed');
      }
    } catch (error) {
      toast.error('Failed to complete purchase');
      console.error('Error during buy:', error);
    } finally {
      setTradeLoading(false);
    }
  };
  
  const handleSellSharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setTradeLoading(true);
      
      const result = await sellSharesConfirm(communityName, quantity);
      
      if (result.status === 'SUCCESS') {
        toast.success(`Successfully sold ${result.soldShares} shares of ${communityName}`);
        handleTradeSuccess();
      } else {
        toast.error(result.message || 'Transaction failed');
      }
    } catch (error) {
      toast.error('Failed to complete sale');
      console.error('Error during sell:', error);
    } finally {
      setTradeLoading(false);
    }
  };
  
  // Handle trade success
  const handleTradeSuccess = () => {
    setTradeDialogOpen(false);
    handleRefresh();
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
    <div className="space-y-6 animate-fade-in pt-16 sm:pt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Communities</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto gap-1 px-3 shadow-sm mt-1">
              <Plus className="h-3.5 w-3.5" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Create a New Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Community Name</label>
                <Input placeholder="E.g., DeFi Explorers" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" 
                  placeholder="What is your community about?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Share Price (ETH)</label>
                <Input type="number" placeholder="0.01" min="0.001" step="0.001" />
              </div>
              <Button className="w-full">Create Community</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 bg-muted/25 p-2 rounded-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-9 bg-background border-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="bg-background hover:bg-muted/50"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto justify-start mb-6 p-1 bg-muted/30">
            <TabsTrigger value="popular" className="flex items-center gap-1.5 px-4">
              <Users className="h-4 w-4" />
              <span>Popular</span>
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-1.5 px-4">
              <User className="h-4 w-4" />
              <span>My Communities</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1.5 px-4">
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </TabsTrigger>
            <TabsTrigger value="newest" className="flex items-center gap-1.5 px-4">
              <Clock className="h-4 w-4" />
              <span>Newest</span>
            </TabsTrigger>
            <TabsTrigger value="most-rewards" className="flex items-center gap-1.5 px-4">
              <Gift className="h-4 w-4" />
              <span>Highest Rewards</span>
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
        />
      )}
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
