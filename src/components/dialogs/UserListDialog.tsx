import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, UserPlus, UserCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserProfile, UserProfile as FullUserProfile, followUser, unfollowUser } from '@/utils/userApi'; // To get is_following status
import { createAuthHeaders } from '@/utils/apiBase';
import { toast } from 'sonner';

interface PaginatedUser {
  id: number;
  handle: string;
  name?: string;
  avatar_url?: string | null;
  followed_at?: string;
  // We'll fetch this separately or manage it via a map
  is_followed_by_current_user?: boolean; 
}

interface UserListApiResponse {
  success: boolean;
  data: PaginatedUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    perPage: number;
    totalResults: number;
  };
  message?: string;
}

interface FollowUnfollowResponse {
  success: boolean;
  message?: string;
  is_following?: boolean;
}

interface UserListDialogProps {
  userHandle: string; // The handle of the user whose list is being viewed
  listType: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
  loggedInUserHandle?: string | null; // Handle of the currently logged-in user
}

const UserListDialog: React.FC<UserListDialogProps> = ({
  userHandle,
  listType,
  isOpen,
  onClose,
  loggedInUserHandle,
}) => {
  const [users, setUsers] = useState<PaginatedUser[]>([]);
  const [userFollowStatus, setUserFollowStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({}); // For follow/unfollow buttons

  const fetchUsers = useCallback(async (page: number, loadMore = false) => {
    if (!userHandle) return;
    if (loadMore) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);

    try {
      const endpoint = listType === 'followers'
        ? `/api/${userHandle}/followers?page=${page}&limit=20`
        : `/api/${userHandle}/following?page=${page}&limit=20`;
      
      const headers = createAuthHeaders();
      const response = await fetch(endpoint, { headers, credentials: 'include' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch ${listType}.` }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const result: UserListApiResponse = await response.json();

      if (result.success && result.data) {
        setUsers(prev => loadMore ? [...prev, ...result.data] : result.data);
        setCurrentPage(result.pagination.currentPage);
        setTotalPages(result.pagination.totalPages);

        // Fetch follow status for each user by current logged-in user, if logged in
        // This will now run for both 'followers' and 'following' list types.
        if (loggedInUserHandle) { 
          const newFollowStatus: Record<string, boolean> = {};
          for (const user of result.data) {
            if (user.handle === loggedInUserHandle) { 
              newFollowStatus[user.handle] = false; 
              continue;
            }
            if (userFollowStatus[user.handle] === undefined) { 
              try {
                const profileResponse = await getUserProfile(user.handle);
                if (profileResponse.success && profileResponse.user) {
                  newFollowStatus[user.handle] = !!profileResponse.user.is_following;
                }
              } catch (profileError) {
                console.error(`Failed to get profile for ${user.handle} to check follow status:`, profileError);
                newFollowStatus[user.handle] = false; 
              }
            }
          }
          setUserFollowStatus(prev => ({ ...prev, ...newFollowStatus }));
        }
      } else {
        throw new Error(result.message || `Failed to process ${listType} list.`);
      }
    } catch (err: any) {
      setError(err.message || `An error occurred while fetching ${listType}.`);
      // toast.error(err.message || `An error occurred while fetching ${listType}.`);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userHandle, listType, loggedInUserHandle]);

  useEffect(() => {
    if (isOpen) {
      setUsers([]); // Reset users on open
      setUserFollowStatus({}); // Reset follow statuses
      setCurrentPage(1);
      setTotalPages(1);
      fetchUsers(1);
    }
  }, [isOpen, userHandle, listType, fetchUsers]);


  const handleFollowToggle = async (targetUserHandle: string, currentlyFollowing: boolean) => {
    if (!loggedInUserHandle || loggedInUserHandle === targetUserHandle) return;

    setActionLoading(prev => ({ ...prev, [targetUserHandle]: true }));
    try {
      let response: FollowUnfollowResponse;
      if (currentlyFollowing) {
        response = await unfollowUser(targetUserHandle);
      } else {
        response = await followUser(targetUserHandle);
      }

      if (response.success) {
        toast.success(response.message || `Successfully updated follow status for @${targetUserHandle}`);
        setUserFollowStatus(prev => ({ ...prev, [targetUserHandle]: !!response.is_following }));
        
        // Potentially update the main profile's follower count if this dialog is for the loggedInUser's own following list
        // And the action changes their own following count. This is complex and might be better handled by a global state/event.
        // For now, this dialog primarily focuses on interaction with users *in the list*.
      } else {
        throw new Error(response.message || 'Failed to update follow status.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update follow status.');
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserHandle]: false }));
    }
  };
  
  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchUsers(currentPage + 1, true);
    }
  };

  const dialogTitle = listType.charAt(0).toUpperCase() + listType.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{dialogTitle} <span className="text-muted-foreground font-normal">(@{userHandle})</span></DialogTitle>
        </DialogHeader>
        <DialogClose asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
        </DialogClose>

        {isLoading && !isLoadingMore && (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="h-[300px] flex flex-col items-center justify-center p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchUsers(1)}>Retry</Button>
          </div>
        )}

        {!isLoading && !error && users.length === 0 && (
           <p className="text-muted-foreground text-center py-10 h-[300px]">
            No {listType} to display.
          </p>
        )}

        {!error && users.length > 0 && (
          <ScrollArea className="h-[300px] md:h-[400px] px-6">
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <Link to={`/u/${user.handle}`} onClick={onClose} className="flex items-center gap-3 group">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.handle} />
                      <AvatarFallback>{user.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold group-hover:underline">{user.name || user.handle}</p>
                      <p className="text-sm text-muted-foreground">@{user.handle}</p>
                    </div>
                  </Link>
                  {loggedInUserHandle && user.handle !== loggedInUserHandle && (
                    <Button
                      variant={userFollowStatus[user.handle] ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleFollowToggle(user.handle, !!userFollowStatus[user.handle])}
                      disabled={actionLoading[user.handle]}
                      className="w-[100px]"
                    >
                      {actionLoading[user.handle] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : userFollowStatus[user.handle] ? (
                        <UserCheck className="h-4 w-4 mr-1.5 sm:mr-0 md:mr-1.5" /> 
                      ) : (
                        <UserPlus className="h-4 w-4 mr-1.5 sm:mr-0 md:mr-1.5" /> 
                      )}
                      <span className="hidden md:inline">
                         {actionLoading[user.handle] ? '' : userFollowStatus[user.handle] ? 'Following' : 'Follow'}
                      </span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
             {isLoadingMore && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}
          </ScrollArea>
        )}
        
        {currentPage < totalPages && !isLoading && !isLoadingMore && users.length > 0 && (
            <DialogFooter className="p-6 pt-4 border-t">
                 <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="w-full">
                    {isLoadingMore ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Load More
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserListDialog;
 