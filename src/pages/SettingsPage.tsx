import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Helmet } from 'react-helmet-async';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Users, BellRing, ShieldAlert, UserCircle, AtSign, UserPlus, ThumbsUp, MessageSquareText, LayoutGrid, Search, UserX } from 'lucide-react';
import { toast } from 'sonner';
import * as apiBase from '@/utils/apiBase';
import { searchUsers as apiSearchUsers, SearchUserItem } from '@/utils/searchApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { debounce } from 'lodash';

// Types for Blocked Users
interface BlockedUser {
  id: number;
  handle: string;
  name?: string;
  avatar_url?: string | null;
  blocked_at: string;
}

interface BlockedListResponse {
  success: boolean;
  blocked_users?: BlockedUser[];
  message?: string;
}

interface SetBlockStatusResponse {
  success: boolean;
  message: string;
  status: 'blocked' | 'unblocked';
}

// START OF NEW INTERFACES FOR NOTIFICATION SETTINGS
interface NotificationSettingItem {
  type: string;
  enabled: boolean;
}

interface FetchNotificationSettingsResponse {
  success: boolean;
  settings?: NotificationSettingItem[];
  message?: string;
}

interface UpdateNotificationSettingResponse {
  success: boolean;
  message: string;
  notification_type: string;
  enabled: boolean;
}
// END OF NEW INTERFACES FOR NOTIFICATION SETTINGS

