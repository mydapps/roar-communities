import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Plus,
  User,
  Loader2,
  RefreshCw,
  Clock,
  Gift,
  Star,
  ArrowRight,
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import CommunityCard from '@/components/communities/CommunityCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useCommunities } from '@/hooks/useCommunities';
import { Community, buySharesConfirm, sellSharesConfirm, CommunityPortfolioItem } from '@/utils/communityApi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { TradeSheet } from '@/components/shares/TradeSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { getWalletBalance } from '@/utils/communityApi';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';

// Enhanced Hero Section Component
const HeroSection = ({ isLoggedIn, onCreateCommunity }: { isLoggedIn: boolean, onCreateCommunity: () => void }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="relative mb-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-emerald-500/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-emerald-500/10" />
      <div className="absolute inset-0 bg-dot-pattern opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }} />
      
      <div className="relative px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading with enhanced typography */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Discover Communities
            </h1>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          
          {/* Subtitle with better spacing */}
          <p className="text-muted-foreground text-lg md:text-xl mb-6 max-w-2xl mx-auto leading-relaxed">
            Invest in communities like stocks, join discussions, and earn from your participation. 
            <span className="text-primary font-medium"> Build the future together.</span>
          </p>
          
          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button 
              onClick={onCreateCommunity}
              size={isMobile ? "default" : "lg"}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
              Create Community
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            

          </div>
        </div>
      </div>
    </div>
  );
};



// Enhanced Tab Icons and Labels
const getTabConfig = () => [
  { value: 'popular', icon: TrendingUp, label: 'Popular', description: 'Most active communities' },
  { value: 'my', icon: User, label: 'My Communities', description: 'Your investments' },
  { value: 'trending', icon: Star, label: 'Trending', description: 'Rising fast' },
  { value: 'newest', icon: Clock, label: 'Newest', description: 'Just launched' },
  { value: 'most-rewards', icon: Gift, label: 'Rewards', description: 'Highest rewards' }
];

// Enhanced Empty State Component
const EmptyState = ({ activeTab, searchQuery }: { activeTab: string, searchQuery: string }) => {
  const getEmptyStateContent = () => {
    if (searchQuery) {
      return {
        icon: Search,
        title: 'No communities found',
        description: `No communities match your search for "${searchQuery}". Try different keywords or browse popular communities.`,
        action: { text: 'Clear Search', onClick: () => window.location.reload() }
      };
    }
    
    switch (activeTab) {
      case 'my':
        return {
          icon: Users,
          title: 'Join your first community',
          description: 'Start by exploring popular communities and investing in the ones you believe in.',
          action: { text: 'Explore Popular', onClick: () => {} }
        };
      default:
        return {
          icon: Sparkles,
          title: 'No communities yet',
          description: 'Be the first to create a community in this category!',
          action: { text: 'Create Community', onClick: () => {} }
        };
    }
  };
  
  const { icon: Icon, title, description, action } = getEmptyStateContent();
  
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
        <div className="relative bg-primary/10 p-6 rounded-full">
          <Icon className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6 leading-relaxed">{description}</p>
      <Button variant="outline" onClick={action.onClick} className="group">
        {action.text}
        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
};

