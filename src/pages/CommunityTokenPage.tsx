import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreventZoom } from '@/hooks/usePreventZoom';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShareDialog } from '@/components/community/ShareDialog';
import { EncryptedCommunityAccess } from '@/components/community/EncryptedCommunityAccess';
import { toast } from "sonner";
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  DollarSign, 
  Info,
  Clock,
  Share2,
  ChevronUp,
  Sparkles,
  Heart,
  Copy,
  FileText,
  BookOpen,
  MoreHorizontal,
  Loader2,
  ShieldCheck,
  UploadCloud,
  Save,
  UserX,
  List,
  XIcon,
  HelpCircle,
  Search,
  ClockIcon,
  Ban,
  Coins,
  BarChart3,
  Wallet,
  TrendingDownIcon,
  Activity,
  Target,
  Zap,
  Lock
} from 'lucide-react';
import TradingInterface from '@/components/community-tokens/TradingInterface';
import { Post } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { MembersList } from '@/components/community/MembersList';
import { useCommunityPosts, CommunityPost } from '@/hooks/useCommunityPosts';
import { toggleRoar } from '@/utils/api';
import { getWalletBalance } from '@/utils/communityApi';
import { buySharesConfirm, sellSharesConfirm } from '@/utils/api';
import { Helmet } from 'react-helmet-async';
import { Textarea } from '@/components/ui/textarea';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import { updateCommunityAdmin } from '@/utils/communityApi';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  searchUsers, 
  UserSearchResponse, 
  muteUserInCommunity, 
  getMutedUsers, 
  unmuteUserInCommunity,
  MutedUser,
  MutedUsersApiResponse,
  MuteActionResponse
} from '@/utils/communityApi';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';

// Import community components
import CommunityHeader from '@/components/community/CommunityHeader';
import CommunityTabs from '@/components/community/CommunityTabs'; 
import CommunityPostsFeed from '@/components/community/CommunityPostsFeed';
import CommunityRewardsSection from '@/components/community/CommunityRewardsSection';
import CommunityAboutSection from '@/components/community/CommunityAboutSection';
import CommunityAdminPanel from '@/components/community/CommunityAdminPanel';

// Import new CT-specific components
import CommunityTokenHeader from '@/components/community-tokens/CommunityTokenHeader';
import CommunityTokenTabs from '@/components/community-tokens/CommunityTokenTabs';
import CommunityTokenRightPane from '@/components/community-tokens/CommunityTokenRightPane';
import CommunityTokenAnalytics from '@/components/community-tokens/CommunityTokenAnalytics';
import CommunityTokenRewards from '@/components/community-tokens/CommunityTokenRewards';

const LionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const debugLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[CommunityTokenPage]', ...args);
  }
};

// Mock token data for the community token
const generateMockTokenData = (communityName: string) => {
  const basePrice = 0.000012; // Starting price
  const priceChange = (Math.random() - 0.5) * 20; // -10% to +10%
  const currentPrice = basePrice * (1 + priceChange / 100);
  
  return {
    symbol: communityName?.toUpperCase().slice(0, 5) || 'TOKEN',
    name: `${communityName} Token` || 'Community Token',
    currentPrice,
    priceChange24h: priceChange,
    marketCap: currentPrice * 1000000000, // 1B total supply
    volume24h: Math.random() * 50000,
    holders: Math.floor(Math.random() * 5000) + 100,
    totalSupply: 1000000000,
    circulatingSupply: Math.floor(Math.random() * 500000000) + 100000000,
    status: Math.random() > 0.3 ? 'graduated' : 'incubation',
    timeLeft: Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 1800000), // 30 min max
    rewardPool: {
      address: '0x742d35Cc6634C0532925a3b8D4C8C8c8C8C8C8C8',
      ethBalance: Math.random() * 5,
      tokenBalance: Math.floor(Math.random() * 50000000),
      usdValue: Math.random() * 15000,
      isLocked: true,
      unlockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    recentTrades: Array.from({ length: 20 }, (_, i) => ({
      id: i,
      user: `trader_${Math.floor(Math.random() * 1000)}`,
      action: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: Math.floor(Math.random() * 10000000) + 1000,
      price: currentPrice * (0.95 + Math.random() * 0.1),
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      value: 0
    })),
    priceHistory: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000),
      price: basePrice * (0.8 + Math.random() * 0.4),
      volume: Math.random() * 10000
    }))
  };
};

