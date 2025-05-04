import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
  
  debugLog("CommunityPage rendering, id:", id, "activeTab:", activeTab);
  
  const { data: communityData, loading: communityLoading, error: communityError, refetch } = useCommunityData(id);
  
  debugLog("Community data:", communityData);
  if (communityData?.community?.rewards) {
    debugLog("Community rewards:", communityData.community.rewards);
    debugLog("Available rewards:", communityData.community.rewards.available_rewards);
  }
  
  const { members, loading: membersLoading, hasMore: hasMoreMembers, loadMore: loadMoreMembers } = useCommunityMembers(id);
  
  const { posts, loading: postsLoading, hasMore: hasMorePosts, loadMore: loadMorePosts, loadingElementRef } = useCommunityPosts(id);
  
  const allPosts = [...localPosts, ...posts];
  
  const ethToUsd = communityData?.community?.prices?.buy_price_usd && communityData?.community?.prices?.buy_price 
    ? communityData.community.prices.buy_price_usd / communityData.community.prices.buy_price
    : 2500;
  
  const [buyAmount, setBuyAmount] = useState<number>(1);
  
  // Get community and user data early, regardless of loading state
  const community = communityData?.community;
  const user = communityData?.user;
  
  // Fix: More robust check for user shares that defaults to previous state during loading
  const hasShares = user ? user.shares > 0 : previousHasShares;
  const isAdmin = user?.is_admin === true;
  console.log('[CommunityPage] isAdmin:', isAdmin, 'User data:', user); // DEBUG: Check isAdmin value
  
  // Extract details for easier access, provide default values
  const details = community?.details; // Keep as potentially undefined initially
  const minSharePosting = details?.min_share_posting ?? 0.001;
  const minShareCommenting = details?.min_share_commenting ?? 0.001;
  const minShareReward = details?.min_share_reward; // Keep null if not provided
  const communityRules = details?.rules; // Keep null if not provided
  const bannerUrl = details?.banner; // Keep null if not provided
  
  const availableRewards = community?.rewards?.available_rewards || 0;
  console.log("Rendered with available rewards:", availableRewards);
  const hasLastDistributed = community?.rewards?.last_distributed && community.rewards.last_distributed !== null;
  
  // Fix: Prepare metadata for SEO (always initialize, but may return empty values)
  // IMPORTANT: This hook MUST be called in the same position on every render
  const communityMetadata = useMemo(() => {
    if (!community) {
      return { 
        title: 'Community | dapps.co',
        description: 'Join communities on dapps.co. Buy, sell, and discuss with other members.',
        imageUrl: 'https://dapps.co/og-default.jpg',
        url: window.location.href,
        priceInfo: ''
      };
    }
    
    const title = `${community.name} Community | dapps.co`;
    const description = community.description || `Join the ${community.name} community on dapps.co. Buy, sell, and discuss with other members.`;
    const imageUrl = community.image || 'https://dapps.co/og-default.jpg';
    const url = `${window.location.origin}/c/${community.name.toLowerCase().replace(/\s+/g, '-')}`;
    const priceInfo = community.prices 
      ? `Current price: ${community.prices.buy_price} ETH ($${community.prices.buy_price_usd?.toFixed(2) || '0.00'})` 
      : '';
    
    return { title, description, imageUrl, url, priceInfo };
  }, [community]);
  
  // --- Moved helmetContent definition back here ---
  const helmetContent = (
    <Helmet>
      <title>{communityMetadata.title}</title>
      <meta name="description" content={communityMetadata.description} />
      
      {/* OpenGraph Tags */}
      <meta property="og:title" content={communityMetadata.title} />
      <meta property="og:description" content={communityMetadata.description} />
      <meta property="og:image" content={communityMetadata.imageUrl} />
      <meta property="og:url" content={communityMetadata.url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="dapps.co" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={communityMetadata.title} />
      <meta name="twitter:description" content={communityMetadata.description} />
      <meta name="twitter:image" content={communityMetadata.imageUrl} />
      
      {/* Additional Meta Tags */}
      <meta name="keywords" content={`${community?.name || 'community'}, crypto, social, dapps.co`} />
      <meta name="author" content="dapps.co" />
      <link rel="canonical" href={communityMetadata.url} />
    </Helmet>
  );
  
  useEffect(() => {
    setLocalPosts([]);
    fetchWalletBalance();
  }, [id]);
  
  // Store the previousHasShares value when we get valid user data
  useEffect(() => {
    if (communityData?.user) {
      setPreviousHasShares(communityData.user.shares > 0);
    }
  }, [communityData?.user?.shares]);
  
  const handlePostCreated = (newPost: Partial<CommunityPost>) => {
    console.log("New post created:", newPost);
    setLocalPosts(prev => [newPost, ...prev]);
    toast.success("Post created successfully!");
  };
  
  const fetchWalletBalance = async () => {
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
  };
  
  const handleBuySharesConfirm = async (communityName: string, quantity: number) => {
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
            resetTradeState();
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
  };
  
  const handleSellSharesConfirm = async (communityName: string, quantity: number) => {
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
            resetTradeState();
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
  };
  
  // Add a reset function for trade state
  const resetTradeState = () => {
    setTradeAction(null);
    setTradeLoading(false);
  };
  
  // Update the buy and sell actions to reset state first
  const handleBuyAction = () => {
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
  };
  
  const handleSellAction = () => {
    // Close sheet first to reset its state
    setTradeSheetOpen(false);
    
    // Then after a small delay, set new values and open it
    setTimeout(() => {
      resetTradeState();
      setTradeAction('sell');
      setTradeSheetOpen(true);
    }, 50);
  };
  
  const priceChange = communityData?.community?.prices?.price_change_percent || 0;
  
  const chartPoints = priceChange > 0 
    ? "M0,50 Q25,30 50,20 T100,10" 
    : "M0,50 Q25,70 50,80 T100,90";
  
  const handleRoar = async (postCode: string) => {
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
  };
  
  // --- Admin Tab State ---
  const [adminFormState, setAdminFormState] = useState({
    image: '', 
    banner: '', 
    rules: '', 
    min_share_posting: 0.001, 
    min_share_commenting: 0.001, 
    min_share_reward: 1 as number | null, // Default to 1 instead of null
  });
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showMutedList, setShowMutedList] = useState(false);

  // --- Mute/Unmute State (Moved Up) ---
  const [muteSearchQuery, setMuteSearchQuery] = useState("");
  const debouncedMuteSearch = useDebounce(muteSearchQuery, 300);
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResponse['users']['items']>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUserToMute, setSelectedUserToMute] = useState<string | null>(null);
  const [muteReason, setMuteReason] = useState("");
  const [muteDurationHours, setMuteDurationHours] = useState<number>(24);
  const [isMutingUser, setIsMutingUser] = useState(false);
  const [muteError, setMuteError] = useState<string | null>(null);
  
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [mutedUsersPagination, setMutedUsersPagination] = useState<MutedUsersApiResponse['pagination'] | null>(null);
  const [loadingMutedUsers, setLoadingMutedUsers] = useState(false);
  const [mutedUsersError, setMutedUsersError] = useState<string | null>(null);
  const [currentMutedPage, setCurrentMutedPage] = useState(1);
  const [unmutingUserHandle, setUnmutingUserHandle] = useState<string | null>(null); // Track which user is being unmuted

  // --- Mute/Unmute Handlers (Moved Up) ---
  const fetchMutedUsers = useCallback(async (page: number) => {
    if (!community?.name) return;
    setLoadingMutedUsers(true);
    setMutedUsersError(null);
    try {
      const response = await getMutedUsers(community.name, page, 10); // Use smaller limit like 10
      if (response.success) {
        setMutedUsers(response.data);
        setMutedUsersPagination(response.pagination);
        setCurrentMutedPage(response.pagination.page);
      } else {
        throw new Error(response.message || "Failed to fetch muted users.");
      }
    } catch (err: any) {
      console.error("Failed to fetch muted users:", err);
      setMutedUsersError(err.message || "Could not load muted user list.");
      toast.error(err.message || "Could not load muted user list.");
    } finally {
      setLoadingMutedUsers(false);
    }
  }, [community?.name]);

  const handleUserSelect = (handle: string) => {
    setSelectedUserToMute(handle);
    setMuteSearchQuery(handle); // Update input field as well
    setUserSearchResults([]); // Close dropdown
  };

  const handleMuteUser = async () => {
    if (!community?.name || !selectedUserToMute || !muteReason || muteDurationHours <= 0) {
      setMuteError("Please select a user, provide a reason, and set a positive duration.");
      return;
    }
    setIsMutingUser(true);
    setMuteError(null);
    try {
      const response = await muteUserInCommunity(community.name, selectedUserToMute, muteReason, muteDurationHours);
      if (response.success) {
        toast.success(`User ${selectedUserToMute} muted successfully.`);
        // Reset form
        setSelectedUserToMute(null);
        setMuteSearchQuery("");
        setMuteReason("");
        setMuteDurationHours(24);
        fetchMutedUsers(1); // Refresh list to first page
        setShowMutedList(true); // Ensure list is visible
      } else {
        throw new Error(response.message || "Failed to mute user.");
      }
    } catch (err: any) {
      console.error("Failed to mute user:", err);
      const message = err.message || "An error occurred while muting user.";
      setMuteError(message);
      toast.error(message);
    } finally {
      setIsMutingUser(false);
    }
  };

  const handleUnmuteUser = async (userHandle: string) => {
    if (!community?.name) return;
    setUnmutingUserHandle(userHandle); // Set loading state for this specific user
    try {
      const response = await unmuteUserInCommunity(community.name, userHandle);
      if (response.success) {
        toast.success(`User ${userHandle} unmuted successfully.`);
        // Refresh the current page of the list
        fetchMutedUsers(currentMutedPage);
      } else {
        throw new Error(response.message || "Failed to unmute user.");
      }
    } catch (err: any) {
      console.error("Failed to unmute user:", err);
      toast.error(err.message || "Could not unmute user.");
    } finally {
      setUnmutingUserHandle(null); // Clear loading state
    }
  };

  // --- End Mute/Unmute State ---

  // Handle input changes for admin form
  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminFormState(prevState => ({
      ...prevState,
      [name]: name.startsWith('min_share_') ? (value === '' ? null : parseFloat(value)) : value,
    }));
  };

  // Handle image upload for admin
  const handleAdminImageUpload = (media: MediaUploadResponse) => {
    if (media?.url) {
      setAdminFormState(prevState => ({ ...prevState, image: media.url }));
    }
  };

  // Handle banner upload for admin
  const handleAdminBannerUpload = (media: MediaUploadResponse) => {
    if (media?.url) {
      setAdminFormState(prevState => ({ ...prevState, banner: media.url }));
    }
  };

  // Handle saving admin changes
  const handleAdminSave = async () => {
    if (!community?.name) return;
    setIsSavingAdmin(true);
    setAdminError(null);
    
    const changes: Record<string, any> = {};
    if (adminFormState.image !== (community?.image || '')) changes.image = adminFormState.image;
    if (adminFormState.banner !== (bannerUrl || '')) changes.banner = adminFormState.banner;
    if (adminFormState.rules !== (communityRules || '')) changes.rules = adminFormState.rules;
    // Compare with original values fetched (or default for posting/commenting)
    if (adminFormState.min_share_posting !== (details?.min_share_posting ?? 0.001)) changes.min_share_posting = adminFormState.min_share_posting;
    if (adminFormState.min_share_commenting !== (details?.min_share_commenting ?? 0.001)) changes.min_share_commenting = adminFormState.min_share_commenting;
    if (adminFormState.min_share_reward !== (details?.min_share_reward ?? 1)) changes.min_share_reward = adminFormState.min_share_reward; // Compare with default 1

    // Only send description if it exists in the original data and has changed
    // (assuming description isn't directly editable here yet, but the API supports it)
    // if (community?.description && adminFormState.description !== community.description) {
    //   changes.description = adminFormState.description;
    // }

    if (Object.keys(changes).length === 0) {
      toast.info("No changes detected.");
      setIsSavingAdmin(false);
      return;
    }

    try {
      const result = await updateCommunityAdmin(community.name, changes);
      if (result.success) {
        toast.success("Community settings updated successfully!");
        refetch(); // Refetch community data to show updated values
      } else {
        throw new Error(result.message || "Failed to update community settings.");
      }
    } catch (err: any) {
      console.error("Failed to save admin changes:", err);
      const message = err.message || "An error occurred while saving changes.";
      setAdminError(message);
      toast.error(message);
    } finally {
      setIsSavingAdmin(false);
    }
  };
  // --- End Admin Tab State ---
  
  // Effect to initialize/update admin form state when community data loads/changes
  useEffect(() => {
    // Define default rules (copied from About tab)
    const defaultRulesText = `• Be respectful to all members and maintain a professional tone
• No spam, excessive self-promotion, or plagiarism
• Content should be relevant to ${community?.name || id}
• Provide evidence and sources for technical claims when possible
• Abide by the community guidelines for posting and commenting`;

    if (community) {
      setAdminFormState({
        image: community.image || '',
        banner: community.details?.banner || '',
        rules: community.details?.rules || defaultRulesText, // Use default if null/empty
        min_share_posting: community.details?.min_share_posting ?? 0.001,
        min_share_commenting: community.details?.min_share_commenting ?? 0.001,
        min_share_reward: community.details?.min_share_reward ?? 1, // Default to 1
      });
    }
  }, [community, id]); // Depend on community data and id (for default rules text)
  
  // --- Mute/Unmute Effects (Moved Up) ---
  // Effect to fetch muted users when collapsible opens or page changes
  useEffect(() => {
    if (showMutedList && community?.name) {
      fetchMutedUsers(currentMutedPage);
    }
  }, [showMutedList, currentMutedPage, fetchMutedUsers, community?.name]);

  // Handle User Search for Muting
  useEffect(() => {
    const search = async () => {
      if (debouncedMuteSearch.trim().length < 2) {
        setUserSearchResults([]);
        setIsSearchingUsers(false)
        return;
      }
      setIsSearchingUsers(true);
      try {
        const response = await searchUsers(debouncedMuteSearch, 1, 5);
        if (response.success && response.users) {
          setUserSearchResults(response.users.items || []);
        } else {
          setUserSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    };
    search();
  }, [debouncedMuteSearch]);
  // --- End Mute/Unmute Effects ---
  
  // Loading state with Helmet included to maintain hook order
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
  
  // Error state with Helmet included to maintain hook order
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
      {/* SEO Metadata - always render the Helmet, content changes based on community data */}
      {helmetContent}
      
    <div className="flex flex-col md:flex-row gap-4 animate-fade-in max-w-full overflow-x-hidden pt-4 md:pt-0">
      <div className="flex-1 order-2 md:order-1">
        {isMobile && (
          <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-3 mb-3 border-b pt-4">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={community?.image} alt={community?.name} />
                <AvatarFallback>{community?.name ? community.name[0].toUpperCase() : id?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{community?.name || id}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-background/80 text-xs flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {community?.members_count || 0}
                  </Badge>
                  {priceChange > 0 ? (
                    <Badge className="bg-green-500/10 text-green-600 text-xs">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      {priceChange.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600 text-xs">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      {Math.abs(priceChange).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
              {isMobile && (
                hasShares ? (
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex-shrink-0"
                      onClick={() => {
                        setTradeAction("buy");
                        setTradeSheetOpen(true);
                      }}
                    >
                      Buy
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="shadow-sm flex-shrink-0"
                      onClick={() => {
                        setTradeAction("sell");
                        setTradeSheetOpen(true);
                      }}
                    >
                      Sell
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm"
                    variant="default"
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex-shrink-0"
                    onClick={() => {
                      setTradeAction("buy");
                      setTradeSheetOpen(true);
                    }}
                  >
                    Join
                  </Button>
                )
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Share Price</div>
                <div className="font-semibold text-sm flex items-center">
                  ${community?.prices?.buy_price_usd?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Liquidity</div>
                <div className="font-semibold text-sm flex items-center">
                  ${community?.market_cap?.usd >= 1000000 
                    ? (community.market_cap.usd / 1000000).toFixed(1) + 'M' 
                    : community?.market_cap?.usd?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                </div>
              </div>
            </div>
          </div>
        )}
        
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
        
        {isMobile && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6 mt-8">
              <div className="relative overflow-x-auto pb-4 no-scrollbar tab-container">
                <TabsList className="inline-flex w-auto min-w-full justify-center whitespace-nowrap bg-muted/50 p-1.5 gap-2">
                  <TabsTrigger value="posts" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Posts
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="admin" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Admin
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="members" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
                    <Users className="h-4 w-4 mr-1" />
                    Members
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Rewards
                  </TabsTrigger>
                  <TabsTrigger value="about" className="flex-shrink-0 data-[state=active]:bg-background flex items-center py-3 px-4 mobile-friendly-tap">
                    <Info className="h-4 w-4 mr-1" />
                    About
                  </TabsTrigger>
                </TabsList>
              </div>
            
            <TabsContent value="posts" className="animate-fade-in mt-0">
              <div className="space-y-6">
                {postsLoading && allPosts.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allPosts.length > 0 ? (
                  <>
                    {allPosts.map((post, index) => (
                      <Post 
                        key={`post-${post.code || index}-${index}`}
                        username={post.handle || ''}
                        community={post.community || ''}
                        timeAgo={post.timeAgo || ''}
                          content={post.is_mirror === 1 ? (post.mirror_quote || '') : (post.body || '')}
                        roarCount={post.upvotes || 0}
                        commentCount={post.reply_count || 0}
                        shareCount={post.engagement || 0}
                        images={post.multiple_images ? post.images || [] : (post.image ? [post.image_url || ''] : [])}
                        video={undefined}
                        postCode={post.code || ''}
                        avatar={post.avatar || ''}
                        roared={post.roar === 1}
                        onRoar={() => post.code ? handleRoar(post.code) : null}
                        isMirror={post.is_mirror === 1}
                          mirrorData={post.is_mirror === 1 ? {
                            quote: post.mirror_quote || '',
                            originalAuthor: post.original_author || '',
                            originalCommunity: post.original_community || '',
                            originalBody: post.original_body || '',
                            originalTimeAgo: post.original_created_on || '',
                            originalAvatar: post.original_author_avatar || '',
                            originalImages: post.original_images || [],
                            originalTitle: post.original_title || '',
                            originalPostCode: post.original_post_code || ''
                          } : undefined}
                        ipfs={post.code || ''}
                        isLoggedIn={!!localStorage.getItem('dapps_user_id')}
                        hideComments={false}
                      />
                    ))}
                    
                    <div 
                      ref={loadingElementRef}
                      className="flex justify-center py-8 my-4"
                      id="infinite-scroll-marker"
                    >
                      {postsLoading && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      )}
                      
                      {!postsLoading && !hasMorePosts && posts.length > 0 && (
                        <p className="text-sm text-muted-foreground">You've reached the end</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">No posts in this community yet. Be the first to post!</p>
                  </div>
                )}
              </div>
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
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Rewards</CardTitle>
                  <CardDescription>
                    The community reward pool is distributed monthly to the top posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20 shadow-sm relative overflow-hidden animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-primary">Current Reward Pool</span>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {availableRewards.toFixed(5) || '0.00000'} ETH
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${(availableRewards * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/40 p-4 rounded-lg">
                      <h3 className="font-medium mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        How Rewards Work
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                        <li>{community?.fees?.reward_fees || 2}% of all buy/sell transactions go to the reward pool</li>
                        <li>Rewards are distributed on the last day of each month</li>
                        <li>60% goes to the top 3 most roared posts</li>
                        <li>40% is split among the next 7 top posts</li>
                        <li>
                          {minShareReward !== null 
                            ? `You must hold at least ${minShareReward} shares to be eligible for rewards`
                            : `You must hold at least 5 shares to be eligible for rewards`}
                        </li>
                      </ul>
                    </div>
                    
                    {hasLastDistributed && (
                      <div>
                        <h3 className="font-medium mb-3">Last Month's Winners</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">
                                1
                              </div>
                              <div>
                                <div className="font-medium">alice.eth</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">"The future of layer 2 solutions is here..."</div>
                              </div>
                            </div>
                            <div className="font-bold">0.45 ETH</div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">
                                2
                              </div>
                              <div>
                                <div className="font-medium">bob.lens</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">"Here's my analysis of the recent EIP..."</div>
                              </div>
                            </div>
                            <div className="font-bold">0.32 ETH</div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg border border-border shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/5 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">
                                3
                              </div>
                              <div>
                                <div className="font-medium">charlie.sol</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">"I created this tutorial for beginners..."</div>
                              </div>
                            </div>
                            <div className="font-bold">0.18 ETH</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="about" className="animate-fade-in mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>About {community?.name || id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Community Description</h3>
                    <p className="text-muted-foreground">{community?.description || 'No description available.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created On</span>
                          <span>{community?.created_on ? new Date(community.created_on).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin</span>
                          <span>{community?.owner ? `${community.owner.substring(0, 6)}...${community.owner.substring(community.owner.length - 4)}` : 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Members</span>
                          <span>{community?.members_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Shares</span>
                          <span>{community?.shares?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Shares Posting</span>
                          <span>{minSharePosting}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Shares Commenting</span>
                          <span>{minShareCommenting}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Fee Structure</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin Fee</span>
                          <span>{community?.fees?.admin_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reward Pool</span>
                          <span>{community?.fees?.reward_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee</span>
                          <span>{community?.fees?.platform_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Share Price</span>
                          <span>{community?.prices?.buy_price?.toFixed(6) || 0} ETH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Community Rules</h3>
                    {communityRules ? (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{communityRules}</div>
                    ) : (
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                        <li>Be respectful to all members and maintain a professional tone</li>
                        <li>No spam, excessive self-promotion, or plagiarism</li>
                        <li>Content should be relevant to {community?.name || id}</li>
                        <li>Provide evidence and sources for technical claims when possible</li>
                        <li>Abide by the community guidelines for posting and commenting</li>
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* ADMIN TAB CONTENT (Mobile) */}
            {isAdmin && (
              <TabsContent value="admin" className="animate-fade-in mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Panel</CardTitle>
                    <CardDescription>Manage community settings and members.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Mock Admin Earnings */}
                    <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg">Admin Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">0.123 ETH</span>
                          <Button variant="secondary" size="sm">Withdraw</Button>
                        </div>
                        <p className="text-sm opacity-80 mt-1">Available earnings from admin fees.</p>
                        <p className="text-xs opacity-60 mt-1">Already withdrawn: 0.05 ETH</p> { /* ADDED Mock */}
                      </CardContent>
                    </Card>

                    {/* Image & Banner */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Visuals</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Community Image */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Community Image</label>
                          {adminFormState.image && <img src={adminFormState.image} alt="Community" className="h-20 w-20 rounded-md object-cover border" />}
                          <MediaUpload
                            onMediaUploaded={handleAdminImageUpload}
                            disabled={isSavingAdmin}
                            acceptedTypes="image"
                            maxFiles={1}
                          >
                            <Button variant="outline" size="sm" className="gap-2">
                              <UploadCloud className="h-4 w-4" />
                              {adminFormState.image ? 'Change Image' : 'Upload Image'}
                            </Button>
                          </MediaUpload>
                        </div>
                        {/* Community Banner */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Community Banner</label>
                          {adminFormState.banner && <img src={adminFormState.banner} alt="Banner" className="h-20 w-full rounded-md object-cover border" />}
                          <MediaUpload
                            onMediaUploaded={handleAdminBannerUpload}
                            disabled={isSavingAdmin}
                            acceptedTypes="image"
                            maxFiles={1}
                          >
                            <Button variant="outline" size="sm" className="gap-2">
                              <UploadCloud className="h-4 w-4" />
                              {adminFormState.banner ? 'Change Banner' : 'Upload Banner'}
                            </Button>
                          </MediaUpload>
                        </div>
                      </div>
                    </div>

                    {/* Rules */}
                    <div className="space-y-2">
                      <label htmlFor="admin-rules" className="text-sm font-medium">Community Rules</label>
                      <Textarea 
                        id="admin-rules"
                        name="rules"
                        value={adminFormState.rules}
                        onChange={handleAdminInputChange}
                        placeholder="Enter community rules here..."
                        className="min-h-[150px]"
                        disabled={isSavingAdmin}
                      />
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Interaction Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label htmlFor="min_share_posting" className="text-xs font-medium">Min Shares Posting</label>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  Min shares required to create a post in this community.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="min_share_posting"
                            name="min_share_posting"
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={adminFormState.min_share_posting ?? ''} 
                            onChange={handleAdminInputChange}
                            placeholder="e.g., 0.001"
                            disabled={isSavingAdmin}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label htmlFor="min_share_commenting" className="text-xs font-medium">Min Shares Commenting</label>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  Min shares required to reply/comment on posts.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="min_share_commenting"
                            name="min_share_commenting"
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={adminFormState.min_share_commenting ?? ''}
                            onChange={handleAdminInputChange}
                            placeholder="e.g., 0.001"
                            disabled={isSavingAdmin}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label htmlFor="min_share_reward" className="text-xs font-medium">Min Shares Reward</label>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  Min shares required to be eligible for monthly reward distributions.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="min_share_reward"
                            name="min_share_reward"
                            type="number"
                            step="1"
                            min="0.001"
                            value={adminFormState.min_share_reward ?? ''}
                            onChange={handleAdminInputChange}
                            placeholder="e.g., 1"
                            disabled={isSavingAdmin}
                          />
                        </div>
                      </div>
                    </div>

                    {/* --- Mock Mute User Section RESTORED --- */}
                    <Collapsible open={showMutedList} onOpenChange={setShowMutedList}>
                      <Card className="bg-muted/30 border border-border/40">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Mute Users</CardTitle>
                            <CardDescription className="text-xs pt-1">Search for users and prevent them from posting or commenting.</CardDescription>
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-auto flex-shrink-0">
                              <List className="h-4 w-4 mr-1" />
                              {showMutedList ? 'Hide List' : 'Show List'}
                            </Button>
                          </CollapsibleTrigger>
                        </CardHeader>
                        <CardContent className="pt-4 pb-4 space-y-6">
                          {/* Mute Form */}
                          <div className="space-y-3 p-4 border rounded-lg bg-background">
                            <h4 className="text-sm font-medium">Mute a User</h4>
                            {/* User Search Input with Popover Dropdown */}
                            <Popover open={userSearchResults.length > 0 && muteSearchQuery.length > 1} >
                              <PopoverTrigger asChild>
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input 
                                    placeholder="Search user handle..." 
                                    value={muteSearchQuery}
                                    onChange={(e) => { 
                                      setMuteSearchQuery(e.target.value);
                                      setSelectedUserToMute(null); // Clear selection when typing
                                    }}
                                    className="pl-8"
                                  />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command shouldFilter={false}> {/* We handle filtering via API */}
                                  <CommandList>
                                    {isSearchingUsers && <CommandEmpty>Searching...</CommandEmpty>}
                                    {!isSearchingUsers && userSearchResults.length === 0 && debouncedMuteSearch.length > 1 && (
                                      <CommandEmpty>No users found.</CommandEmpty>
                                    )}
                                    <CommandGroup heading="Suggestions">
                                      {userSearchResults.map((user) => (
                                        <CommandItem 
                                          key={user.id}
                                          value={user.handle} // Required for Command
                                          onSelect={() => handleUserSelect(user.handle)}
                                          className="flex items-center gap-2"
                                        >
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={user.avatar_url} alt={user.handle} />
                                            <AvatarFallback>{user.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                          <span>{user.handle}</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {selectedUserToMute && (
                              <Badge variant="secondary">Selected: {selectedUserToMute}</Badge>
                            )}

                            {/* Mute Reason */}
                            <Textarea 
                              placeholder="Reason for muting..." 
                              value={muteReason}
                              onChange={(e) => setMuteReason(e.target.value)}
                              className="min-h-[60px]"
                              disabled={isMutingUser}
                            />

                            {/* Mute Duration */}
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                placeholder="Duration" 
                                value={muteDurationHours}
                                onChange={(e) => setMuteDurationHours(parseInt(e.target.value) || 0)}
                                className="w-24"
                                min="1"
                                disabled={isMutingUser}
                              />
                              <span className="text-sm text-muted-foreground">hours</span>
                            </div>

                            {/* Mute Button */}
                            <Button 
                              variant="destructive" 
                              className="w-full gap-2" 
                              onClick={handleMuteUser}
                              disabled={isMutingUser || !selectedUserToMute || !muteReason || muteDurationHours <= 0}
                            >
                              {isMutingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                              Mute {selectedUserToMute || 'User'}
                            </Button>
                            {muteError && (
                              <Alert variant="destructive" className="mt-2 py-1 px-3 text-xs">
                                <AlertDescription>{muteError}</AlertDescription>
                              </Alert>
                            )}
                          </div>

                          {/* Muted Users List Section */}
                          <CollapsibleContent className="space-y-4 animate-collapsible-down border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium">Currently Muted Users</h4>
                            {loadingMutedUsers && (
                              <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            )}
                            {mutedUsersError && !loadingMutedUsers && (
                              <Alert variant="destructive" className="py-2 px-3 text-sm">
                                <AlertDescription>{mutedUsersError}</AlertDescription>
                              </Alert>
                            )}
                            {!loadingMutedUsers && !mutedUsersError && mutedUsers.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">No users are currently muted.</p>
                            )}
                            {!loadingMutedUsers && !mutedUsersError && mutedUsers.length > 0 && (
                              <>
                                <ul className="space-y-2 text-sm">
                                  {mutedUsers.map((mutedUser) => {
                                    const isUnmuting = unmutingUserHandle === mutedUser.user_handle;
                                    const muteExpires = new Date(mutedUser.valid_upto);
                                    const isExpired = muteExpires < new Date();
                                    return (
                                      <li key={mutedUser.mute_id} className='flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-background rounded border gap-2'>
                                        <div className="flex-1 min-w-0">
                                          <span className="font-mono text-sm font-medium block truncate">{mutedUser.user_handle}</span>
                                          <p className="text-xs text-muted-foreground truncate mt-0.5" title={mutedUser.reason}>Reason: {mutedUser.reason}</p>
                                          <p className={`text-xs mt-0.5 ${isExpired ? 'text-green-600' : 'text-amber-600'}`}>
                                            <ClockIcon className="h-3 w-3 inline mr-1" />
                                            {isExpired ? 'Expired' : `Expires ${formatDistanceToNow(muteExpires, { addSuffix: true })}`}
                                          </p>
                                        </div>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className='h-8 w-8 sm:h-auto sm:w-auto sm:px-3 flex-shrink-0' 
                                          onClick={() => handleUnmuteUser(mutedUser.user_handle)}
                                          disabled={isUnmuting}
                                          title={`Unmute ${mutedUser.user_handle}`}
                                        >
                                          {isUnmuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon className='h-4 w-4'/>}
                                          <span className="hidden sm:inline ml-1">Unmute</span>
                                        </Button>
                                      </li>
                                    );
                                  })}
                                </ul>
                                {/* Pagination for Muted Users */}
                                {mutedUsersPagination && mutedUsersPagination.totalPages > 1 && (
                                  <div className="flex justify-center items-center text-xs text-muted-foreground pt-2 gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      disabled={currentMutedPage <= 1 || loadingMutedUsers}
                                      onClick={() => fetchMutedUsers(currentMutedPage - 1)}
                                    >
                                      Previous
                                    </Button>
                                    <span>Page {currentMutedPage} of {mutedUsersPagination.totalPages}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      disabled={currentMutedPage >= mutedUsersPagination.totalPages || loadingMutedUsers}
                                      onClick={() => fetchMutedUsers(currentMutedPage + 1)}
                                    >
                                      Next
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </CollapsibleContent>
                        </CardContent>
                      </Card>
                    </Collapsible>
                    {/* --- END Mute User Section --- */}

                    {/* Save Button & Error Alert (Moved Inside Main CardContent) */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={handleAdminSave} 
                        disabled={isSavingAdmin}
                        className="gap-2"
                      >
                        {isSavingAdmin ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                    {adminError && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertDescription>{adminError}</AlertDescription>
                        </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {/* END ADMIN TAB CONTENT (Mobile) */}
          </Tabs>
        )}
        
        {!isMobile && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full lg:w-auto flex justify-start mb-6 pb-px bg-transparent p-0 overflow-x-auto flex-nowrap h-auto border-b rounded-none">
              <TabsTrigger value="posts" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                <MessageCircle className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </TabsTrigger>
              )}
              <TabsTrigger value="members" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                <DollarSign className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="about" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                <Info className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="animate-fade-in mt-0">
              <div className="space-y-6">
                {postsLoading && allPosts.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allPosts.length > 0 ? (
                  <>
                    {allPosts.map((post, index) => (
                      <Post 
                        key={`post-${post.code || index}-${index}`}
                        username={post.handle || ''}
                        community={post.community || ''}
                        timeAgo={post.timeAgo || ''}
                          content={post.is_mirror === 1 ? (post.mirror_quote || '') : (post.body || '')}
                        roarCount={post.upvotes || 0}
                        commentCount={post.reply_count || 0}
                        shareCount={post.engagement || 0}
                        images={post.multiple_images ? post.images || [] : (post.image ? [post.image_url || ''] : [])}
                        video={undefined}
                        postCode={post.code || ''}
                        avatar={post.avatar || ''}
                        roared={post.roar === 1}
                        onRoar={() => post.code ? handleRoar(post.code) : null}
                        isMirror={post.is_mirror === 1}
                          mirrorData={post.is_mirror === 1 ? {
                            quote: post.mirror_quote || '',
                            originalAuthor: post.original_author || '',
                            originalCommunity: post.original_community || '',
                            originalBody: post.original_body || '',
                            originalTimeAgo: post.original_created_on || '',
                            originalAvatar: post.original_author_avatar || '',
                            originalImages: post.original_images || [],
                            originalTitle: post.original_title || '',
                            originalPostCode: post.original_post_code || ''
                          } : undefined}
                        ipfs={post.code || ''}
                        isLoggedIn={!!localStorage.getItem('dapps_user_id')}
                        hideComments={false}
                      />
                    ))}
                    
                    <div 
                      ref={loadingElementRef}
                      className="flex justify-center py-8"
                    >
                      {postsLoading && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      )}
                      
                      {!postsLoading && !hasMorePosts && posts.length > 0 && (
                        <p className="text-sm text-muted-foreground">You've reached the end</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">No posts in this community yet. Be the first to post!</p>
                  </div>
                )}
              </div>
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
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Rewards</CardTitle>
                  <CardDescription>
                    The community reward pool is distributed monthly to the top posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20 shadow-sm relative overflow-hidden animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-primary">Current Reward Pool</span>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {availableRewards.toFixed(5) || '0.00000'} ETH
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${(availableRewards * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/40 p-4 rounded-lg">
                      <h3 className="font-medium mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        How Rewards Work
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                        <li>{community?.fees?.reward_fees || 2}% of all buy/sell transactions go to the reward pool</li>
                        <li>Rewards are distributed on the last day of each month</li>
                        <li>60% goes to the top 3 most roared posts</li>
                        <li>40% is split among the next 7 top posts</li>
                        <li>
                          {minShareReward !== null
                            ? `You must hold at least ${minShareReward} shares to be eligible for rewards`
                            : `You must hold at least 5 shares to be eligible for rewards`}
                        </li>
                      </ul>
                    </div>
                    
                    {hasLastDistributed && (
                      <div>
                        <h3 className="font-medium mb-3">Last Month's Winners</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">
                                1
                              </div>
                              <div>
                                <div className="font-medium">alice.eth</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">"The future of layer 2 solutions is here..."</div>
                              </div>
                            </div>
                            <div className="font-bold">0.45 ETH</div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">
                                2
                              </div>
                              <div>
                                <div className="font-medium">bob.lens</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">"Here's my analysis of the recent EIP..."</div>
                              </div>
                            </div>
                            <div className="font-bold">0.32 ETH</div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg border border-border shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/5 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">
                                3
                              </div>
                              <div>
                                <div className="font-medium">charlie.sol</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">"I created this tutorial for beginners..."</div>
                              </div>
                            </div>
                            <div className="font-bold">0.18 ETH</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="about" className="animate-fade-in mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>About {community?.name || id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Community Description</h3>
                    <p className="text-muted-foreground">{community?.description || 'No description available.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created On</span>
                          <span>{community?.created_on ? new Date(community.created_on).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin</span>
                          <span>{community?.owner ? `${community.owner.substring(0, 6)}...${community.owner.substring(community.owner.length - 4)}` : 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Members</span>
                          <span>{community?.members_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Shares</span>
                          <span>{community?.shares?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Shares Posting</span>
                          <span>{minSharePosting}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Shares Commenting</span>
                          <span>{minShareCommenting}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Fee Structure</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin Fee</span>
                          <span>{community?.fees?.admin_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reward Pool</span>
                          <span>{community?.fees?.reward_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee</span>
                          <span>{community?.fees?.platform_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Share Price</span>
                          <span>{community?.prices?.buy_price?.toFixed(6) || 0} ETH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Community Rules</h3>
                    {communityRules ? (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{communityRules}</div>
                    ) : (
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                        <li>Be respectful to all members and maintain a professional tone</li>
                        <li>No spam, excessive self-promotion, or plagiarism</li>
                        <li>Content should be relevant to {community?.name || id}</li>
                        <li>Provide evidence and sources for technical claims when possible</li>
                        <li>Abide by the community guidelines for posting and commenting</li>
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* ADMIN TAB CONTENT (Desktop) - Reuse the same structure as mobile for now */} 
            {isAdmin && (
              <TabsContent value="admin" className="animate-fade-in mt-0">
                 <Card>
                  <CardHeader>
                    <CardTitle>Admin Panel</CardTitle>
                    <CardDescription>Manage community settings and members.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Mock Admin Earnings */}
                    <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg">Admin Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">0.123 ETH</span>
                          <Button variant="secondary" size="sm">Withdraw</Button>
                        </div>
                        <p className="text-sm opacity-80 mt-1">Available: ~$<span className="font-medium">{(0.123 * ethToUsd).toFixed(2)}</span> USD</p>
                        <p className="text-xs opacity-60 mt-1">Withdrawn: 0.05 ETH (~${(0.05 * ethToUsd).toFixed(2)} USD)</p>
                      </CardContent>
                    </Card>

                    {/* Image & Banner */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Visuals</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Community Image */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Community Image</label>
                          {adminFormState.image && <img src={adminFormState.image} alt="Community" className="h-20 w-20 rounded-md object-cover border" />}
                          <MediaUpload
                            onMediaUploaded={handleAdminImageUpload}
                            disabled={isSavingAdmin}
                            acceptedTypes="image"
                            maxFiles={1}
                          >
                            <Button variant="outline" size="sm" className="gap-2">
                              <UploadCloud className="h-4 w-4" />
                              {adminFormState.image ? 'Change Image' : 'Upload Image'}
                            </Button>
                          </MediaUpload>
                        </div>
                        {/* Community Banner */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Community Banner</label>
                          {adminFormState.banner && <img src={adminFormState.banner} alt="Banner" className="h-20 w-full rounded-md object-cover border" />}
                          <MediaUpload
                            onMediaUploaded={handleAdminBannerUpload}
                            disabled={isSavingAdmin}
                            acceptedTypes="image"
                            maxFiles={1}
                          >
                            <Button variant="outline" size="sm" className="gap-2">
                              <UploadCloud className="h-4 w-4" />
                              {adminFormState.banner ? 'Change Banner' : 'Upload Banner'}
                            </Button>
                          </MediaUpload>
                        </div>
                      </div>
                    </div>

                    {/* Rules */}
                    <div className="space-y-2">
                      <label htmlFor="admin-rules-desktop" className="text-sm font-medium">Community Rules</label>
                      <Textarea 
                        id="admin-rules-desktop"
                        name="rules"
                        value={adminFormState.rules}
                        onChange={handleAdminInputChange}
                        placeholder="Enter community rules here..."
                        className="min-h-[150px]"
                        disabled={isSavingAdmin}
                      />
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Interaction Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label htmlFor="min_share_posting-desktop" className="text-xs font-medium">Min Shares Posting</label>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  Min shares required to create a post in this community.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="min_share_posting-desktop"
                            name="min_share_posting"
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={adminFormState.min_share_posting ?? ''} 
                            onChange={handleAdminInputChange}
                            placeholder="e.g., 0.001"
                            disabled={isSavingAdmin}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label htmlFor="min_share_commenting-desktop" className="text-xs font-medium">Min Shares Commenting</label>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  Min shares required to reply/comment on posts.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="min_share_commenting-desktop"
                            name="min_share_commenting"
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={adminFormState.min_share_commenting ?? ''}
                            onChange={handleAdminInputChange}
                            placeholder="e.g., 0.001"
                            disabled={isSavingAdmin}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label htmlFor="min_share_reward-desktop" className="text-xs font-medium">Min Shares Reward</label>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  Min shares required to be eligible for monthly reward distributions.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="min_share_reward-desktop"
                            name="min_share_reward"
                            type="number"
                            step="1"
                            min="0.001"
                            value={adminFormState.min_share_reward ?? ''}
                            onChange={handleAdminInputChange}
                            placeholder="e.g., 1"
                            disabled={isSavingAdmin}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* --- Mock Mute User Section RESTORED --- */}
                    <Collapsible open={showMutedList} onOpenChange={setShowMutedList}>
                      <Card className="bg-muted/30 border border-border/40">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                           <div>
                            <CardTitle className="text-base">Mute Users</CardTitle>
                            <CardDescription className="text-xs pt-1">Search for users and prevent them from posting or commenting.</CardDescription>
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-auto flex-shrink-0">
                              <List className="h-4 w-4 mr-1" />
                              {showMutedList ? 'Hide List' : 'Show List'}
                            </Button>
                          </CollapsibleTrigger>
                        </CardHeader>
                        <CardContent className="pt-4 pb-4 space-y-6">
                          {/* Mute Form */}
                          <div className="space-y-3 p-4 border rounded-lg bg-background">
                            <h4 className="text-sm font-medium">Mute a User</h4>
                            {/* User Search Input with Popover Dropdown */}
                            <Popover open={userSearchResults.length > 0 && muteSearchQuery.length > 1} >
                              <PopoverTrigger asChild>
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input 
                                    placeholder="Search user handle..." 
                                    value={muteSearchQuery}
                                    onChange={(e) => { 
                                      setMuteSearchQuery(e.target.value);
                                      setSelectedUserToMute(null); // Clear selection when typing
                                    }}
                                    className="pl-8"
                                  />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command shouldFilter={false}> {/* We handle filtering via API */}
                                  <CommandList>
                                    {isSearchingUsers && <CommandEmpty>Searching...</CommandEmpty>}
                                    {!isSearchingUsers && userSearchResults.length === 0 && debouncedMuteSearch.length > 1 && (
                                      <CommandEmpty>No users found.</CommandEmpty>
                                    )}
                                    <CommandGroup heading="Suggestions">
                                      {userSearchResults.map((user) => (
                                        <CommandItem 
                                          key={user.id}
                                          value={user.handle} // Required for Command
                                          onSelect={() => handleUserSelect(user.handle)}
                                          className="flex items-center gap-2"
                                        >
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={user.avatar_url} alt={user.handle} />
                                            <AvatarFallback>{user.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                          <span>{user.handle}</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {selectedUserToMute && (
                              <Badge variant="secondary">Selected: {selectedUserToMute}</Badge>
                            )}

                            {/* Mute Reason */}
                            <Textarea 
                              placeholder="Reason for muting..." 
                              value={muteReason}
                              onChange={(e) => setMuteReason(e.target.value)}
                              className="min-h-[60px]"
                              disabled={isMutingUser}
                            />

                            {/* Mute Duration */}
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                placeholder="Duration" 
                                value={muteDurationHours}
                                onChange={(e) => setMuteDurationHours(parseInt(e.target.value) || 0)}
                                className="w-24"
                                min="1"
                                disabled={isMutingUser}
                              />
                              <span className="text-sm text-muted-foreground">hours</span>
                            </div>

                            {/* Mute Button */}
                            <Button 
                              variant="destructive" 
                              className="w-full gap-2" 
                              onClick={handleMuteUser}
                              disabled={isMutingUser || !selectedUserToMute || !muteReason || muteDurationHours <= 0}
                            >
                              {isMutingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                              Mute {selectedUserToMute || 'User'}
                            </Button>
                            {muteError && (
                              <Alert variant="destructive" className="mt-2 py-1 px-3 text-xs">
                                <AlertDescription>{muteError}</AlertDescription>
                              </Alert>
                            )}
                          </div>

                          {/* Muted Users List Section */}
                          <CollapsibleContent className="space-y-4 animate-collapsible-down border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium">Currently Muted Users</h4>
                            {loadingMutedUsers && (
                              <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            )}
                            {mutedUsersError && !loadingMutedUsers && (
                              <Alert variant="destructive" className="py-2 px-3 text-sm">
                                <AlertDescription>{mutedUsersError}</AlertDescription>
                              </Alert>
                            )}
                            {!loadingMutedUsers && !mutedUsersError && mutedUsers.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">No users are currently muted.</p>
                            )}
                            {!loadingMutedUsers && !mutedUsersError && mutedUsers.length > 0 && (
                              <>
                                <ul className="space-y-2 text-sm">
                                  {mutedUsers.map((mutedUser) => {
                                    const isUnmuting = unmutingUserHandle === mutedUser.user_handle;
                                    const muteExpires = new Date(mutedUser.valid_upto);
                                    const isExpired = muteExpires < new Date();
                                    return (
                                      <li key={mutedUser.mute_id} className='flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-background rounded border gap-2'>
                                        <div className="flex-1 min-w-0">
                                          <span className="font-mono text-sm font-medium block truncate">{mutedUser.user_handle}</span>
                                          <p className="text-xs text-muted-foreground truncate mt-0.5" title={mutedUser.reason}>Reason: {mutedUser.reason}</p>
                                          <p className={`text-xs mt-0.5 ${isExpired ? 'text-green-600' : 'text-amber-600'}`}>
                                            <ClockIcon className="h-3 w-3 inline mr-1" />
                                            {isExpired ? 'Expired' : `Expires ${formatDistanceToNow(muteExpires, { addSuffix: true })}`}
                                          </p>
                                        </div>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className='h-8 w-8 sm:h-auto sm:w-auto sm:px-3 flex-shrink-0' 
                                          onClick={() => handleUnmuteUser(mutedUser.user_handle)}
                                          disabled={isUnmuting}
                                          title={`Unmute ${mutedUser.user_handle}`}
                                        >
                                          {isUnmuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XIcon className='h-4 w-4'/>}
                                          <span className="hidden sm:inline ml-1">Unmute</span>
                                        </Button>
                                      </li>
                                    );
                                  })}
                                </ul>
                                {/* Pagination for Muted Users */}
                                {mutedUsersPagination && mutedUsersPagination.totalPages > 1 && (
                                  <div className="flex justify-center items-center text-xs text-muted-foreground pt-2 gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      disabled={currentMutedPage <= 1 || loadingMutedUsers}
                                      onClick={() => fetchMutedUsers(currentMutedPage - 1)}
                                    >
                                      Previous
                                    </Button>
                                    <span>Page {currentMutedPage} of {mutedUsersPagination.totalPages}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      disabled={currentMutedPage >= mutedUsersPagination.totalPages || loadingMutedUsers}
                                      onClick={() => fetchMutedUsers(currentMutedPage + 1)}
                                    >
                                      Next
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </CollapsibleContent>
                        </CardContent>
                      </Card>
                    </Collapsible>
                    {/* --- END Mute User Section --- */}

                    {/* Save Button & Error Alert (Moved Inside Main CardContent) */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={handleAdminSave} 
                        disabled={isSavingAdmin}
                        className="gap-2"
                      >
                        {isSavingAdmin ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                     {adminError && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertDescription>{adminError}</AlertDescription>
                        </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {/* END ADMIN TAB CONTENT (Desktop) */}
          </Tabs>
        )}
      </div>
      
      {!isMobile && (
        <div className="w-full md:w-80 order-1 md:order-2 flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            <Card className="overflow-hidden relative">
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d={chartPoints + " V100 H0 Z"} 
                    fill={priceChange > 0 ? "#10B981" : "#EF4444"} 
                  />
                </svg>
              </div>
              
              <div className="relative">
                <div 
                  className="h-32 w-full bg-cover bg-center" 
                  style={{ backgroundImage: `url(${bannerUrl || community?.image || 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2532&auto=format&fit=crop'})` }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent"></div>
                
                <Avatar className="absolute bottom-0 left-4 transform translate-y-1/2 h-16 w-16 border-4 border-background">
                  <AvatarImage src={community?.image} alt={community?.name} />
                  <AvatarFallback>{community?.name ? community.name[0].toUpperCase() : id?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              
              <CardHeader className="pt-10 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{community?.name || id}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {community?.members_count || 0} members
                    </CardDescription>
                  </div>
                  
                  {priceChange > 0 ? (
                    <Badge className="bg-green-500/10 text-green-600">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      {priceChange.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      {Math.abs(priceChange).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per Share</span>
                    <div className="text-right">
                      <div className="font-semibold text-[15px]">${community?.prices?.buy_price_usd?.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-muted-foreground">{community?.prices?.buy_price?.toFixed(6) || '0.000000'} ETH</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidity</span>
                    <div className="text-right">
                      <div className="font-semibold text-[15px]">${community?.market_cap?.usd?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</div>
                      <div className="text-xs text-muted-foreground">{community?.market_cap?.eth?.toFixed(2) || '0.00'} ETH</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="pt-1">
                    <div className="text-sm font-medium mb-2">Your Holdings</div>
                    {hasShares ? (
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Shares Owned</span>
                          <span className="font-medium">{user?.shares?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Value</span>
                          <div className="text-right">
                            <div className="font-semibold">${user?.share_value?.usd?.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {user?.share_value?.eth?.toFixed(6)} ETH
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        You don't own any shares yet
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-3 mb-2 border border-primary/20 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-pulse"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-primary">Reward Pool</span>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            ${(availableRewards * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {availableRewards.toFixed(5) || '0.00000'} ETH
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-3 pt-0">
                {hasShares ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg" 
                        onClick={handleBuyAction}
                      >
                          Buy Shares
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleSellAction}
                      >
                        Sell
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg" 
                    onClick={handleBuyAction}
                  >
                    Join Community
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            <Card className="mt-4 border rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-medium text-lg">Community Navigation</h3>
              </div>
              <div className="p-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full p-0 flex flex-col gap-1 bg-transparent">
                    <TabsTrigger value="posts" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/10">
                      <MessageCircle className="h-4 w-4 mr-3" />
                      Posts
                    </TabsTrigger>
                    <TabsTrigger value="members" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/10">
                      <Users className="h-4 w-4 mr-3" />
                      Members
                    </TabsTrigger>
                    <TabsTrigger value="rewards" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/10">
                      <DollarSign className="h-4 w-4 mr-3" />
                      Rewards
                    </TabsTrigger>
                    <TabsTrigger value="about" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/10">
                      <Info className="h-4 w-4 mr-3" />
                      About
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </Card>
          </div>
        </div>
      )}
      </div>
      
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
      />
    </div>
  );
};

export default CommunityPage;
