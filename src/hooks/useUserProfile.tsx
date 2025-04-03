import { useState, useEffect } from 'react';
import { getUserProfile, UserProfile, followUser, unfollowUser } from '@/utils/userApi';
import { toast } from 'sonner';

export const useUserProfile = (handle: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Get current user handle from storage if available
  const currentUserHandle = localStorage.getItem('dapps_user_handle');
  
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getUserProfile(handle);
      
      if (response.success && response.user) {
        setProfile(response.user);
        // Check if this is the user's own profile
        setIsOwnProfile(currentUserHandle === response.user.handle);
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (error) {
      let message = 'Failed to load user profile';
      if (error instanceof Error) {
        message = error.message;
      }
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      setIsRefreshing(true);
      const response = await getUserProfile(handle);
      
      if (response.success && response.user) {
        setProfile(response.user);
      }
    } catch (error) {
      // Silently handle refresh errors
      console.error('Error refreshing profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      const response = await followUser(profile.handle);
      
      if (response.success) {
        // API now returns is_following flag directly
        const isNowFollowing = response.is_following === true;
        
        if (isNowFollowing) {
          toast.success(`Successfully followed @${profile.handle}`);
        } else {
          toast.success(`Successfully unfollowed @${profile.handle}`);
        }
        
        // Update local state based on the API response
        setProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            is_following: isNowFollowing,
            followers: isNowFollowing 
              ? prev.followers + 1 
              : Math.max(0, prev.followers - 1)
          };
        });
      } else {
        toast.error(response.message || 'Failed to follow user');
      }
    } catch (error) {
      let message = 'Failed to follow user';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    }
  };
  
  const handleUnfollow = async () => {
    if (!profile) return;
    
    try {
      const response = await unfollowUser(profile.handle);
      
      if (response.success) {
        toast.success(`Successfully unfollowed @${profile.handle}`);
        
        // Update local state
        setProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            is_following: false,
            followers: Math.max(0, prev.followers - 1)
          };
        });
      } else {
        toast.error(response.message || 'Failed to unfollow user');
      }
    } catch (error) {
      let message = 'Failed to unfollow user';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    }
  };

  // Fetch profile on mount or when handle changes
  useEffect(() => {
    if (handle) {
      fetchProfile();
    }
  }, [handle]);

  return {
    profile,
    isLoading,
    error,
    isRefreshing,
    isOwnProfile,
    refreshProfile,
    handleFollow,
    handleUnfollow
  };
};

export default useUserProfile; 