const CommunityTokenPage = () => {
  // All hooks must be called at the top level, before any conditional returns
  usePreventZoom();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tradingModal, setTradingModal] = useState<{
    isOpen: boolean;
    token: any;
    mode: 'buy' | 'sell';
  }>({
    isOpen: false,
    token: null,
    mode: 'buy'
  });
  const [activeTab, setActiveTab] = useState("posts");
  const [localPosts, setLocalPosts] = useState<Partial<CommunityPost>[]>([]);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [previousHasShares, setPreviousHasShares] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  
  // Check if user is logged in using dapps_user_id
  const isLoggedIn = !!localStorage.getItem('dapps_user_id');
  
  debugLog("CommunityTokenPage rendering, id:", id, "activeTab:", activeTab, "isLoggedIn:", isLoggedIn);
  
  const { data: communityData, loading: communityLoading, error: communityError, isEncryptedAccess: communityEncryptedAccess, refetch } = useCommunityData(id);
  
  // Generate mock token data based on community
  const tokenData = useMemo(() => {
    if (communityData?.community?.name) {
      return generateMockTokenData(communityData.community.name);
    }
    return generateMockTokenData('Community');
  }, [communityData?.community?.name]);
  
  debugLog("Community data:", communityData);
  debugLog("Token data:", tokenData);
  
  const { members, loading: membersLoading, hasMore: hasMoreMembers, loadMore: loadMoreMembers } = useCommunityMembers(id);
  
  const { posts, loading: postsLoading, error: postsError, hasMore: hasMorePosts, loadMore: loadMorePosts, loadingElementRef, fetchPosts, isEncryptedAccess: postsEncryptedAccess } = useCommunityPosts(id);
  
  const allPosts = useMemo(() => {
    const combinedPosts = [...localPosts, ...posts];
    const uniquePosts = combinedPosts.reduce((acc, post) => {
      if (post.id && !acc.some(p => p.id === post.id)) {
        acc.push(post);
      }
      return acc;
    }, [] as Partial<CommunityPost>[]);
    
    return uniquePosts.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [localPosts, posts]);

  // All event handlers must be defined before conditional returns
  const handleRoar = useCallback(async (postId: string) => {
    if (!isLoggedIn) {
      toast.error("Please log in to roar posts");
      return;
    }

    try {
      const result = await toggleRoar(postId);
      if (result.success) {
        setLocalPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  user_has_roared: result.user_has_roared,
                  roar_count: result.roar_count 
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error toggling roar:', error);
      toast.error("Failed to roar post");
    }
  }, [isLoggedIn]);

  const handlePostUpdated = useCallback((updatedPost: Partial<CommunityPost>) => {
    setLocalPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  }, []);

  const handleTrade = useCallback((action: 'buy' | 'sell') => {
    const community = communityData?.community;
    if (!community) return;
    
    setTradingModal({
      isOpen: true,
      token: {
        ...tokenData,
        name: community.name,
        avatar: community.image || community.name?.charAt(0) || '🪙',
        image: community.image,
        id: community.id,
        description: community.description
      },
      mode: action
    });
  }, [communityData?.community, tokenData]);

  const handleRewardPoolUtilize = useCallback(() => {
    const daysLeft = Math.ceil((tokenData.rewardPool.unlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    toast.info(`Reward pool tokens are locked for ${daysLeft} more days`, {
      description: "Funds will be available for community voting after the lock period.",
      duration: 5000
    });
  }, [tokenData.rewardPool.unlockDate]);

  // Derived values
  const community = communityData?.community;
  const user = communityData?.user;
  const isAdmin = user?.is_admin || false;
  const hasShares = user?.shares && user.shares > 0;
  const ethToUsd = communityData?.eth_to_usd || 3000;

  // Handle encrypted access
  if (communityEncryptedAccess || postsEncryptedAccess) {
    return <EncryptedCommunityAccess />;
  }

  // Loading state
  if (communityLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (communityError || !community) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Community Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The community you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/communities')}>
            Browse Communities
          </Button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{community.name} Token - Community Tokens</title>
        <meta name="description" content={community.description || `Join the ${community.name} token community`} />
      </Helmet>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Community Token Header */}
        <CommunityTokenHeader 
          community={community}
          user={user}
          tokenData={tokenData}
          onTrade={handleTrade}
          ethToUsd={ethToUsd}
          isMobile={isMobile}
        />

        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Main Content */}
          <div className={`${isMobile ? 'order-1' : 'lg:col-span-2 order-1'}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${isMobile ? 'mb-6 mt-8' : 'mt-4'}`}>
              {/* Enhanced Tabs with Token tab */}
              <CommunityTokenTabs 
                isMobile={isMobile}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAdmin={isAdmin}
              />
              
              {/* Posts Tab */}
              <TabsContent value="posts" className="animate-fade-in mt-0">
                <CommunityPostsFeed 
                  posts={allPosts}
                  loading={postsLoading}
                  hasMore={hasMorePosts}
                  loadingElementRef={loadingElementRef}
                  handleRoar={handleRoar}
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                  onPostUpdated={handlePostUpdated}
                />
              </TabsContent>

              {/* Token Tab - New */}
              <TabsContent value="token" className="animate-fade-in mt-0">
                <CommunityTokenAnalytics 
                  tokenData={tokenData}
                  community={community}
                  onTrade={handleTrade}
                />
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="animate-fade-in mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Token Holders</CardTitle>
                    <CardDescription>
                      {tokenData.holders.toLocaleString()} holders own {tokenData.symbol} tokens
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MembersList 
                      members={members} 
                      loading={membersLoading} 
                      hasMore={hasMoreMembers} 
                      loadMore={loadMoreMembers}
                      ethToUsd={ethToUsd}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enhanced Rewards Tab */}
              <TabsContent value="rewards" className="animate-fade-in mt-0">
                <CommunityTokenRewards 
                  tokenData={tokenData}
                  community={community}
                  onUtilize={handleRewardPoolUtilize}
                  ethToUsd={ethToUsd}
                />
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="animate-fade-in mt-0">
                <CommunityAboutSection 
                  community={community}
                  tokenData={tokenData}
                />
              </TabsContent>

              {/* Admin Tab */}
              {isAdmin && (
                <TabsContent value="admin" className="animate-fade-in mt-0">
                  <CommunityAdminPanel 
                    community={community}
                    onCommunityUpdated={refetch}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right Sidebar - Desktop Only */}
          {!isMobile && (
            <div className="order-2">
              <CommunityTokenRightPane 
                tokenData={tokenData}
                community={community}
                user={user}
                onTrade={handleTrade}
                ethToUsd={ethToUsd}
              />
            </div>
          )}
        </div>
      </div>

      {/* Trading Interface Modal */}
      <TradingInterface
        isOpen={tradingModal.isOpen}
        onClose={() => setTradingModal({ isOpen: false, token: null, mode: 'buy' })}
        token={tradingModal.token}
        mode={tradingModal.mode}
      />
    </div>
  );
};

export default CommunityTokenPage;
