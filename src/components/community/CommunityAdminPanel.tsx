import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MediaUpload, MediaUploadResponse } from '@/components/ui/media-upload';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UploadCloud,
  Save,
  List,
  XIcon,
  HelpCircle,
  Search,
  ClockIcon,
  Ban,
  Loader2,
  Settings,
  Users,
  Shield,
  AlertCircle,
  ArrowRight,
  Check,
  RefreshCw,
  Wallet,
  ArrowDown
} from 'lucide-react';
import {
  searchUsers,
  UserSearchResponse,
  muteUserInCommunity,
  getMutedUsers,
  unmuteUserInCommunity,
  MutedUser,
  MutedUsersApiResponse,
  updateCommunityAdmin,
  getInvitableFollowers,
  inviteUserToCommunity,
  InvitableUser,
  getAdminFees,
  AdminFeesResponse
} from '@/utils/communityApi';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatNumber } from '@/utils/formatUtils';
import { AdminFeesWithdrawalSheet } from './AdminFeesWithdrawalSheet';

// Define the structure for initial data passed from the parent
interface InitialAdminData {
  image: string;
  banner: string;
  rules: string;
  min_share_posting: number;
  min_share_commenting: number;
  min_share_reward: number | null;
}

interface CommunityAdminPanelProps {
  communityName: string;
  initialData: InitialAdminData;
  refetchCommunityData: () => void;
  ethToUsd: number; // For mock earnings display
}

