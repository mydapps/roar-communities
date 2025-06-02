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
  Ban
} from 'lucide-react';
import { TradeSheet } from '@/components/shares/TradeSheet';
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

// Import the new header component
import CommunityHeader from '@/components/community/CommunityHeader';
// Import the new tabs component
import CommunityTabs from '@/components/community/CommunityTabs'; 
// Import the new posts feed component
import CommunityPostsFeed from '@/components/community/CommunityPostsFeed';
// Import the new rewards section component
import CommunityRewardsSection from '@/components/community/CommunityRewardsSection';
// Import the new about section component
import CommunityAboutSection from '@/components/community/CommunityAboutSection';
// Import the new admin panel component
import CommunityAdminPanel from '@/components/community/CommunityAdminPanel';

const LionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 15C8.5 13.5 10 12 12 12C14 12 15.5 13.5 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8.5 9C8.5 9.82843 7.82843 10.5 7 10.5C6.17157 10.5 5.5 9.82843 5.5 9C5.5 8.17157 6.17157 7.5 7 7.5C7.82843 7.5 8.5 8.17157 8.5 9Z" fill="currentColor"/>
    <path d="M18.5 9C18.5 9.82843 17.8284 10.5 17 10.5C16.1716 10.5 15.5 9.82843 15.5 9C15.5 8.17157 16.1716 7.5 17 7.5C17.8284 7.5 18.5 8.17157 18.5 9Z" fill="currentColor"/>
  </svg>
);

// Development-only logging helper
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development' && false) { // Set to true to enable dev logs when needed
    console.log(`[Community] ${message}`, ...args);
  }
};