const notificationTypes = [
  { id: 'mentions', apiType: 'tag', label: 'Mentions', icon: AtSign },
  { id: 'newFollowers', apiType: 'follow', label: 'New Followers', icon: UserPlus },
  { id: 'postRoars', apiType: 'roar', label: 'Roars on your posts', icon: ThumbsUp },
  { id: 'commentReplies', apiType: 'reply', label: 'Replies to your comments', icon: MessageSquareText },
  { id: 'communityUpdates', apiType: 'community_invite', label: 'Community Updates', icon: LayoutGrid },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  // State for Blocked Users
  const [blockedUsers, setBlockedUsers] = React.useState<BlockedUser[]>([]);
  const [isLoadingBlockedUsers, setIsLoadingBlockedUsers] = React.useState(false);
  const [blockError, setBlockError] = React.useState<string | null>(null);

  // State for User Search to Block
  const [searchQueryToBlock, setSearchQueryToBlock] = React.useState('');
  const [userSearchResults, setUserSearchResults] = React.useState<SearchUserItem[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  
  // State for Notification Settings
  const [individualNotifications, setIndividualNotifications] = React.useState<Record<string, boolean>>(
    () => notificationTypes.reduce((acc, type) => {
      acc[type.id] = true; // Default to true, API will override
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [isLoadingNotificationSettings, setIsLoadingNotificationSettings] = React.useState(false);
  const [notificationSettingsError, setNotificationSettingsError] = React.useState<string | null>(null);

  // State for Account Deletion (moved from EditProfilePage)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = React.useState("");
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Fetch Blocked Users
  const fetchBlockedUsers = useCallback(async () => {
    setIsLoadingBlockedUsers(true);
    setBlockError(null);
    try {
      const headers = apiBase.createAuthHeaders();
      const response = await fetch('/api/blocked_users_list', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch blocked users.' }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      const data: BlockedListResponse = await response.json();
      if (data.success && data.blocked_users) {
        setBlockedUsers(data.blocked_users);
      } else {
        throw new Error(data.message || 'Failed to process blocked users list.');
      }
    } catch (error: any) {
      const message = error.message || "An error occurred while fetching blocked users.";
      console.error("Fetch blocked users failed:", error);
      setBlockError(message);
      toast.error(message);
    } finally {
      setIsLoadingBlockedUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  // Fetch Notification Settings
  const fetchNotificationSettings = useCallback(async () => {
    setIsLoadingNotificationSettings(true);
    setNotificationSettingsError(null);
    try {
      const headers = apiBase.createAuthHeaders();
      const response = await fetch('/api/notification_settings', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notification settings.' }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: FetchNotificationSettingsResponse = await response.json();

      if (data.success && data.settings) {
        const newNotificationStates = notificationTypes.reduce((acc, type) => {
          acc[type.id] = true; // Start with default true
          return acc;
        }, {} as Record<string, boolean>);
        
        data.settings.forEach(setting => {
          const uiType = notificationTypes.find(nt => nt.apiType === setting.type);
          if (uiType) {
            newNotificationStates[uiType.id] = setting.enabled;
          }
        });
        setIndividualNotifications(newNotificationStates);
      } else {
        throw new Error(data.message || 'Failed to process notification settings.');
      }
    } catch (error: any) {
      const message = error.message || "An error occurred while fetching notification settings.";
      console.error("Fetch notification settings failed:", error);
      setNotificationSettingsError(message);
      // Do not toast error here as it might be for initial load
    } finally {
      setIsLoadingNotificationSettings(false);
    }
  }, []); // Removed individualNotifications from dependency array

  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  // Debounced User Search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setUserSearchResults([]);
        setSearchError(null);
        setIsSearchingUsers(false);
        return;
      }
      setIsSearchingUsers(true);
      setSearchError(null);
      try {
        const response = await apiSearchUsers(query, 1, 5); // Limit to 5 results for this UI
        if (response.success && response.users) {
          setUserSearchResults(response.users.items.filter(
            // Filter out already blocked users from search results
            searchedUser => !blockedUsers.some(blockedUser => blockedUser.handle === searchedUser.handle)
          ));
        } else {
          setUserSearchResults([]);
          throw new Error(response.error || 'Failed to search users.');
        }
      } catch (error: any) {
        const message = error.message || "An error occurred during user search.";
        console.error("User search failed:", error);
        setSearchError(message);
        // Do not toast error here, as it can be annoying with debounced search
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500), // 500ms debounce
    [blockedUsers] // Re-create debounce if blockedUsers changes, to update filter
  );

  useEffect(() => {
    debouncedSearch(searchQueryToBlock);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQueryToBlock, debouncedSearch]);

  const handleBlockUser = async (userToBlock: SearchUserItem | { handle: string }) => {
    if (!userToBlock.handle) return;
    
    // Optimistically add to UI or indicate loading state for this user
    // For now, we will refetch the whole list after action

    try {
      const headers = apiBase.createAuthHeaders();
      const response = await fetch('/api/set_user_block_status', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          handle: userToBlock.handle,
          action: 'block',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to block ${userToBlock.handle}.` }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: SetBlockStatusResponse = await response.json();

      if (data.success) {
        toast.success(data.message || `User ${userToBlock.handle} has been blocked.`);
        await fetchBlockedUsers(); // Refetch the list
        setSearchQueryToBlock(''); // Clear search
        setUserSearchResults([]); // Clear search results
      } else {
        throw new Error(data.message || `Failed to block ${userToBlock.handle}.`);
      }
    } catch (error: any) {
      const message = error.message || `An error occurred while blocking ${userToBlock.handle}.`;
      console.error("Block user failed:", error);
      toast.error(message);
    }
  };

  const handleUnblockUser = async (handleToUnblock: string) => {
    try {
      const headers = apiBase.createAuthHeaders();
      const response = await fetch('/api/set_user_block_status', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          handle: handleToUnblock,
          action: 'unblock',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to unblock ${handleToUnblock}.` }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      const data: SetBlockStatusResponse = await response.json();

      if (data.success) {
        toast.success(data.message || `User ${handleToUnblock} has been unblocked.`);
        await fetchBlockedUsers(); // Refetch the list
      } else {
        throw new Error(data.message || `Failed to unblock ${handleToUnblock}.`);
      }
    } catch (error: any) {
      const message = error.message || `An error occurred while unblocking ${handleToUnblock}.`;
      console.error("Unblock user failed:", error);
      toast.error(message);
    }
  };

  const handleToggleIndividualNotification = async (notificationUiId: string, enabled: boolean) => {
    const uiType = notificationTypes.find(nt => nt.id === notificationUiId);
    if (!uiType) {
      console.error("Unknown notification type:", notificationUiId);
      toast.error("Could not update notification: Unknown type.");
      return;
    }

    const apiNotificationType = uiType.apiType;
    const action = enabled ? 'enable' : 'disable';

    // Optimistically update UI
    setIndividualNotifications(prev => ({ ...prev, [notificationUiId]: enabled }));

    try {
      const headers = apiBase.createAuthHeaders();
      const response = await fetch('/api/notification_settings', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          notification_type: apiNotificationType,
          action: action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to update ${uiType.label} setting.` }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: UpdateNotificationSettingResponse = await response.json();

      if (data.success) {
        toast.success(data.message || `${uiType.label} setting updated.`);
        // Update state based on the API response to ensure consistency
        setIndividualNotifications(prev => ({ ...prev, [notificationUiId]: data.enabled }));
      } else {
        throw new Error(data.message || `Failed to update ${uiType.label} setting.`);
      }
    } catch (error: any) {
      const message = error.message || `An error occurred while updating ${uiType.label}.`;
      console.error("Update notification setting failed:", error);
      toast.error(message);
      // Revert optimistic update if API call fails
      setIndividualNotifications(prev => ({ ...prev, [notificationUiId]: !enabled }));
    }
  };
  
  // Account Deletion Logic (moved from EditProfilePage)
  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      setDeleteError("Confirmation text is incorrect. Please type DELETE.");
      return;
    }
    
    setIsDeletingAccount(true);
    setDeleteError(null);
    
    try {
      const response = await fetch('/api/account/deactivate', { // Ensure this API endpoint is correct
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization headers if needed, e.g., from apiBase.getAuthHeaders()
        },
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(result.message || "Account deactivated successfully.");
        
        try {
          await apiBase.logoutCurrentDevice(); 
          console.log('Logged out from current device after deactivation.');
        } catch (logoutError) {
          console.error('Error during logout after deactivation:', logoutError);
          toast.warning('Could not fully clear session, but account is deactivated.');
        }

        navigate('/'); // Navigate to home or login page
        setIsDeleteDialogOpen(false); // Close modal on success
        
      } else {
        throw new Error(result.message || "Failed to deactivate account.");
      }
      
    } catch (error: any) {
      const message = error.message || "An error occurred during deactivation.";
      console.error("Account deactivation failed:", error);
      setDeleteError(message);
      toast.error(message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings - dapps.co</title>
        <meta name="description" content="Manage your account settings, notifications, and blocked users on Roar." />
      </Helmet>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mt-16 md:mt-20">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and control your experience.
          </p>
        </header>

        <div className="space-y-12">
          {/* Manage Blocked Users Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Manage Blocked Users
              </CardTitle>
              <CardDescription>
                Block users to prevent them from interacting with you or seeing your content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Search and Block Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search username to block (e.g., user_handle)"
                    value={searchQueryToBlock}
                    onChange={(e) => setSearchQueryToBlock(e.target.value)}
                    className="pl-8 flex-grow"
                  />
                </div>
                {isSearchingUsers && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {searchError && <p className="text-sm text-destructive">{searchError}</p>}
                
                {userSearchResults.length > 0 && (
                  <Card className="mt-2 border-border/50 shadow-sm">
                    <CardContent className="p-0">
                      <ul className="divide-y divide-border/30">
                        {userSearchResults.map(user => (
                          <li key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/20">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || undefined} alt={user.handle} />
                                <AvatarFallback>{user.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-foreground">@{user.handle}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleBlockUser(user)}>
                              Block
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                 {searchQueryToBlock.length > 1 && !isSearchingUsers && userSearchResults.length === 0 && !searchError && (
                   <p className="text-sm text-muted-foreground text-center py-2">No users found matching "{searchQueryToBlock}".</p>
                 )}
              </div>
              
              <Separator />
              
              <h3 className="text-md font-semibold text-foreground">Currently Blocked Users</h3>
              {isLoadingBlockedUsers && <Loader2 className="h-5 w-5 animate-spin my-4 text-primary" />}
              {blockError && !isLoadingBlockedUsers && <p className="text-sm text-destructive text-center py-4">{blockError}</p>}
              
              {!isLoadingBlockedUsers && !blockError && blockedUsers.length > 0 ? (
                <ul className="space-y-3">
                  {blockedUsers.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.handle} />
                          <AvatarFallback>{(user.name || user.handle).substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium text-foreground">{user.name || `@${user.handle}`}</span>
                          {user.name && <span className="text-xs text-muted-foreground block">@{user.handle}</span>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleUnblockUser(user.handle)}>
                        <UserX className="h-4 w-4 mr-1.5 sm:mr-0 md:mr-1.5" /> {/* Icon only on smaller screens */}
                        <span className="hidden md:inline">Unblock</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                !isLoadingBlockedUsers && !blockError && <p className="text-sm text-muted-foreground text-center py-4">You haven't blocked any users yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Stay updated, not overwhelmed. Choose what activities you want to hear about.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingNotificationSettings && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
              {notificationSettingsError && !isLoadingNotificationSettings && (
                <p className="text-sm text-destructive text-center py-4">{notificationSettingsError}</p>
              )}
              {!isLoadingNotificationSettings && !notificationSettingsError && notificationTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <div key={type.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-md hover:bg-muted/20 transition-colors">
                    <label htmlFor={`notif-${type.id}`} className="flex items-center gap-2 text-sm text-foreground">
                      <IconComponent className={`h-4 w-4 text-primary/80`} />
                      {type.label}
                    </label>
                    <Switch
                      id={`notif-${type.id}`}
                      checked={individualNotifications[type.id]}
                      onCheckedChange={(checked) => handleToggleIndividualNotification(type.id, checked)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Account Management Section - With Delete Account Modal */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This action is irreversible. All your data, posts, comments, and community interactions will be permanently deleted. 
                Your username may become available again. Please be absolutely sure before proceeding.
              </p>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Account Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible. To confirm, please type <strong>DELETE</strong> in the box below.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  {deleteError && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                      {deleteError}
                    </div>
                  )}

                  <Input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmationInput}
                    onChange={(e) => {
                      setDeleteConfirmationInput(e.target.value);
                      if (deleteError) setDeleteError(null); // Clear error on input change
                    }}
                    className="my-4 font-mono tracking-[0.3em] text-center placeholder:tracking-normal placeholder:text-center"
                    maxLength={6} 
                  />
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteError(null)} disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmationInput !== 'DELETE' || isDeletingAccount}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeletingAccount ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Yes, Delete My Account
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SettingsPage; 