import React from 'react';
import { UserProfile } from '@/utils/userApi';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Link as LinkIcon, MapPin, Calendar, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserProfileShare } from './UserProfileShare';

interface UserProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onEdit: () => void;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  onFollow,
  onUnfollow,
  onEdit
}) => {
  const defaultBgImage = 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?q=80&w=2670&auto=format&fit=crop';
  const bgImage = profile.background_image || defaultBgImage;
  
  return (
    <div className="relative pb-5">
      {/* Background Image with Overlay - added top padding to avoid navbar overlap */}
      <div className="relative h-44 sm:h-64 md:h-80 lg:h-96 w-full overflow-hidden pt-16 sm:pt-16 md:pt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat top-16 sm:top-16 md:top-16"
          style={{ 
            backgroundImage: `url(${bgImage})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 top-16 sm:top-16 md:top-16" />
        
        {/* Edit background button for own profile */}
        {isOwnProfile && (
          <Button 
            onClick={onEdit}
            variant="outline" 
            size="sm"
            className="absolute top-20 sm:top-20 md:top-20 right-4 bg-background/80 backdrop-blur-sm hover:bg-background/90 z-10 shadow-md"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit Profile
          </Button>
        )}
      </div>
      
      {/* Profile Info Card (overlaps with background) */}
      <div className="container max-w-4xl mx-auto px-4">
        <div className="relative -mt-20 sm:-mt-24 md:-mt-32 bg-card shadow-lg rounded-xl border border-border/30 overflow-hidden backdrop-blur-sm">
          <div className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 flex justify-center md:justify-start">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar_url} alt={profile.handle} />
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/90 to-primary/50 text-white">
                    {profile.handle.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-4">
                {/* Header: Name and Follow Button */}
                <div className="flex flex-col md:flex-row gap-2 justify-between items-center md:items-start">
                  <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                      @{profile.handle}
                      {/* Roar Holdings Badge - prominently placed next to username */}
                      <Badge 
                        className="bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white text-xs px-2 py-0.5 ml-2"
                      >
                        {profile.formatted_roar_holdings} 🦁
                      </Badge>
                    </h1>
                    {profile.is_founding_user && (
                      <Badge className="bg-amber-500/20 text-amber-600 border-amber-200 mt-1">
                        <Sparkles className="h-3 w-3 mr-1" /> OG Member
                      </Badge>
                    )}
                  </div>

                  {/* Action buttons: Share and Follow/Unfollow */}
                  <div className="flex gap-2 items-center">
                    {/* Show follows you badge if the profile user follows the current user */}
                    {profile.is_followed_by && !isOwnProfile && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Follows you
                      </Badge>
                    )}
                    
                    {/* Share button using the new UserProfileShare component */}
                    <UserProfileShare handle={profile.handle} />
                    
                    {/* Follow/Unfollow Button (not shown for own profile) */}
                    {!isOwnProfile && (
                      profile.is_following ? (
                        <Button 
                          onClick={onUnfollow}
                          variant="outline"
                          className="shadow-sm border-primary/30 hover:bg-primary/5"
                        >
                          Following
                        </Button>
                      ) : (
                        <Button 
                          onClick={onFollow}
                          className="shadow-sm"
                        >
                          Follow
                        </Button>
                      )
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium justify-center md:justify-start">
                  <div className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="font-semibold">{profile.followers.toLocaleString()}</span>
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="font-semibold">{profile.followings.toLocaleString()}</span>
                    <span className="text-muted-foreground">Following</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="font-semibold">{profile.post_count.toLocaleString()}</span>
                    <span className="text-muted-foreground">Posts</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="font-semibold">{profile.communities.length.toLocaleString()}</span>
                    <span className="text-muted-foreground">Communities</span>
                  </div>
                </div>
                
                {/* Additional profile details */}
                <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.link && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-3.5 w-3.5" />
                      <a href={profile.link.startsWith('http') ? profile.link : `https://${profile.link}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-primary hover:underline"
                      >
                        {profile.link.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </div>
                  )}
                  
                  {profile.profile_updated_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Updated {formatDistanceToNow(new Date(profile.profile_updated_at))} ago</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chicken joke answer - moved outside of profile card for better visibility */}
        {profile.answer && (
          <div className="mt-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 shadow-sm border border-primary/10">
            <div className="flex flex-col">
              <div className="text-primary font-medium mb-2 text-sm md:text-base">Why did the chicken cross the road?</div>
              <div className="font-medium text-card-foreground text-base md:text-lg leading-relaxed italic">
                "{profile.answer}"
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileHeader; 