const CommunityPage = () => {
  usePreventZoom();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy");
  const [localPosts, setLocalPosts] = useState<Partial<CommunityPost>[]>([]);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [previousHasShares, setPreviousHasShares] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  
  // Check if user is logged in using dapps_user_id
  const isLoggedIn = !!localStorage.getItem('dapps_user_id');
  
  debugLog("CommunityPage rendering, id:", id, "activeTab:", activeTab, "isLoggedIn:", isLoggedIn);
  
  const { data: communityData, loading: communityLoading, error: communityError, refetch } = useCommunityData(id);
  
  debugLog("Community data:", communityData);
  if (communityData?.community?.rewards) {
    debugLog("Community rewards:", communityData.community.rewards);
    debugLog("Available rewards:", communityData.community.rewards.available_rewards);
  }
  
  const { members, loading: membersLoading, hasMore: hasMoreMembers, loadMore: loadMoreMembers } = useCommunityMembers(id);
  
  const { posts, loading: postsLoading, error: postsError, hasMore: hasMorePosts, loadMore: loadMorePosts, loadingElementRef, fetchPosts } = useCommunityPosts(id);
  
  const allPosts = useMemo(() => {
    const combined = [...localPosts, ...posts];
    const uniquePostCodes = new Set<string>();
    return combined
      .filter(post => {
        if (!post.code || uniquePostCodes.has(post.code)) {
          return false;
        }
        uniquePostCodes.add(post.code);
        return true;
      })
      .sort((a, b) => {
        const aIsPinned = a.pinned === 1;
        const bIsPinned = b.pinned === 1;
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        // Add secondary sort by date if available (e.g., by post.created_on_timestamp)
        // Assuming posts are already somewhat sorted by time from the API for simplicity here
        return 0; 
      });
  }, [localPosts, posts]);
  
  // --- Data Extraction (safe to do early, handle potential undefined) ---
  const community = communityData?.community;
  const user = communityData?.user;
  const details = community?.details;
  const bannerUrl = details?.banner;
  const communityRules = details?.rules;
  const minSharePosting = details?.min_share_posting ?? 0.001;
  const minShareCommenting = details?.min_share_commenting ?? 0.001;
  const minShareReward = details?.min_share_reward;
  const availableRewards = community?.rewards?.available_rewards || 0;
  const hasLastDistributed = community?.rewards?.last_distributed && community.rewards.last_distributed !== null;
  const rewardFees = community?.fees?.reward_fees;
  const priceChange = community?.prices?.price_change_percent || 0;
  const ethToUsd = community?.prices?.buy_price_usd && community?.prices?.buy_price
    ? community.prices.buy_price_usd / community.prices.buy_price
    : 2500;
  
  // --- Hooks dependent on fetched data (Must be called unconditionally) ---
  const communityMetadata = useMemo(() => {
    if (!community) {
      return { 
        title: 'Community | dapps.co - decentralized community network',
        description: 'Join communities on dapps.co. Invest in communities like stocks, earn from your content, speak without fear. The social platform where users capture the value they create.',
        imageUrl: 'https://dapps.co/og-community-image.png',
        url: window.location.href,
        priceInfo: ''
      };
    }
    
    const title = `${community.name} Community | dapps.co - decentralized community network`;
    
    // Create a more descriptive description with community stats
    const memberCount = community.members_count || 0;
    const priceInfo = community.prices?.buy_price 
      ? ` Current share price: ${community.prices.buy_price} ETH ($${community.prices.buy_price_usd?.toFixed(2) || '0.00'}).`
      : '';
    
    const description = community.description 
      ? `${community.description} Join ${memberCount} members in the ${community.name} community on dapps.co.${priceInfo} Invest in communities like stocks, earn from your participation.`
      : `Join the ${community.name} community on dapps.co with ${memberCount} members. Invest in communities like stocks, earn from your participation, speak without fear.${priceInfo}`;
    
    // Use community image with fallback to default community OG image
    const imageUrl = community.image || 'https://dapps.co/og-community-image.png';
    
    // Create clean URL slug from community name
    const communitySlug = community.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const url = `https://dapps.co/c/${communitySlug}`;
    
    const priceInfoDetail = community.prices 
      ? `Current price: ${community.prices.buy_price} ETH ($${community.prices.buy_price_usd?.toFixed(2) || '0.00'})` 
      : '';
    
    return { title, description, imageUrl, url, priceInfo: priceInfoDetail };
  }, [community]);
  
  const helmetContent = (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{communityMetadata.title}</title>
      <meta name="title" content={communityMetadata.title} />
      <meta name="description" content={communityMetadata.description} />
      <meta name="keywords" content={`${community?.name || 'community'}, crypto community, social investing, community shares, dapps.co, web3, blockchain, decentralized social`} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={communityMetadata.url} />
      <meta property="og:title" content={communityMetadata.title} />
      <meta property="og:description" content={communityMetadata.description} />
      <meta property="og:image" content={communityMetadata.imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="dapps.co" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={communityMetadata.url} />
      <meta property="twitter:title" content={communityMetadata.title} />
      <meta property="twitter:description" content={communityMetadata.description} />
      <meta property="twitter:image" content={communityMetadata.imageUrl} />
      <meta property="twitter:site" content="@dapps_co" />
      <meta property="twitter:creator" content="@dapps_co" />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#31bcc3" />
      <meta name="author" content="dapps.co" />
      <link rel="canonical" href={communityMetadata.url} />
      
      {/* Community-specific meta tags */}
      {community?.prices?.buy_price && (
        <meta name="price" content={`${community.prices.buy_price} ETH`} />
      )}
      {community?.members_count && (
        <meta name="members" content={community.members_count.toString()} />
      )}
    </Helmet>
  );
  
  const fetchWalletBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    try {
      const balanceData = await getWalletBalance();
      // getWalletBalance now returns a default value even on auth error
      // so we can just use the data directly
      setUserEthBalance(balanceData.balance.eth);
    } catch (error) {
      // This will only happen for serious errors now, not 401s
      console.error('Failed to fetch wallet balance:', error);
      toast.error("Failed to load wallet balance");
      setUserEthBalance("0.000");
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);
  
  const resetTradeState = useCallback(() => {
    setTradeAction(null);
    setTradeLoading(false);
  }, []);
  
  const handleBuySharesConfirm = useCallback(async (communityName: string, quantity: number) => {
    try {
      setTradeLoading(true);
      setTradeSuccess(false); // Start with success set to false
      const result = await buySharesConfirm(communityName, quantity);
      
      if (result && result.status === 'SUCCESS') {
        toast.success('Successfully purchased shares!');
        fetchWalletBalance();
        
        // IMPORTANT FIX: First set success to true, then set loading to false after delay
        // This ensures proper state sequence for the success screen
        setTradeSuccess(true);
        
        setTimeout(() => {
          setTradeLoading(false);
        }, 300);
        
        // Close the sheet after a longer delay to allow success animation to show
        setTimeout(() => {
          setTradeSheetOpen(false);
          
          // Reset state after modal is closed
          setTimeout(() => {
            setTradeSuccess(false);
            resetTradeState(); // Call the reset function
          }, 300);
        }, 7000); // Extended to 7 seconds for better visibility
      } else {
        // Set loading to false immediately for error cases
        setTradeLoading(false);
        setTradeSuccess(false);
        toast.error(result?.message || 'Failed to purchase shares');
      }
    } catch (error) {
      setTradeLoading(false);
      setTradeSuccess(false);
      toast.error('An error occurred while purchasing shares');
    }
  }, [fetchWalletBalance, resetTradeState]);
  
  const handleSellSharesConfirm = useCallback(async (communityName: string, quantity: number) => {
    try {
      setTradeLoading(true);
      setTradeSuccess(false); // Start with success set to false
      const result = await sellSharesConfirm(communityName, quantity);
      
      if (result && result.status === 'SUCCESS') {
        toast.success('Successfully sold shares!');
        fetchWalletBalance();
        
        // IMPORTANT FIX: First set success to true, then set loading to false after delay
        // This ensures proper state sequence for the success screen
        setTradeSuccess(true);
        
        setTimeout(() => {
          setTradeLoading(false);
        }, 300);
        
        // Close the sheet after a longer delay to allow success animation to show
        setTimeout(() => {
          setTradeSheetOpen(false);
          
          // Reset state after modal is closed
          setTimeout(() => {
            setTradeSuccess(false);
            resetTradeState(); // Call the reset function
          }, 300);
        }, 7000); // Extended to 7 seconds for better visibility
      } else {
        // Set loading to false immediately for error cases
        setTradeLoading(false);
        setTradeSuccess(false);
        toast.error(result?.message || 'Failed to sell shares');
      }
    } catch (error) {
      setTradeLoading(false);
      setTradeSuccess(false);
      toast.error('An error occurred while selling shares');
    }
  }, [fetchWalletBalance, resetTradeState]);
  
  const handleBuyAction = useCallback(() => {
    if (!isLoggedIn) {
      navigate('/index');
      return;
    }
    
    // Close sheet first to reset its state
    setTradeSheetOpen(false);
    
    // Then after a small delay, set new values and open it
    setTimeout(() => {
      resetTradeState();
      setTradeAction('buy');
      setTradeSheetOpen(true);
      // Fetch fresh balance when opening the modal
      fetchWalletBalance();
    }, 50);
  }, [isLoggedIn, navigate, resetTradeState, fetchWalletBalance]);
  
  const handleSellAction = useCallback(() => {
    if (!isLoggedIn) {
      navigate('/index');
      return;
    }
    
    // Close sheet first to reset its state
    setTradeSheetOpen(false);
    
    // Then after a small delay, set new values and open it
    setTimeout(() => {
      resetTradeState();
      setTradeAction('sell');
      setTradeSheetOpen(true);
    }, 50);
  }, [isLoggedIn, navigate, resetTradeState]);
  
  const handleRoar = useCallback(async (postCode: string) => {
    if (!postCode) {
      console.error("Cannot roar post: missing postCode");
      toast.error("Unable to update post. Missing identifier.");
      return;
    }
    
    try {
      const success = await toggleRoar(postCode);
      if (!success) {
        toast.error("Failed to update post. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling roar:", error);
      toast.error("Error updating post. Please try again.");
    }
  }, []);
  
  const handlePostCreated = (newPost: Partial<CommunityPost>) => {
    // Add to localPosts, or refetch posts if pinned status might change order significantly
    setLocalPosts(prev => [newPost, ...prev]);
    // Optionally, if new posts could be pinned by default or affect pinned sorting:
    // refetchPosts(); 
  };

  const handlePostUpdated = (postCode: string, newPinnedStatus: boolean) => {
    const updateAndSortPosts = (postsList: Partial<CommunityPost>[]) => 
      postsList.map(p => 
        p.code === postCode ? { ...p, pinned: newPinnedStatus ? 1 : 0 } : p // Ensure pinned is 0 or 1
      // Sorting is now handled by useMemo for allPosts
      );

    setLocalPosts(prevLocalPosts => updateAndSortPosts(prevLocalPosts));
    if (fetchPosts) {
        fetchPosts(1); // Call fetchPosts(1) to refetch and re-sort
    }
  };
  
  // Prepare initial data for admin panel - MOVED UP
  const defaultRulesText = useMemo(() => `• Be respectful to all members and maintain a professional tone
• No spam, excessive self-promotion, or plagiarism
• Content should be relevant to ${community?.name || id}
• Provide evidence and sources for technical claims when possible
• Abide by the community guidelines for posting and commenting`, [community?.name, id]);

  const initialAdminData = useMemo(() => ({
    image: community?.image || '',
    banner: bannerUrl || '',
    rules: communityRules || defaultRulesText,
    min_share_posting: minSharePosting,
    min_share_commenting: minShareCommenting,
    min_share_reward: minShareReward ?? 1,
  }), [
    community?.image, 
    bannerUrl, 
    communityRules, 
    defaultRulesText, 
    minSharePosting, 
    minShareCommenting, 
    minShareReward
  ]);
  
  // --- Other State & Effects --- 
  useEffect(() => {
    setLocalPosts([]);
    fetchWalletBalance();
  }, [id, fetchWalletBalance]);
  
  useEffect(() => {
    if (user) {
      setPreviousHasShares(user.shares > 0);
    }
  }, [user]);
  
  const hasShares = user ? user.shares > 0 : previousHasShares;
  const isAdmin = user?.is_admin === true;
  
  // --- Loading & Error States (NOW hooks are called before this) ---
  if (communityLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        {helmetContent}
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading community data...</p>
        </div>
      </div>
    );
  }
  
  if (communityError) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        {helmetContent}
        <div className="text-center max-w-md mx-auto">
          <p className="text-destructive text-lg">Error loading community</p>
          <p className="mt-2 text-muted-foreground">{communityError}</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  console.log('[CommunityPage] Rendering with activeTab:', activeTab); // DEBUG: Check active tab state
  
  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-10">
      {helmetContent}
      
      {/* Render the new CommunityHeader component */} 
        {isMobile && (
          <CommunityHeader 
            isMobile={isMobile}
            community={community}
            user={user}
            hasShares={hasShares}
            priceChange={priceChange}
            bannerUrl={bannerUrl}
            handleBuyAction={handleBuyAction}
            handleSellAction={handleSellAction}
            id={id}
            ethToUsd={ethToUsd}
            availableRewards={availableRewards}
          />
      )}
      
    <div className="flex flex-col md:flex-row gap-4 animate-fade-in max-w-full overflow-x-hidden pt-4 md:pt-0">
      <div className="flex-1 order-2 md:order-1">
        {/* Remove the Mobile sticky header - it's now in CommunityHeader */}
        {/* {isMobile && ( ... old header code ... )} */}
        
        {/* Only show Create Post Card for logged in users */}
        {isLoggedIn && (
          <Card className="mb-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 mt-6 md:mt-8">
            <CardContent className={`pt-6 ${isMobile ? 'mt-12' : ''}`}>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What's on your mind?
              </h2>
              <CreatePostCard 
                onPostCreated={handlePostCreated}
                communityName={community?.name || id || ''}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Use the new CommunityTabs component within the main Tabs wrapper */} 
        <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${isMobile ? 'mb-6 mt-8' : ''}`}>
            {/* Render the extracted Tabs List component */} 
            <CommunityTabs 
              isMobile={isMobile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isAdmin={isAdmin}
            />
            
             {/* Replace inline posts rendering with CommunityPostsFeed component */} 
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
            <TabsContent value="members" className="animate-fade-in mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Community Members</CardTitle>
                  <CardDescription>
                    {community?.members_count || 0} members have purchased shares in this community
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
            <TabsContent value="rewards" className="animate-fade-in mt-0">
                <CommunityRewardsSection 
                  availableRewards={availableRewards}
                    ethToUsd={ethToUsd}
                  minShareReward={minShareReward}
                  hasLastDistributed={hasLastDistributed}
                  rewardFees={rewardFees}
                  />
            </TabsContent>
            <TabsContent value="about" className="animate-fade-in mt-0">
                <CommunityAboutSection 
                  community={community} // Pass the whole community object (or relevant parts)
                  id={id}
                  minSharePosting={minSharePosting}
                  minShareCommenting={minShareCommenting}
                  communityRules={communityRules}
                />
            </TabsContent>
            {isAdmin && (
              <TabsContent value="admin" className="animate-fade-in mt-0">
                  <CommunityAdminPanel 
                    communityName={community?.name || id || ''}
                    initialData={initialAdminData}
                    refetchCommunityData={refetch} // Pass the refetch function from useCommunityData
                    ethToUsd={ethToUsd}
                  />
              </TabsContent>
            )}
          </Tabs>
      </div>
      
      {/* Desktop Sidebar (Header only now) */} 
      {!isMobile && (
        <div className="w-full md:w-80 order-1 md:order-2 flex-shrink-0">
          <CommunityHeader 
            isMobile={isMobile}
            community={community}
            user={user}
            hasShares={hasShares}
            priceChange={priceChange}
            bannerUrl={bannerUrl}
            handleBuyAction={handleBuyAction}
            handleSellAction={handleSellAction}
            id={id}
            ethToUsd={ethToUsd}
            availableRewards={availableRewards}
          />
          {/* Removed the old Desktop Tabs Navigation Card */}
              </div>
                  )}
                </div>
      
      {/* Keep TradeSheet */}
      <TradeSheet
        open={tradeSheetOpen}
        onOpenChange={setTradeSheetOpen}
        community={{
          community: community?.name || id || '',
          shares: user?.shares || 0,
          image: community?.image || '',
          currentPrice: {
            eth: community?.prices?.buy_price || 0.001,
            usd: (community?.prices?.buy_price_usd || (community?.prices?.buy_price ? community.prices.buy_price * ethToUsd : 2.5))
          },
          value: {
            eth: user?.share_value?.eth || 0,
            usd: user?.share_value?.usd || 0
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
    </div>
  );
};

export default CommunityPage;
