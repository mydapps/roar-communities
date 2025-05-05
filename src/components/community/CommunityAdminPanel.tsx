import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
  UploadCloud,
  Save,
  List,
  XIcon,
  HelpCircle,
  Search,
  ClockIcon,
  Ban,
  Loader2
} from 'lucide-react';
import {
  searchUsers,
  UserSearchResponse,
  muteUserInCommunity,
  getMutedUsers,
  unmuteUserInCommunity,
  MutedUser,
  MutedUsersApiResponse,
  updateCommunityAdmin
} from '@/utils/communityApi';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner";

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

  return (
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

        {/* Mute User Section */}
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
                <Popover open={userSearchResults.length > 0 && muteSearchQuery.length > 1} >
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
                  <Badge variant="secondary">Selected: {selectedUserToMute}</Badge>
                )}

                <Textarea
                  placeholder="Reason for muting..."
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  className="min-h-[60px]"
                  disabled={isMutingUser}
                />

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

        {/* Save Button & Error Alert */}
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
  );

};

export default CommunityAdminPanel;