import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, Plus, Users, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export interface SuggestedUser {
  handle: string;
  avatar: string;
  followers: number;
  location?: string;
  answer: string;
  OG: 'yes' | 'no';
  isFollowing?: boolean; // Optional: initial follow status
}

interface ProfileSuggestionCardProps {
  user: SuggestedUser;
  onFollowToggle?: (handle: string, isNowFollowing: boolean) => void;
}

export const ProfileSuggestionCard: React.FC<ProfileSuggestionCardProps> = ({ user, onFollowToggle }) => {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsFollowing(user.isFollowing || false);
  }, [user.isFollowing]);

  const handleFollowToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/follow/${user.handle}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: { success: boolean; message: string; is_following: boolean; error?: string } = await response.json();

      if (response.ok && data.success) {
        setIsFollowing(data.is_following);
        toast({
          title: data.is_following ? 'Followed' : 'Unfollowed',
          description: `${data.is_following ? 'Successfully followed' : 'Successfully unfollowed'} @${user.handle}.`,
        });
        if (onFollowToggle) {
          onFollowToggle(user.handle, data.is_following);
        }
      } else {
        throw new Error(data.message || data.error || 'Failed to update follow status.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred while updating follow status.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg shadow-sm bg-card text-card-foreground w-60 min-w-[220px] max-w-[240px] h-full">
      <Link to={`/u/${user.handle}`} className="flex flex-col items-center text-center w-full">
        <Avatar className="w-20 h-20 mb-3">
          <AvatarImage src={user.avatar} alt={`@${user.handle}`} />
          <AvatarFallback>
            {user.handle.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center">
          <h3 className="font-semibold text-lg hover:underline truncate" title={user.handle}>{user.handle}</h3>
          {user.OG === 'yes' && (
            <Sparkles className="w-4 h-4 ml-1 text-yellow-500 flex-shrink-0" fill="currentColor" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-2 h-[32px] w-full" title={user.answer}>
          {user.answer}
        </p>
      </Link>
      
      <div className="flex items-center text-xs text-muted-foreground my-3 w-full justify-center flex-wrap min-h-[16px]">
        {user.followers > 0 && (
          <>
            <Users className="w-3 h-3 mr-1 flex-shrink-0" />
            {user.followers} followers
          </>
        )}
        {user.location && (
          <>
            {user.followers > 0 && <span className="mx-1.5">·</span>}
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate" title={user.location}>{user.location.split(',')[0]}</span>
          </>
        )}
      </div>

      <Button 
        onClick={handleFollowToggle} 
        disabled={isLoading} 
        variant={isFollowing ? 'outline' : 'default'}
        className="w-full mt-auto"
        size="sm"
      >
        {isLoading ? (
          <span className="animate-pulse">Processing...</span>
        ) : isFollowing ? (
          <>
            <Check className="w-4 h-4 mr-2" /> Following
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" /> Follow
          </>
        )}
      </Button>
    </div>
  );
}; 