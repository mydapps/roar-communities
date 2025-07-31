import React from 'react';
import { UserProfile } from '@/utils/userApi';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Link as LinkIcon, MapPin, Calendar, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserProfileShare } from './UserProfileShare';
import DMButton from './DMButton';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onEdit: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  onFollow,
  onUnfollow,
  onEdit,
  onOpenFollowers,
  onOpenFollowing
}) => {
  const defaultBgImage = 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?q=80&w=2670&auto=format&fit=crop';
  const bgImage = profile.background_image || defaultBgImage;
  const isMobile = useIsMobile();
  
  return (
    <div className="relative pb-5">
      {/* Mobile-First Banner Design */}
      <div className="relative w-full overflow-hidden">
        {/* Dynamic banner height - much taller on mobile for visual impact */}
        <div className="relative h-72 sm:h-80 md:h-96 lg:h-[28rem] w-full">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${bgImage})`,
          }}
        />
          {/* Enhanced gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
        
          {/* Edit background button - repositioned for better mobile UX */}
        {isOwnProfile && (
          <Button 
            onClick={onEdit}
            variant="outline" 
            size="sm"
              className="absolute top-20 right-4 bg-black/30 backdrop-blur-sm text-white border-white/30 hover:bg-black/50 hover:border-white/50 z-10 shadow-lg transition-all duration-200"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit Profile
          </Button>
        )}
          
          {/* Mobile: Avatar and basic info overlaid on banner bottom */}
          {isMobile && (
            <div className="absolute bottom-6 left-4 right-4 z-10">
              <div className="flex items-end gap-4">
                {/* Large avatar with glow effect */}
                <Avatar className="h-24 w-24 border-4 border-white shadow-2xl ring-4 ring-white/20">
                  <AvatarImage src={profile.avatar_url} alt={profile.handle} />
                  <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-primary/90 to-primary/50 text-white">
                    {profile.handle.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Name and badge on banner */}
                <div className="flex-1 pb-2">
                  <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                    @{profile.handle}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white text-xs px-2 py-1 shadow-lg"
                    >
                      {profile.formatted_roar_holdings} 🦁
                    </Badge>
                    {profile.is_founding_user && (
                      <Badge className="bg-amber-400/90 text-amber-900 border-none shadow-lg">
                        <Sparkles className="h-3 w-3 mr-1" /> OG
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="container max-w-4xl mx-auto px-4">
        {/* Mobile: Clean action buttons card below banner */}
        {isMobile ? (
          <div className="space-y-4 mt-4">
            {/* Action buttons - beautifully stacked for mobile */}
            {!isOwnProfile && (
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 border border-border/30 shadow-lg">
                {/* Follows you badge - prominent when applicable */}
                {profile.is_followed_by && (
                  <div className="mb-3">
                    <Badge className="bg-primary/15 text-primary border-primary/30 px-3 py-1 text-sm font-medium">
                      ✨ Follows you
                    </Badge>
                  </div>
                )}
                
                {/* Primary action: Follow button - full width for easy tapping */}
                <div className="space-y-3">
                  {profile.is_following ? (
                    <Button 
                      onClick={onUnfollow}
                      variant="outline"
                      size="lg"
                      className="w-full h-12 text-base font-medium border-primary/30 hover:bg-primary/5 shadow-sm"
                    >
                      Following
                    </Button>
                  ) : (
                    <Button 
                      onClick={onFollow}
                      size="lg"
                      className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    >
                      Follow
                    </Button>
                  )}
                  
                  {/* Secondary actions: Message and Share - side by side with proper spacing */}
                  <div className="grid grid-cols-2 gap-3">
                    <DMButton 
                      userHandle={profile.handle}
                      variant="outline"
                      size="lg"
                      className="h-11 text-sm font-medium"
                    />
                    <div className="flex justify-end">
                      <UserProfileShare handle={profile.handle} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Stats card - clean and organized */}
            <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-5 border border-border/30 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div 
                  className="p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={onOpenFollowers}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onOpenFollowers()}
                >
                  <div className="text-xl font-bold text-card-foreground">{profile.followers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div 
                  className="p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={onOpenFollowing}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onOpenFollowing()}
                >
                  <div className="text-xl font-bold text-card-foreground">{profile.followings.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
                <div className="p-3 rounded-xl">
                  <div className="text-xl font-bold text-card-foreground">{profile.post_count.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="p-3 rounded-xl">
                  <div className="text-xl font-bold text-card-foreground">{profile.communities.length.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Communities</div>
                </div>
              </div>
            </div>
            
            {/* Profile details card */}
            {(profile.location || profile.link || profile.profile_updated_at) && (
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-5 border border-border/30 shadow-sm">
                <div className="space-y-3 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.link && (() => {
                    const baseUrl = profile.link.startsWith('http') ? profile.link : `https://${profile.link}`;
                    let finalUrl = baseUrl;

                    try {
                      const parsedUrl = new URL(baseUrl);
                      if (!parsedUrl.searchParams.has('loadIn')) {
                        parsedUrl.searchParams.append('loadIn', 'defaultBrowser');
                        finalUrl = parsedUrl.toString();
                      }
                    } catch (e) {
                      console.error("Failed to parse profile link URL:", baseUrl, e);
                      if (!baseUrl.includes('loadIn=defaultBrowser')) {
                        if (baseUrl.includes('?')) {
                          finalUrl = `${baseUrl}&loadIn=defaultBrowser`;
                        } else {
                          finalUrl = `${baseUrl}?loadIn=defaultBrowser`;
                        }
                      }
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        <a href={finalUrl} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-primary hover:underline break-all"
                        >
                          {profile.link.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    );
                  })()}
                  
                  {profile.profile_updated_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDistanceToNow(new Date(profile.profile_updated_at))} ago</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Original layout (enhanced but kept similar) */
          <div className="relative -mt-32 bg-card shadow-lg rounded-xl border border-border/30 overflow-hidden backdrop-blur-sm">
            <div className="p-6">
              <div className="flex flex-row gap-6">
              {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar_url} alt={profile.handle} />
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/90 to-primary/50 text-white">
                    {profile.handle.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-4">
                {/* Header: Name and Follow Button */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-2">
                      @{profile.handle}
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

                    {/* Desktop action buttons - improved spacing */}
                    <div className="flex gap-3 items-center">
                    {profile.is_followed_by && !isOwnProfile && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Follows you
                      </Badge>
                    )}
                    
                    <UserProfileShare handle={profile.handle} />
                    
                    {!isOwnProfile && (
                      <DMButton 
                        userHandle={profile.handle}
                        variant="outline"
                        size="default"
                      />
                    )}
                    
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
                            className="shadow-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
                        >
                          Follow
                        </Button>
                      )
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium">
                  <div 
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    onClick={onOpenFollowers}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenFollowers()}
                  >
                    <span className="font-semibold">{profile.followers.toLocaleString()}</span>
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  <div 
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    onClick={onOpenFollowing}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenFollowing()}
                  >
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
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.link && (() => {
                    const baseUrl = profile.link.startsWith('http') ? profile.link : `https://${profile.link}`;
                    let finalUrl = baseUrl;

                    try {
                      const parsedUrl = new URL(baseUrl);
                      if (!parsedUrl.searchParams.has('loadIn')) {
                        parsedUrl.searchParams.append('loadIn', 'defaultBrowser');
                        finalUrl = parsedUrl.toString();
                      }
                    } catch (e) {
                      console.error("Failed to parse profile link URL:", baseUrl, e);
                      if (!baseUrl.includes('loadIn=defaultBrowser')) {
                        if (baseUrl.includes('?')) {
                          finalUrl = `${baseUrl}&loadIn=defaultBrowser`;
                        } else {
                          finalUrl = `${baseUrl}?loadIn=defaultBrowser`;
                        }
                      }
                    }

                    return (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-3.5 w-3.5" />
                        <a href={finalUrl} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-primary hover:underline"
                      >
                        {profile.link.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </div>
                    );
                  })()}
                  
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
        )}
        
        {/* About Me section - enhanced for mobile */}
        {profile.about && (
          <div className="mt-4 bg-card/95 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-border/30">
            <div className="flex flex-col">
              <div className="text-muted-foreground font-medium mb-3 text-sm">About</div>
              <div className="text-card-foreground text-base leading-relaxed">
                {profile.about}
              </div>
            </div>
          </div>
        )}
        
        {/* Chicken joke answer - enhanced styling */}
        {profile.answer && (
          <div className="mt-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 shadow-sm border border-primary/10">
            <div className="flex flex-col">
              <div className="text-primary font-medium mb-3 text-sm">Why did the chicken cross the road?</div>
              <div className="font-medium text-card-foreground text-base leading-relaxed italic">
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