const CommunityAdminPanel: React.FC<CommunityAdminPanelProps> = ({
  communityName,
  initialData,
  refetchCommunityData,
  ethToUsd
}) => {

  // --- Admin Tab State ---
  const [adminFormState, setAdminFormState] = useState(initialData);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showMutedList, setShowMutedList] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  
  // --- Admin Fees State ---
  const [adminFeesData, setAdminFeesData] = useState<{
    totalFees: number;
    adminFeesBalance: number;
  } | null>(null);
  const [pastWithdrawals, setPastWithdrawals] = useState<Array<{
    amount: number;
    timestamp: string;
    txHash: string;
  }>>([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  // --- Mute/Unmute State ---
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
  const [unmutingUserHandle, setUnmutingUserHandle] = useState<string | null>(null);

  // --- Invite Users State ---
  const [invitableUsers, setInvitableUsers] = useState<InvitableUser[]>([]);
  const [invitableUsersPagination, setInvitableUsersPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loadingInvitableUsers, setLoadingInvitableUsers] = useState(false);
  const [invitableUsersError, setInvitableUsersError] = useState<string | null>(null);
  const [currentInvitablePage, setCurrentInvitablePage] = useState(1);
  const [isInvitingUser, setIsInvitingUser] = useState<string | null>(null);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const debouncedInviteSearch = useDebounce(inviteSearchQuery, 300);
  const [filteredInvitableUsers, setFilteredInvitableUsers] = useState<InvitableUser[]>([]);
  const inviteListRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- Mute/Unmute Handlers ---
  const fetchMutedUsers = useCallback(async (page: number) => {
    if (!communityName) return;
    setLoadingMutedUsers(true);
    setMutedUsersError(null);
    try {
      const response = await getMutedUsers(communityName, page, 10);
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
  }, [communityName]);

  const handleUserSelect = (handle: string) => {
    setSelectedUserToMute(handle);
    setMuteSearchQuery(handle);
    setUserSearchResults([]);
  };

  const handleMuteUser = async () => {
    if (!communityName || !selectedUserToMute || !muteReason || muteDurationHours <= 0) {
      setMuteError("Please select a user, provide a reason, and set a positive duration.");
      return;
    }
    setIsMutingUser(true);
    setMuteError(null);
    try {
      const response = await muteUserInCommunity(communityName, selectedUserToMute, muteReason, muteDurationHours);
      if (response.success) {
        toast.success(`User ${selectedUserToMute} muted successfully.`);
        setSelectedUserToMute(null);
        setMuteSearchQuery("");
        setMuteReason("");
        setMuteDurationHours(24);
        fetchMutedUsers(1);
        setShowMutedList(true);
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
    if (!communityName) return;
    setUnmutingUserHandle(userHandle);
    try {
      const response = await unmuteUserInCommunity(communityName, userHandle);
      if (response.success) {
        toast.success(`User ${userHandle} unmuted successfully.`);
        fetchMutedUsers(currentMutedPage);
      } else {
        throw new Error(response.message || "Failed to unmute user.");
      }
    } catch (err: any) {
      console.error("Failed to unmute user:", err);
      toast.error(err.message || "Could not unmute user.");
    } finally {
      setUnmutingUserHandle(null);
    }
  };

  // --- Admin Form Handlers ---
  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminFormState(prevState => ({
      ...prevState,
      [name]: name.startsWith('min_share_') ? (value === '' ? null : parseFloat(value)) : value,
    }));
  };

  const handleAdminImageUpload = (media: MediaUploadResponse) => {
    if (media?.url) {
      setAdminFormState(prevState => ({ ...prevState, image: media.url }));
    }
  };

  const handleAdminBannerUpload = (media: MediaUploadResponse) => {
    if (media?.url) {
      setAdminFormState(prevState => ({ ...prevState, banner: media.url }));
    }
  };

  const handleAdminSave = async () => {
    if (!communityName) return;
    setIsSavingAdmin(true);
    setAdminError(null);

    const changes: Record<string, any> = {};
    if (adminFormState.image !== initialData.image) changes.image = adminFormState.image;
    if (adminFormState.banner !== initialData.banner) changes.banner = adminFormState.banner;
    if (adminFormState.rules !== initialData.rules) changes.rules = adminFormState.rules;
    if (adminFormState.min_share_posting !== initialData.min_share_posting) changes.min_share_posting = adminFormState.min_share_posting;
    if (adminFormState.min_share_commenting !== initialData.min_share_commenting) changes.min_share_commenting = adminFormState.min_share_commenting;
    if (adminFormState.min_share_reward !== initialData.min_share_reward) changes.min_share_reward = adminFormState.min_share_reward;

    if (Object.keys(changes).length === 0) {
      toast.info("No changes detected.");
      setIsSavingAdmin(false);
      return;
    }

    try {
      const result = await updateCommunityAdmin(communityName, changes);
      if (result.success) {
        toast.success("Community settings updated successfully!");
        refetchCommunityData();
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

  // --- Mute/Unmute Effects ---
  useEffect(() => {
    if (showMutedList && communityName) {
      fetchMutedUsers(currentMutedPage);
    }
  }, [showMutedList, currentMutedPage, fetchMutedUsers, communityName]);

  useEffect(() => {
    const search = async () => {
      if (debouncedMuteSearch.trim().length < 2) {
        setUserSearchResults([]);
        setIsSearchingUsers(false);
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

  // Effect to reset form state if initialData changes
  useEffect(() => {
    setAdminFormState(initialData);
  }, [initialData]);

  // --- Invite Users Handlers ---
  const fetchInvitableUsers = useCallback(async (page: number, isLoadingMore = false) => {
    if (!communityName) return;
    
    if (!isLoadingMore) {
      setLoadingInvitableUsers(true);
    } else {
      setIsLoadingMore(true);
    }
    
    setInvitableUsersError(null);
    
    try {
      const response = await getInvitableFollowers(communityName, page, 10);
      if (response.success) {
        if (isLoadingMore) {
          // Filter out duplicate users when appending new data
          setInvitableUsers(prev => {
            const existingIds = new Set(prev.map(user => user.id));
            const newUniqueUsers = response.data.filter(user => !existingIds.has(user.id));
            return [...prev, ...newUniqueUsers];
          });
        } else {
          setInvitableUsers(response.data);
        }
        
        setInvitableUsersPagination(response.pagination);
        setCurrentInvitablePage(response.pagination.page);
        setHasMore(page < response.pagination.totalPages);
      } else {
        throw new Error(response.message || "Failed to fetch invitable users.");
      }
    } catch (err: any) {
      console.error("Failed to fetch invitable users:", err);
      setInvitableUsersError(err.message || "Could not load invitable users.");
      toast.error(err.message || "Could not load invitable users.");
    } finally {
      if (!isLoadingMore) {
        setLoadingInvitableUsers(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [communityName]);

  const handleInviteUser = async (userHandle: string) => {
    if (!communityName) return;
    setIsInvitingUser(userHandle);
    
    try {
      const response = await inviteUserToCommunity(communityName, userHandle);
      if (response.success) {
        toast.success(response.message || `Invitation sent to ${userHandle}`);
        // Update local state to reflect the invite
        const updateList = (list: InvitableUser[]) => 
          list.map(user => 
            user.handle === userHandle 
              ? { ...user, invite_status: 'invited' as const } 
              : user
          );
        
        setInvitableUsers(prev => updateList(prev));
        setFilteredInvitableUsers(prev => updateList(prev));
      } else {
        throw new Error(response.message || "Failed to invite user.");
      }
    } catch (err: any) {
      console.error("Failed to invite user:", err);
      toast.error(err.message || "Could not invite user.");
    } finally {
      setIsInvitingUser(null);
    }
  };

  const handleLoadMoreInvitableUsers = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchInvitableUsers(currentInvitablePage + 1, true);
    }
  }, [hasMore, isLoadingMore, fetchInvitableUsers, currentInvitablePage]);

  const handleScroll = useCallback(() => {
    if (!inviteListRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = inviteListRef.current;
    
    // Check if user has scrolled to the bottom
    if (scrollTop + clientHeight >= scrollHeight - 50 && hasMore && !isLoadingMore) {
      handleLoadMoreInvitableUsers();
    }
  }, [hasMore, isLoadingMore, handleLoadMoreInvitableUsers]);

  // Effect for infinite scroll
  useEffect(() => {
    const currentRef = inviteListRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => currentRef.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Effect to filter invitable users based on search
  useEffect(() => {
    if (debouncedInviteSearch.trim() === '') {
      setFilteredInvitableUsers(invitableUsers);
      return;
    }
    
    const filtered = invitableUsers.filter(user => 
      user.handle.toLowerCase().includes(debouncedInviteSearch.toLowerCase())
    );
    
    setFilteredInvitableUsers(filtered);
  }, [invitableUsers, debouncedInviteSearch]);

  // Effect to load invitable users when the tab changes
  useEffect(() => {
    if (activeTab === 'invite' && communityName && invitableUsers.length === 0) {
      fetchInvitableUsers(1);
    }
  }, [activeTab, communityName, invitableUsers.length, fetchInvitableUsers]);
  
  // Effect to load muted users when the moderate tab is selected
  useEffect(() => {
    if (activeTab === 'moderate' && communityName) {
      fetchMutedUsers(1);
    }
  }, [activeTab, communityName, fetchMutedUsers]);

  // Fetch admin fees data
  const fetchAdminFees = useCallback(async () => {
    if (!communityName) return;
    
    setIsLoadingFees(true);
    setFeesError(null);
    
    try {
      const response = await getAdminFees(communityName);
      
      if (response.success && response.currentBalance) {
        setAdminFeesData(response.currentBalance);
        setPastWithdrawals(response.pastWithdrawals || []);
      } else {
        throw new Error(response.message || "Failed to fetch admin fees.");
      }
    } catch (err: any) {
      console.error("Failed to fetch admin fees:", err);
      setFeesError(err.message || "Could not load admin fees.");
      toast.error(err.message || "Could not load admin fees.");
    } finally {
      setIsLoadingFees(false);
    }
  }, [communityName]);

  // Fetch admin fees on initial load
  useEffect(() => {
    if (communityName) {
      fetchAdminFees();
    }
  }, [communityName, fetchAdminFees]);

  return (
    <Card className="shadow-md relative">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Community Admin Panel
        </CardTitle>
        <CardDescription>Manage your community settings, users, and earnings.</CardDescription>
      </CardHeader>
      
      {/* Admin Earnings Card */}
      <CardContent>
        <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg mb-6">
          <CardContent className="pt-6 pb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-white/80 text-sm font-medium mb-1">Admin Earnings</h3>
                <span className="text-3xl font-bold">
                  {isLoadingFees ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-xl">Loading...</span>
                    </div>
                  ) : feesError ? (
                    <span className="text-xl">Error loading data</span>
                  ) : (
                    `${formatNumber(adminFeesData?.adminFeesBalance || 0, 4)} ETH`
                  )}
                </span>
                <p className="text-white/80 text-sm mt-1">
                  {!isLoadingFees && !feesError && (
                    `~$${((adminFeesData?.adminFeesBalance || 0) * ethToUsd).toFixed(2)} USD`
                  )}
                </p>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="gap-2"
                onClick={() => setIsWithdrawalModalOpen(true)}
                disabled={isLoadingFees || !adminFeesData || adminFeesData.adminFeesBalance <= 0}
              >
                <Wallet className="h-4 w-4" /> Withdraw
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white/10 p-2 rounded">
                <p className="text-white/70">Total Fees Generated</p>
                <p className="font-semibold">
                  {isLoadingFees ? (
                    <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                  ) : (
                    `${formatNumber(adminFeesData?.totalFees || 0, 4)} ETH`
                  )}
                </p>
              </div>
              <div className="bg-white/10 p-2 rounded">
                <p className="text-white/70">Past Withdrawals</p>
                <p className="font-semibold">
                  {isLoadingFees ? (
                    <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                  ) : (
                    `${pastWithdrawals.length} ${pastWithdrawals.length === 1 ? 'transaction' : 'transactions'}`
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="settings" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="settings" className="flex gap-1 items-center">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex gap-1 items-center">
              <Users className="h-4 w-4" /> Invite Users
            </TabsTrigger>
            <TabsTrigger value="moderate" className="flex gap-1 items-center">
              <Shield className="h-4 w-4" /> Moderate
            </TabsTrigger>
          </TabsList>
          
          {/* Settings Tab Content */}
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-6">
              {/* Community Visuals Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Community Visuals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Community Image */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Community Image</label>
                    <div className="flex items-center gap-4">
                      {adminFormState.image && (
                        <img 
                          src={adminFormState.image} 
                          alt="Community" 
                          className="h-24 w-24 rounded-md object-cover border shadow-sm" 
                        />
                      )}
                      <MediaUpload
                        onMediaUploaded={handleAdminImageUpload}
                        disabled={isSavingAdmin}
                        acceptedTypes="image"
                        maxFiles={1}
                      >
                        <Button variant="outline" className="gap-2">
                          <UploadCloud className="h-4 w-4" />
                          {adminFormState.image ? 'Change Image' : 'Upload Image'}
                        </Button>
                      </MediaUpload>
                    </div>
                  </div>
                  
                  {/* Community Banner */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Community Banner</label>
                    <div className="space-y-3">
                      {adminFormState.banner && (
                        <img 
                          src={adminFormState.banner} 
                          alt="Banner" 
                          className="h-24 w-full rounded-md object-cover border shadow-sm" 
                        />
                      )}
                      <MediaUpload
                        onMediaUploaded={handleAdminBannerUpload}
                        disabled={isSavingAdmin}
                        acceptedTypes="image"
                        maxFiles={1}
                      >
                        <Button variant="outline" className="gap-2">
                          <UploadCloud className="h-4 w-4" />
                          {adminFormState.banner ? 'Change Banner' : 'Upload Banner'}
                        </Button>
                      </MediaUpload>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Community Rules */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Community Rules</h3>
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
              
              <Separator />
              
              {/* Interaction Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Interaction Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <label htmlFor="min_share_posting" className="text-sm font-medium">Min Shares Posting</label>
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <label htmlFor="min_share_commenting" className="text-sm font-medium">Min Shares Commenting</label>
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <label htmlFor="min_share_reward" className="text-sm font-medium">Min Shares Reward</label>
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
              
              {/* Save Settings Button */}
              <div className="flex justify-end pt-4">
                {adminError && (
                  <Alert variant="destructive" className="mr-4 flex-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{adminError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={handleAdminSave}
                  disabled={isSavingAdmin}
                  className="gap-2"
                >
                  {isSavingAdmin ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Invite Users Tab Content */}
          <TabsContent value="invite" className="space-y-4">
            <div className="flex items-center space-x-2 pb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter users by handle..."
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                className="flex-1"
              />
              {loadingInvitableUsers && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchInvitableUsers(1)}
                disabled={loadingInvitableUsers}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
            
            {invitableUsersError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{invitableUsersError}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-muted/30 rounded-lg p-1">
              <div className="bg-card rounded-md shadow-sm">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-medium">Followers to Invite</h3>
                  {invitableUsersPagination && (
                    <span className="text-xs text-muted-foreground">
                      {invitableUsersPagination.total} followers found
                    </span>
                  )}
                </div>
                
                <ScrollArea 
                  className="h-[400px] rounded-b-md" 
                  ref={inviteListRef} 
                  onScrollCapture={handleScroll}
                >
                  {filteredInvitableUsers.length === 0 && !loadingInvitableUsers ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                      <Users className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                      <p className="text-muted-foreground">
                        {inviteSearchQuery.trim() !== '' 
                          ? 'No users matching your search.' 
                          : 'No followers found to invite.'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {inviteSearchQuery.trim() !== '' 
                          ? 'Try a different search term.'
                          : 'Try refreshing the list.'}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {filteredInvitableUsers.map((user) => {
                        const isInviting = isInvitingUser === user.handle;
                        const inviteStatus = user.invite_status;
                        
                        return (
                          <li key={`user-${user.id}-${user.handle}`} className="flex items-center justify-between p-3 hover:bg-muted/40">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar || ''} alt={user.handle} />
                                <AvatarFallback>{user.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{user.handle}</p>
                                <div className="mt-0.5">
                                  {inviteStatus === 'not_invited' && (
                                    <Badge variant="outline" className="text-xs">Not invited</Badge>
                                  )}
                                  {inviteStatus === 'invited' && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                                      <ClockIcon className="h-2.5 w-2.5 mr-1" />
                                      Invited
                                    </Badge>
                                  )}
                                  {inviteStatus === 'joined' && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                                      <Check className="h-2.5 w-2.5 mr-1" />
                                      Joined
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant={inviteStatus === 'not_invited' ? "default" : "outline"}
                              className="gap-1"
                              disabled={inviteStatus !== 'not_invited' || isInviting}
                              onClick={() => handleInviteUser(user.handle)}
                            >
                              {isInviting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : inviteStatus === 'not_invited' ? (
                                <ArrowRight className="h-3 w-3" />
                              ) : inviteStatus === 'invited' ? (
                                <ClockIcon className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              {inviteStatus === 'not_invited' ? 'Invite' : 
                               inviteStatus === 'invited' ? 'Invited' : 'Joined'}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  
                  {isLoadingMore && (
                    <div className="py-4 flex justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground italic">
              Note: Scroll down to load more users. Only followers who don't have shares in this community will appear in this list.
            </p>
          </TabsContent>
          
          {/* Moderation Tab Content */}
          <TabsContent value="moderate" className="space-y-6">
            {/* Mute User Form */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Mute a User</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search User</label>
                  <Popover open={userSearchResults.length > 0 && muteSearchQuery.length > 1}>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search user handle..."
                          value={muteSearchQuery}
                          onChange={(e) => {
                            setMuteSearchQuery(e.target.value);
                            setSelectedUserToMute(null);
                          }}
                          className="pl-8"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandList>
                          {isSearchingUsers && <CommandEmpty>Searching...</CommandEmpty>}
                          {!isSearchingUsers && userSearchResults.length === 0 && debouncedMuteSearch.length > 1 && (
                            <CommandEmpty>No users found.</CommandEmpty>
                          )}
                          <CommandGroup heading="Suggestions">
                            {userSearchResults.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.handle}
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
                    <div className="mt-2">
                      <Badge variant="secondary" className="px-3 py-1 text-base">Selected: {selectedUserToMute}</Badge>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="muteReason" className="text-sm font-medium">Reason for Muting</label>
                  <Textarea
                    id="muteReason"
                    placeholder="Explain why this user is being muted..."
                    value={muteReason}
                    onChange={(e) => setMuteReason(e.target.value)}
                    className="min-h-[80px]"
                    disabled={isMutingUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="muteDuration" className="text-sm font-medium">Mute Duration (hours)</label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="muteDuration"
                      type="number"
                      value={muteDurationHours}
                      onChange={(e) => setMuteDurationHours(parseInt(e.target.value) || 0)}
                      min="1"
                      disabled={isMutingUser}
                      className="w-32"
                    />
                    <div className="flex gap-2">
                      {[24, 72, 168].map(hours => (
                        <Button 
                          key={hours} 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setMuteDurationHours(hours)}
                          className={cn(
                            "text-xs",
                            muteDurationHours === hours && "bg-primary/10 border-primary/30"
                          )}
                        >
                          {hours === 24 ? "1 day" : hours === 72 ? "3 days" : "1 week"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {muteError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{muteError}</AlertDescription>
                  </Alert>
                )}
                
                <Button
                  variant="destructive"
                  className="w-full gap-2 mt-2"
                  onClick={handleMuteUser}
                  disabled={isMutingUser || !selectedUserToMute || !muteReason || muteDurationHours <= 0}
                >
                  {isMutingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                  Mute {selectedUserToMute || 'User'}
                </Button>
              </div>
            </div>
            
            {/* Muted Users List */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Currently Muted Users</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchMutedUsers(1)}
                  disabled={loadingMutedUsers}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              </div>
              
              {loadingMutedUsers ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : mutedUsersError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{mutedUsersError}</AlertDescription>
                </Alert>
              ) : mutedUsers.length === 0 ? (
                <div className="text-center py-10 bg-card rounded-md shadow-sm">
                  <Ban className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-20" />
                  <p className="text-muted-foreground">No users are currently muted</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Muted users will appear here
                  </p>
                </div>
              ) : (
                <div className="bg-card rounded-md shadow-sm">
                  <ul className="divide-y">
                    {mutedUsers.map((mutedUser) => {
                      const isUnmuting = unmutingUserHandle === mutedUser.user_handle;
                      const muteExpires = new Date(mutedUser.valid_upto);
                      const isExpired = muteExpires < new Date();
                      
                      return (
                        <li key={`muted-${mutedUser.mute_id}-${mutedUser.user_handle}`} className="p-4 flex justify-between items-start hover:bg-muted/10">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{mutedUser.user_handle}</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  isExpired ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                )}
                              >
                                {isExpired ? 'Expired' : 'Active'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Reason: {mutedUser.reason}
                            </p>
                            <p className="text-xs mt-1 flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1 inline" />
                              {isExpired ? 'Expired' : `Expires ${formatDistanceToNow(muteExpires, { addSuffix: true })}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50/50"
                            onClick={() => handleUnmuteUser(mutedUser.user_handle)}
                            disabled={isUnmuting}
                          >
                            {isUnmuting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span className="flex items-center gap-1">
                                <XIcon className="h-4 w-4" />
                                Unmute
                              </span>
                            )}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  
                  {/* Pagination */}
                  {mutedUsersPagination && mutedUsersPagination.totalPages > 1 && (
                    <div className="flex justify-center items-center py-4 border-t text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentMutedPage <= 1 || loadingMutedUsers}
                        onClick={() => fetchMutedUsers(currentMutedPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="mx-4">
                        Page {currentMutedPage} of {mutedUsersPagination.totalPages}
                      </span>
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
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Withdrawal Modal */}
      <AdminFeesWithdrawalSheet
        open={isWithdrawalModalOpen}
        onOpenChange={setIsWithdrawalModalOpen}
        communityName={communityName}
        adminFeesBalance={adminFeesData?.adminFeesBalance || 0}
        ethToUsd={ethToUsd}
        onSuccess={fetchAdminFees}
      />
    </Card>
  );
};

export default CommunityAdminPanel;