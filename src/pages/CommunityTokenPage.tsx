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
import TokenHoldersList from '@/components/community-tokens/TokenHoldersList';
import { useCommunityPosts, CommunityPost } from '@/hooks/useCommunityPosts';
import { toggleRoar } from '@/utils/api';
import { getWalletBalance } from '@/utils/communityApi';
import { buySharesConfirm, sellSharesConfirm } from '@/utils/api';
import { 
  getCommunityNameFromTicker, 
  getTokenStatus, 
  getPriceChange, 
  getRewardPool,
  getUserHoldings,
  getVolumeAnalysis,
  getRecentTrades,
  getPriceHistory,
  TokenStatus,
  PriceChangeResponse,
  RewardPoolResponse,
  UserHoldingsResponse,
  VolumeAnalysisResponse,
  RecentTradesResponse,
  PriceHistoryResponse
} from '@/utils/communityTokensApi';
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

// Real token data interface
interface RealTokenData {
  symbol: string;
  name: string;
  givenName: string;
  currentPrice: number;
  currentPriceUsd: number;
  priceChange24h: number;
  marketCap: number;
  marketCapUsd: number;
  volume24h: number;
  holders: number;
  totalSupply: number;
  status: 'incubation' | 'graduated';
  timeLeft: number;
  timeRemaining: number;
  flatEtherCollection: number;
  rewardPool: {
    address: string;
    ethBalance: number;
    tokenBalance: number;
    ethBalanceUsd: number;
    tokenValueUsd: number;
    totalValueUsd: number;
  };
  userBalance: number;
  graduated: boolean;
  createdOn: string;
  admin: string; // Community admin address
  buyPressure: number; // Buy percentage from volume analysis
  tokenAddress: string; // Smart contract address
  hookAddress?: string; // Uniswap V4 hook address (for graduated tokens)
  volumeAnalysis?: {
    buyVolumeEth: number;
    sellVolumeEth: number;
    totalVolumeEth: number;
    buyVolumeUsd: number;
    sellVolumeUsd: number;
    totalVolumeUsd: number;
    buyPercentage: number;
    sellPercentage: number;
    buyCount: number;
    sellCount: number;
    totalTrades: number;
  };
}

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
  
  // Real token data states
  const [tokenData, setTokenData] = useState<RealTokenData | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState<string>('');
  
  // Check if user is logged in using dapps_user_id
  const isLoggedIn = !!localStorage.getItem('dapps_user_id');
  
  debugLog("CommunityTokenPage rendering, id:", id, "activeTab:", activeTab, "isLoggedIn:", isLoggedIn);
  
  const { data: communityData, loading: communityLoading, error: communityError, isEncryptedAccess: communityEncryptedAccess, refetch } = useCommunityData(communityName || undefined);
  
  // Fetch real token data
  const fetchTokenData = useCallback(async (ticker: string) => {
    if (!ticker) return;
    
    setTokenLoading(true);
    setTokenError(null);
    
    try {
      // Make all API calls in parallel for better performance
      const [
        nameResponse,
        statusResponse,
        priceChangeResponse,
        rewardPoolResponse,
        holdingsResponse,
        volumeAnalysisResponse
      ] = await Promise.all([
        getCommunityNameFromTicker(ticker),
        getTokenStatus(ticker),
        getPriceChange(ticker),
        getRewardPool(ticker),
        isLoggedIn ? getUserHoldings({ search: ticker }) : Promise.resolve({ success: false }),
        getVolumeAnalysis(ticker, '24h')
      ]);

      // Process community name
      if (nameResponse.success && nameResponse.data) {
        setCommunityName(nameResponse.data.name);
      }
      
      // Process token status
      if (!statusResponse.success || !statusResponse.data) {
        throw new Error(statusResponse.error || 'Failed to fetch token status');
      }
      const tokenStatus = statusResponse.data;
      
      // Process price change data
      let priceChange24h = 0;
      console.log('🔍 Price change response for', ticker, ':', priceChangeResponse);
      if (priceChangeResponse.success && priceChangeResponse.data?.price_changes?.['24h']) {
        const change24h = priceChangeResponse.data.price_changes['24h'];
        console.log('📊 24h price change data:', change24h);
        priceChange24h = Math.abs(change24h.change_percent_usd || 0) > Math.abs(change24h.change_percent_eth || 0) 
          ? change24h.change_percent_usd || 0
          : change24h.change_percent_eth || 0;
        console.log('💹 Final priceChange24h:', priceChange24h);
      } else {
        console.log('❌ No price change data available for', ticker);
      }
      
      // Process reward pool data
      let rewardPoolData = {
        address: '',
        ethBalance: 0,
        tokenBalance: 0,
        ethBalanceUsd: 0,
        tokenValueUsd: 0,
        totalValueUsd: 0,
      };
      
      if (rewardPoolResponse.success && rewardPoolResponse.data) {
        const pool = rewardPoolResponse.data.rewardPool;
        rewardPoolData = {
          address: pool.address,
          ethBalance: Number(pool.ethBalance) || 0,
          tokenBalance: Number(pool.tokenBalance) || 0,
          ethBalanceUsd: Number(pool.ethBalanceUsd) || 0,
          tokenValueUsd: Number(pool.tokenValueUsd) || 0,
          totalValueUsd: Number(pool.totalValueUsd) || 0,
        };
      }
      
      // Process user holdings
      let userBalance = 0;
      if (isLoggedIn && holdingsResponse.success && holdingsResponse.data?.holdings) {
        const holding = holdingsResponse.data.holdings.find(h => h.ticker === ticker);
        userBalance = holding?.balance || 0;
      }
      
      // Process volume analysis
      let buyPressure = 50; // Default 50% if no data
      let volumeAnalysisData = null;
      if (volumeAnalysisResponse.success && volumeAnalysisResponse.data) {
        buyPressure = volumeAnalysisResponse.data.buy_percentage;
        volumeAnalysisData = {
          buyVolumeEth: volumeAnalysisResponse.data.buy_volume_eth,
          sellVolumeEth: volumeAnalysisResponse.data.sell_volume_eth,
          totalVolumeEth: volumeAnalysisResponse.data.total_volume_eth,
          buyVolumeUsd: volumeAnalysisResponse.data.buy_volume_usd,
          sellVolumeUsd: volumeAnalysisResponse.data.sell_volume_usd,
          totalVolumeUsd: volumeAnalysisResponse.data.total_volume_usd,
          buyPercentage: volumeAnalysisResponse.data.buy_percentage,
          sellPercentage: volumeAnalysisResponse.data.sell_percentage,
          buyCount: volumeAnalysisResponse.data.buy_count,
          sellCount: volumeAnalysisResponse.data.sell_count,
          totalTrades: volumeAnalysisResponse.data.total_trades,
        };
      }
      
      // Use the USD values directly from the API and ensure they are numbers
      const currentPriceUsd = tokenStatus.currentPriceUsd ? Number(tokenStatus.currentPriceUsd) : 0;
      const marketCapUsd = Number(tokenStatus.marketCap) || 0;
      console.log('💰 Token status currentPriceUsd:', tokenStatus.currentPriceUsd, '-> parsed:', currentPriceUsd);
      console.log('💰 Full tokenStatus object:', tokenStatus);
      
      const realTokenData: RealTokenData = {
        symbol: tokenStatus.ticker,
        name: nameResponse.data?.name || tokenStatus.name,
        givenName: nameResponse.data?.givenName || tokenStatus.name,
        currentPrice: Number(tokenStatus.currentRate) || 0,
        currentPriceUsd,
        priceChange24h,
        marketCap: Number(tokenStatus.marketCap) || 0,
        marketCapUsd,
        volume24h: Number(tokenStatus.volume24h) || 0,
        holders: Number(tokenStatus.holders) || 0,
        totalSupply: tokenStatus.totalSupply,
        status: tokenStatus.graduated ? 'graduated' : 'incubation',
        timeLeft: tokenStatus.timeRemaining,
        timeRemaining: tokenStatus.timeRemaining,
        flatEtherCollection: tokenStatus.flatEtherCollection,
        rewardPool: rewardPoolData,
        userBalance,
        graduated: tokenStatus.graduated,
        createdOn: tokenStatus.createdOn,
        admin: tokenStatus.communityAdmin || '',
        buyPressure,
        tokenAddress: tokenStatus.tokenAddress || '',
        hookAddress: tokenStatus.hookAddress,
        volumeAnalysis: volumeAnalysisData,
      };
      
      setTokenData(realTokenData);
      debugLog("Real token data:", realTokenData);
      
    } catch (error) {
      console.error('Error fetching token data:', error);
      setTokenError(error instanceof Error ? error.message : 'Failed to fetch token data');
    } finally {
      setTokenLoading(false);
    }
  }, [isLoggedIn]);
  
  // Fetch token data when ticker is available
  useEffect(() => {
    if (id) {
      fetchTokenData(id);
    }
  }, [id, fetchTokenData]);

  // Fetch ETH balance when logged in
  useEffect(() => {
    const fetchEthBalance = async () => {
      if (isLoggedIn) {
        try {
          setIsLoadingBalance(true);
          const balanceData = await getWalletBalance();
          setUserEthBalance(balanceData.balance.eth);
        } catch (error) {
          console.error('Failed to fetch ETH balance:', error);
        } finally {
          setIsLoadingBalance(false);
        }
      }
    };

    fetchEthBalance();
  }, [isLoggedIn]);
  
  debugLog("Community data:", communityData);
  debugLog("Token data:", tokenData);
  
  const { members, loading: membersLoading, hasMore: hasMoreMembers, loadMore: loadMoreMembers } = useCommunityMembers(communityName || undefined);
  
  // Use ticker directly for posts since API now supports it
  const { posts, loading: postsLoading, error: postsError, hasMore: hasMorePosts, loadMore: loadMorePosts, loadingElementRef, fetchPosts, isEncryptedAccess: postsEncryptedAccess } = useCommunityPosts(id || undefined);
  
  debugLog("Posts loading state:", { postsLoading, posts: posts.length, error: postsError, ticker: id });
  debugLog("useCommunityPosts called with:", id);
  debugLog("Actual posts array:", posts);
  
  const allPosts = useMemo(() => {
    const combinedPosts = [...localPosts, ...posts];
    const uniquePosts = combinedPosts.reduce((acc, post) => {
      // Use code or id as unique identifier
      const postId = post.code || post.id;
      if (postId && !acc.some(p => (p.code || p.id) === postId)) {
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
  
  debugLog("All posts (including local):", allPosts);

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
    if (!tokenData) return;
    
    setTradingModal({
      isOpen: true,
      token: {
        id: parseInt(id || '0'),
        name: tokenData.givenName,
        ticker: tokenData.symbol,
        description: `${tokenData.givenName} community token`,
        avatar: tokenData.symbol.charAt(0),
        status: tokenData.status,
        graduated: tokenData.graduated,
        price: tokenData.currentPriceUsd,
        marketCap: tokenData.marketCapUsd,
        holders: tokenData.holders,
        volume24h: tokenData.volume24h,
        priceChange24h: tokenData.priceChange24h,
        rewardPool: tokenData.rewardPool.totalValueUsd,
        timeLeft: tokenData.timeLeft,
        totalSupply: tokenData.totalSupply,
        userHoldings: tokenData.userBalance,
      },
      mode: action
    });
  }, [tokenData, id]);

  const handleRewardPoolUtilize = useCallback(() => {
    if (!tokenData) return;
    
    toast.info(`Reward pool contains $${Number(tokenData.rewardPool.totalValueUsd || 0).toFixed(2)}`, {
      description: "Funds are managed by the community through DAO governance.",
      duration: 5000
    });
  }, [tokenData]);

  // Derived values
  const community = communityData?.community;
  const user = communityData?.user;
  
  // For community tokens, check if current user handle matches the token admin
  const currentUserHandle = localStorage.getItem('dapps_user_handle');
  const isAdmin = currentUserHandle && tokenData?.admin && currentUserHandle === tokenData.admin;
  const hasShares = tokenData?.userBalance && tokenData.userBalance > 0;
  const ethToUsd = communityData?.eth_to_usd || 3000;

  // Handle encrypted access
  if (communityEncryptedAccess || postsEncryptedAccess) {
    return <EncryptedCommunityAccess />;
  }

  // Loading state - wait for community name to be fetched first
  if (tokenLoading || !communityName || communityLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (communityError || tokenError || !community || !tokenData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Token Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {tokenError || communityError || "The token you're looking for doesn't exist or has been removed."}
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
        <title>{tokenData.givenName} (${tokenData.symbol}) - Community Tokens</title>
        <meta name="description" content={`Trade ${tokenData.givenName} tokens. Current price: $${Number(tokenData.currentPriceUsd || 0).toFixed(6)} | Market Cap: $${(Number(tokenData.marketCapUsd || 0) / 1000000).toFixed(2)}M`} />
      </Helmet>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Community Token Header */}
        <CommunityTokenHeader 
          community={{
            id: tokenData.symbol,
            name: tokenData.givenName,
            image: community?.image,
            description: `${tokenData.givenName} community token`,
          }}
          user={{
            shares: tokenData.userBalance,
            share_value: {
              usd: tokenData.userBalance * tokenData.currentPriceUsd,
              eth: tokenData.userBalance * tokenData.currentPrice,
            }
          }}
          tokenData={{
            symbol: tokenData.symbol,
            name: tokenData.givenName,
            currentPrice: tokenData.currentPrice,
            currentPriceUsd: tokenData.currentPriceUsd,
            priceChange24h: tokenData.priceChange24h,
            marketCap: tokenData.marketCapUsd,
            volume24h: tokenData.volume24h,
            holders: tokenData.holders,
            status: tokenData.status,
            timeLeft: tokenData.timeLeft,
            totalSupply: tokenData.totalSupply,
            circulatingSupply: tokenData.totalSupply, // Use total supply as requested
          }}
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
                {isLoggedIn && (
                  <div className="mb-6">
                    <CreatePostCard 
                      onPostCreated={(newPost) => {
                        setLocalPosts(prev => [newPost, ...prev]);
                      }}
                      communityName={tokenData.symbol}
                    />
                  </div>
                )}
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
                  tokenData={{
                    symbol: tokenData.symbol,
                    name: tokenData.givenName,
                    currentPrice: tokenData.currentPriceUsd,
                    priceChange24h: tokenData.priceChange24h,
                    marketCap: tokenData.marketCapUsd,
                    volume24h: tokenData.volume24h,
                    holders: tokenData.holders,
                    status: tokenData.status,
                    timeLeft: tokenData.timeLeft,
                    totalSupply: tokenData.totalSupply,
                    circulatingSupply: tokenData.totalSupply,
                    buyPressure: tokenData.buyPressure,
                    tokenAddress: tokenData.tokenAddress,
                    volumeAnalysis: tokenData.volumeAnalysis,
                    recentTrades: [], // Will be populated by the component
                    priceHistory: [], // Will be populated by the component
                  }}
                  community={{
                    id: tokenData.symbol,
                    name: tokenData.givenName,
                    image: community?.image,
                    description: `${tokenData.givenName} community token`,
                  }}
                  onTrade={handleTrade}
                />
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="animate-fade-in mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Token Holders</CardTitle>
                    <CardDescription>
                      {tokenData.holders.toLocaleString()} holders own ${tokenData.symbol} tokens
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TokenHoldersList 
                      ticker={tokenData.symbol}
                      tokenSymbol={tokenData.symbol}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enhanced Rewards Tab */}
              <TabsContent value="rewards" className="animate-fade-in mt-0">
                <CommunityTokenRewards 
                  tokenData={{
                    symbol: tokenData.symbol,
                    name: tokenData.givenName,
                    rewardPool: {
                      address: tokenData.rewardPool.address,
                      ethBalance: tokenData.rewardPool.ethBalance,
                      tokenBalance: tokenData.rewardPool.tokenBalance,
                      usdValue: tokenData.rewardPool.totalValueUsd,
                      isLocked: true, // Always locked for 2 days from launch
                      unlockDate: new Date(new Date(tokenData.createdOn).getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days from creation
                    }
                  }}
                  community={{
                    id: tokenData.symbol,
                    name: tokenData.givenName,
                    image: community?.image,
                    description: `${tokenData.givenName} community token`,
                  }}
                  onUtilize={handleRewardPoolUtilize}
                  ethToUsd={ethToUsd}
                />
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="animate-fade-in mt-0">
                <CommunityAboutSection 
                  community={{
                    id: tokenData.symbol,
                    name: tokenData.givenName,
                    image: community?.image,
                    description: `${tokenData.givenName} is a community token with ${tokenData.holders} holders and 1 Billion token supply.`,
                    members_count: tokenData.holders,
                    created_on: tokenData.createdOn,
                    owner: tokenData.admin,
                  }}
                  tokenData={{
                    symbol: tokenData.symbol,
                    name: tokenData.givenName,
                    currentPrice: tokenData.currentPriceUsd,
                    priceChange24h: tokenData.priceChange24h,
                    marketCap: tokenData.marketCapUsd,
                    volume24h: tokenData.volume24h,
                    holders: tokenData.holders,
                    status: tokenData.status,
                    timeLeft: tokenData.timeLeft,
                    totalSupply: tokenData.totalSupply,
                    circulatingSupply: tokenData.totalSupply,
                  }}
                />
              </TabsContent>

              {/* Admin Tab */}
              {isAdmin && (
                <TabsContent value="admin" className="animate-fade-in mt-0">
                  <CommunityAdminPanel 
                    community={{
                      id: tokenData.symbol,
                      name: tokenData.givenName,
                      image: community?.image,
                      description: `${tokenData.givenName} community token`,
                      members_count: tokenData.holders,
                      created_at: tokenData.createdOn,
                    }}
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
                tokenData={{
                  symbol: tokenData.symbol,
                  name: tokenData.givenName,
                  currentPrice: tokenData.currentPrice,
                  currentPriceUsd: tokenData.currentPriceUsd,
                  priceChange24h: tokenData.priceChange24h,
                  marketCap: tokenData.marketCapUsd,
                  volume24h: tokenData.volume24h,
                  holders: tokenData.holders,
                  status: tokenData.status,
                  timeLeft: tokenData.timeLeft,
                  totalSupply: tokenData.totalSupply,
                  circulatingSupply: tokenData.totalSupply,
                  rewardPool: {
                    address: tokenData.rewardPool.address,
                    ethBalance: tokenData.rewardPool.ethBalance,
                    tokenBalance: tokenData.rewardPool.tokenBalance,
                    usdValue: tokenData.rewardPool.totalValueUsd,
                    isLocked: false,
                    unlockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                  },
                  recentTrades: [],
                  priceHistory: []
                }}
                community={{
                  id: tokenData.symbol,
                  name: tokenData.givenName,
                  image: community?.image,
                  description: `${tokenData.givenName} community token`,
                }}
                user={{
                  shares: tokenData.userBalance,
                  share_value: {
                    usd: tokenData.userBalance * tokenData.currentPriceUsd,
                    eth: tokenData.userBalance * tokenData.currentPrice,
                  }
                }}
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
        userEthBalance={userEthBalance}
        onTradeComplete={() => {
          // Refresh token data after trade
          if (id) {
            fetchTokenData(id);
          }
        }}
      />
    </div>
  );
};

export default CommunityTokenPage;
