
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
  RefreshCw
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
import { Community } from '@/utils/communityApi';
import { toast } from 'sonner';
import { CommunityShareDialog } from '@/components/communities/CommunityShareDialog';

const CommunitiesPage = () => {
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // State for trading dialog
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch all communities
  const {
    communities: allCommunities,
    isLoading: isLoadingAll,
    isRefreshing: isRefreshingAll,
    refreshCommunities: refreshAllCommunities,
    loadMoreRef: allLoadMoreRef,
  } = useCommunities({
    search: activeTab === 'all' ? debouncedSearchQuery : '',
    category: activeTab === 'trending' ? 'trending' : 
             activeTab === 'newest' ? 'newest' : 
             activeTab === 'highest-reward' ? 'rewards' : 
             undefined
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
    if (activeTab === 'my') {
      refreshMyCommunities();
    } else {
      refreshAllCommunities();
    }
    toast.success("Refreshing communities data...");
  };
  
  // Handle buy/sell action
  const handleTradeAction = (community: Community, action: 'buy' | 'sell') => {
    setSelectedCommunity(community);
    setTradeAction(action);
    setTradeDialogOpen(true);
  };
  
  // Handle trade success
  const handleTradeSuccess = useCallback(() => {
    if (activeTab === 'my') {
      refreshMyCommunities();
    } else {
      refreshAllCommunities();
    }
  }, [activeTab, refreshMyCommunities, refreshAllCommunities]);
  
  // Based on the active tab, select the relevant data
  const isLoading = activeTab === 'my' ? isLoadingMy : isLoadingAll;
  const isRefreshing = activeTab === 'my' ? isRefreshingMy : isRefreshingAll;
  const loadMoreRef = activeTab === 'my' ? myLoadMoreRef : allLoadMoreRef;
  const currentCommunities = activeTab === 'my' ? myCommunities : allCommunities;

  return (
    <div className="space-y-6 animate-fade-in max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Communities</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Community</DialogTitle>
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

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto justify-start mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="my">My Communities</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="highest-reward">Highest Reward</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCommunities.map((community) => (
              <CommunityCard 
                key={community.name}
                name={community.name}
                description={community.description || ''}
                members={community.membersCount || 0}
                pricePerShare={community.sharePrice?.buyPrice || 0}
                priceChange={5.7} // Placeholder - should be calculated from last7Prices
                rewardPool={1.65} // Placeholder - not provided in API
                marketCap={parseFloat(community.marketCap || '0')}
                image={community.image || ''}
                isMember={!!community.userShares}
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
            
            {currentCommunities.length === 0 && !isLoading && (
              <div className="col-span-full p-8 text-center bg-muted/20 rounded-lg border border-border/40">
                <h3 className="font-medium text-lg">No communities found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your search or explore other categories.</p>
              </div>
            )}
            
            {isLoading && currentCommunities.length === 0 && (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCommunities.length > 0 ? (
              myCommunities.map((community) => (
                <CommunityCard 
                  key={community.name}
                  name={community.name}
                  description={community.description || ''}
                  members={community.membersCount || 0}
                  pricePerShare={community.sharePrice?.buyPrice || 0}
                  priceChange={5.7} // Placeholder
                  rewardPool={1.65} // Placeholder
                  marketCap={parseFloat(community.marketCap || '0')}
                  image={community.image || ''}
                  isMember={true}
                  onBuy={() => handleTradeAction(community, 'buy')}
                  onSell={() => handleTradeAction(community, 'sell')}
                />
              ))
            ) : !isLoadingMy ? (
              <div className="col-span-full text-center py-10">
                <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No communities joined yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't joined any communities yet. Browse and join some communities to see them here.
                </p>
                <Button asChild variant="outline">
                  <Link to="/communities">Explore Communities</Link>
                </Button>
              </div>
            ) : (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {myCommunities.length > 0 && (
              <div 
                ref={myLoadMoreRef} 
                className="col-span-full flex justify-center py-4 mt-2"
              >
                {isLoadingMy && !isRefreshingMy && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCommunities.length > 0 ? currentCommunities.map((community) => (
              <CommunityCard 
                key={community.name}
                name={community.name}
                description={community.description || ''}
                members={community.membersCount || 0}
                pricePerShare={community.sharePrice?.buyPrice || 0}
                priceChange={5.7} // Placeholder
                rewardPool={1.65} // Placeholder
                marketCap={parseFloat(community.marketCap || '0')}
                image={community.image || ''}
                isMember={!!community.userShares}
                onBuy={() => handleTradeAction(community, 'buy')}
                onSell={() => handleTradeAction(community, 'sell')}
              />
            )) : isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="col-span-full p-8 text-center bg-muted/20 rounded-lg border border-border/40">
                <h3 className="font-medium text-lg">No trending communities</h3>
                <p className="text-muted-foreground mt-2">Check back later for trending communities.</p>
              </div>
            )}
            
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
          </div>
        </TabsContent>

        <TabsContent value="newest" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCommunities.length > 0 ? currentCommunities.map((community) => (
              <CommunityCard 
                key={community.name}
                name={community.name}
                description={community.description || ''}
                members={community.membersCount || 0}
                pricePerShare={community.sharePrice?.buyPrice || 0}
                priceChange={5.7} // Placeholder
                rewardPool={1.65} // Placeholder
                marketCap={parseFloat(community.marketCap || '0')}
                image={community.image || ''}
                isMember={!!community.userShares}
                onBuy={() => handleTradeAction(community, 'buy')}
                onSell={() => handleTradeAction(community, 'sell')}
              />
            )) : isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="col-span-full p-8 text-center bg-muted/20 rounded-lg border border-border/40">
                <h3 className="font-medium text-lg">No new communities</h3>
                <p className="text-muted-foreground mt-2">Check back later for new communities.</p>
              </div>
            )}
            
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
          </div>
        </TabsContent>

        <TabsContent value="highest-reward" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCommunities.length > 0 ? currentCommunities.map((community) => (
              <CommunityCard 
                key={community.name}
                name={community.name}
                description={community.description || ''}
                members={community.membersCount || 0}
                pricePerShare={community.sharePrice?.buyPrice || 0}
                priceChange={5.7} // Placeholder
                rewardPool={1.65} // Placeholder
                marketCap={parseFloat(community.marketCap || '0')}
                image={community.image || ''}
                isMember={!!community.userShares}
                onBuy={() => handleTradeAction(community, 'buy')}
                onSell={() => handleTradeAction(community, 'sell')}
              />
            )) : isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="col-span-full p-8 text-center bg-muted/20 rounded-lg border border-border/40">
                <h3 className="font-medium text-lg">No high-reward communities</h3>
                <p className="text-muted-foreground mt-2">Check back later for high-reward communities.</p>
              </div>
            )}
            
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
          </div>
        </TabsContent>
      </Tabs>

      <CommunityShareDialog
        community={selectedCommunity}
        open={tradeDialogOpen}
        onOpenChange={setTradeDialogOpen}
        initialAction={tradeAction}
        onSuccess={handleTradeSuccess}
      />
    </div>
  );
};

export default CommunitiesPage;