const CommunitiesPage = () => {

  
  // State for trading dialog
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell' | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('popular');
  
  // Check if user is logged in using dapps_user_id
  const isLoggedIn = !!localStorage.getItem('dapps_user_id');
  
  // Effect to disable pull-to-refresh on this page
  useEffect(() => {
    const originalStyle = document.body.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = 'contain';
    console.log('[CommunitiesPage] Applied overscroll-behavior-y: contain to body');

    // Cleanup function to restore original style on unmount
    return () => {
      document.body.style.overscrollBehaviorY = originalStyle;
      console.log('[CommunitiesPage] Restored original overscroll-behavior-y to body');
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount
  
  // Fetch popular communities (default)
  const {
    communities: popularCommunities,
    isLoading: isLoadingPopular,
    isRefreshing: isRefreshingPopular,
    refreshCommunities: refreshPopularCommunities,
    loadMoreRef: popularLoadMoreRef,
  } = useCommunities({});
  
  // Fetch my communities
  const {
    communities: myCommunities,
    isLoading: isLoadingMy,
    isRefreshing: isRefreshingMy,
    refreshCommunities: refreshMyCommunities,
    loadMoreRef: myLoadMoreRef,
  } = useCommunities({
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
    // If user is not logged in, redirect to index page
    if (!isLoggedIn) {
      navigate('/index');
      return;
    }
    
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
  
  // Handle create community button click
  const handleCreateCommunity = () => {
    if (!isLoggedIn) {
      navigate('/index');
      return;
    }
    navigate('/create-community');
  };
  
  // Handle trade success
  const handleTradeSuccess = () => {
    setTradeSuccess(true);
    // Refresh the current tab's data
    handleRefresh();
  };
  
  // Handle buy shares confirmation
  const handleBuySharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setTradeLoading(true);
      const result = await buySharesConfirm(communityName, quantity);
      
             if (result && result.status === 'SUCCESS') {
         toast.success(`Successfully bought ${quantity} shares in ${communityName}!`);
         handleTradeSuccess();
         setTradeDialogOpen(false);
       } else {
         toast.error(result?.message || 'Failed to buy shares. Please try again.');
       }
    } catch (error) {
      console.error('Error buying shares:', error);
      toast.error('An error occurred while buying shares. Please try again.');
    } finally {
      setTradeLoading(false);
    }
  };
  
  // Handle sell shares confirmation  
  const handleSellSharesConfirm = async (communityName: string, quantity: number) => {
    try {
      setTradeLoading(true);
      const result = await sellSharesConfirm(communityName, quantity);
      
             if (result && result.status === 'SUCCESS') {
         toast.success(`Successfully sold ${quantity} shares in ${communityName}!`);
         handleTradeSuccess();
         setTradeDialogOpen(false);
       } else {
         toast.error(result?.message || 'Failed to sell shares. Please try again.');
       }
    } catch (error) {
      console.error('Error selling shares:', error);
      toast.error('An error occurred while selling shares. Please try again.');
    } finally {
      setTradeLoading(false);
    }
  };
  
  // Get active tab data
  const getActiveTabData = () => {
    switch (activeTab) {
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
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-muted/20 ${isMobile ? 'pb-24' : 'pb-10'}`}>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>Communities - dapps.co - decentralized community network</title>
        <meta name="title" content="Communities - dapps.co - decentralized community network" />
        <meta name="description" content="Discover thriving communities on dapps.co. Invest in communities like stocks, join discussions, and earn from your participation. Browse popular, trending, and newest communities." />
        <meta name="keywords" content="communities, invest in communities, community shares, social investing, decentralized communities, web3 communities, blockchain communities" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dapps.co/communities" />
        <meta property="og:title" content="Communities - dapps.co - decentralized community network" />
        <meta property="og:description" content="Discover thriving communities on dapps.co. Invest in communities like stocks, join discussions, and earn from your participation. Browse popular, trending, and newest communities." />
        <meta property="og:image" content="https://dapps.co/og-community-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="dapps.co" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://dapps.co/communities" />
        <meta property="twitter:title" content="Communities - dapps.co - decentralized community network" />
        <meta property="twitter:description" content="Discover thriving communities on dapps.co. Invest in communities like stocks, join discussions, and earn from your participation. Browse popular, trending, and newest communities." />
        <meta property="twitter:image" content="https://dapps.co/og-community-image.png" />
        <meta property="twitter:site" content="@dapps_co" />
        <meta property="twitter:creator" content="@dapps_co" />
        
        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#31bcc3" />
        <link rel="canonical" href="https://dapps.co/communities" />
      </Helmet>
      
      <div className="container max-w-7xl mx-auto px-4 pt-8">
        {/* Enhanced Hero Section */}
        <HeroSection isLoggedIn={isLoggedIn} onCreateCommunity={handleCreateCommunity} />



        {/* Enhanced Tabs Section */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <div className="relative overflow-x-auto pb-2 scrollbar-hide">
                         <TabsList className="inline-flex w-auto min-w-full whitespace-nowrap bg-muted/50 p-1 rounded-xl backdrop-blur-sm border border-border/20">
               {getTabConfig().map(({ value, icon: Icon, label, description }) => (
                 <TabsTrigger 
                   key={value} 
                   value={value} 
                   className="flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 group hover:bg-muted/80"
                 >
                                     <Icon className="h-4 w-4 group-data-[state=active]:text-primary-foreground" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{label}</span>
                    {!isMobile && (
                                             <span className="text-xs text-muted-foreground group-data-[state=active]:text-primary-foreground/80">
                         {description}
                       </span>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Enhanced Content Section */}
          <div className="mt-6">
            {isLoading && currentCommunities.length === 0 ? (
              <CommunityCardSkeleton count={6} />
            ) : (
              <>
                {/* Communities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
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
                      userShares={community.userShares && community.userShares > 0 ? community.userShares : undefined}
                      onBuy={() => handleTradeAction(community, 'buy')}
                      onSell={() => handleTradeAction(community, 'sell')}
                      isLoggedIn={isLoggedIn}
                    />
                  ))}
                </div>
                
                {/* Load More Section */}
                {currentCommunities.length > 0 && (
                  <div 
                    ref={loadMoreRef} 
                    className="flex justify-center py-8 mt-8"
                  >
                    {isLoading && !isRefreshing && (
                      <div className="flex items-center justify-center space-x-3 bg-background/80 backdrop-blur-sm px-6 py-3 rounded-full border border-border/20">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-medium">Loading more communities...</span>
                      </div>
                    )}
                  </div>
                )}
                
                                 {/* Enhanced Empty State */}
                 {currentCommunities.length === 0 && !isLoading && (
                   <EmptyState activeTab={activeTab} searchQuery="" />
                 )}
              </>
            )}
          </div>
        </Tabs>

        {/* Trade Sheet (unchanged functionality) */}
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
            onBalanceUpdate={(newBalance) => setUserEthBalance(newBalance)}
          />
        )}
        
        {/* Enhanced Mobile FAB */}
        <Button 
          onClick={handleCreateCommunity}
          size="icon" 
          className="md:hidden fixed bottom-28 right-4 z-50 h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
        >
          <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </div>
    </div>
  );
};

// Enhanced Skeleton Loader with better visual hierarchy
const CommunityCardSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array(count).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden border-border/20 bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-slate-900/20 animate-pulse">
          <div className="p-6 space-y-4">
            {/* Header with avatar and title */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Stats section */}
            <div className="py-4 space-y-3 border-t border-b border-border/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-16 rounded-md" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Debug component (unchanged)
const MyCommunitiesDebug = ({ communities, isLoading }: { communities: Community[], isLoading: boolean }) => {
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <div className="col-span-full p-6 bg-muted/50 rounded-lg border border-amber-200 dark:border-amber-900">
      <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Debug: My Communities</h4>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        Communities count: {communities.length} | Loading: {isLoading ? 'Yes' : 'No'}
      </p>
      {communities.length > 0 && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Communities: {communities.map(c => c.name).join(', ')}
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;
