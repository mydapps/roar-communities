import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import useUserProfile from '@/hooks/useUserProfile';
import UserProfileHeader from '@/components/user/UserProfileHeader';
import UserCommunities from '@/components/user/UserCommunities';
import { UserPosts } from '@/components/user/UserPosts';
import { UserReplies } from '@/components/user/UserReplies';
import { UserProfile } from '@/utils/userApi';
import { useIsMobile } from '@/hooks/use-mobile';
import UserListDialog from '@/components/dialogs/UserListDialog';

const UserProfilePage = () => {
  const { handle = '' } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const {
    profile,
    isLoading,
    error,
    isRefreshing,
    isOwnProfile,
    refreshProfile,
    handleFollow,
    handleUnfollow
  } = useUserProfile(handle);
  
  const [activeTab, setActiveTab] = useState('posts');
  const isMobile = useIsMobile();
  const [currentUserHandle, setCurrentUserHandle] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current user handle from storage once on mount
    const storedHandle = localStorage.getItem('dapps_user_handle');
    setCurrentUserHandle(storedHandle);
  }, []);

  const [isUserListDialogOpen, setIsUserListDialogOpen] = useState(false);
  const [currentUserListType, setCurrentUserListType] = useState<'followers' | 'following' | null>(null);

  const openUserListDialog = (type: 'followers' | 'following') => {
    setCurrentUserListType(type);
    setIsUserListDialogOpen(true);
  };

  const closeUserListDialog = () => {
    setIsUserListDialogOpen(false);
    setCurrentUserListType(null);
  };
  
  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    refreshProfile();
  };
  
  const handleEditProfile = () => {
    navigate('/edit-profile');
  };
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-destructive/90 mb-4">{error}</p>
          <Button variant="outline" asChild>
            <Link to="/communities">Back to Communities</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{profile ? `@${profile.handle} | dapps.co` : 'Loading Profile...'}</title>
        {profile && (
          <>
            <meta name="description" content={`Check out @${profile.handle}'s profile on dapps.co. ${profile.answer ? `"${profile.answer}"` : ''}${profile.location ? ` Located in ${profile.location}.` : ''} Join the conversation!`} />
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="profile" />
            <meta property="og:title" content={`@${profile.handle} | dapps.co`} />
            <meta property="og:description" content={`Check out @${profile.handle}'s profile on dapps.co. ${profile.answer ? `"${profile.answer}"` : ''} Join the conversation!`} />
            <meta property="og:image" content={profile.avatar_url} />
            <meta property="og:url" content={`https://dapps.co/u/${profile.handle}`} />
            <meta property="og:site_name" content="dapps.co" />
            <meta property="profile:username" content={profile.handle} />
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`@${profile.handle} | dapps.co`} />
            <meta name="twitter:description" content={`Check out @${profile.handle}'s profile on dapps.co. ${profile.answer ? `"${profile.answer}"` : ''} Join the conversation!`} />
            <meta name="twitter:image" content={profile.avatar_url} />
            <meta name="twitter:site" content="@dappsco" />
            
            {/* Additional SEO tags */}
            <link rel="canonical" href={`https://dapps.co/u/${profile.handle}`} />
            <meta name="robots" content="index, follow" />
            <meta name="author" content={profile.handle} />
            {profile.location && <meta name="geo.placename" content={profile.location} />}
          </>
        )}
      </Helmet>
      
      {isLoading ? (
        <ProfileSkeleton />
      ) : profile ? (
        <div className="bg-background min-h-screen pb-20">
          {/* Profile Header with Background */}
          <UserProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            onEdit={handleEditProfile}
            onOpenFollowers={() => openUserListDialog('followers')}
            onOpenFollowing={() => openUserListDialog('following')}
          />
          
          {/* Main content */}
          <div className="container max-w-4xl mx-auto px-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sidebar - Only visible on desktop */}
              {!isMobile && (
                <div className="md:col-span-1 space-y-6">
                  <UserCommunities communities={profile.communities} />
                </div>
              )}
              
              {/* Main content area */}
              <div className="md:col-span-2">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                  <div className="relative overflow-x-auto pb-2 no-scrollbar">
                    <TabsList className="inline-flex w-auto min-w-full justify-start mb-6 bg-background border border-border/40 p-1 whitespace-nowrap">
                      <TabsTrigger value="posts" className="flex-shrink-0 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                        Posts ({profile.post_count})
                      </TabsTrigger>
                      <TabsTrigger value="replies" className="flex-shrink-0 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                        Replies ({profile.reply_count})
                      </TabsTrigger>
                      {/* Communities tab only on mobile */}
                      {isMobile && (
                        <TabsTrigger value="communities" className="flex-shrink-0 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                          Communities ({profile.communities.length})
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                  
                  <TabsContent value="posts" className="space-y-4">
                    <UserPosts handle={profile.handle} />
                  </TabsContent>
                  
                  <TabsContent value="replies" className="space-y-4">
                    <UserReplies handle={profile.handle} />
                  </TabsContent>
                  
                  {/* Mobile-only communities tab content */}
                  {isMobile && (
                    <TabsContent value="communities" className="space-y-4">
                      <UserCommunities communities={profile.communities} />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* User List Dialog */}
      {currentUserListType && (
        <UserListDialog 
          userHandle={handle} 
          listType={currentUserListType}
          isOpen={isUserListDialogOpen}
          onClose={closeUserListDialog}
          loggedInUserHandle={currentUserHandle}
        />
      )}
    </>
  );
};

const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Header skeleton - added padding to avoid navbar overlap */}
      <div className="relative pt-16">
        <Skeleton className="h-64 md:h-80 w-full" />
        
        <div className="container max-w-4xl mx-auto px-4">
          <div className="relative -mt-24 md:-mt-32 bg-card shadow-lg rounded-xl border border-border/50 overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full mx-auto md:mx-0" />
                
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row gap-2 justify-between items-center md:items-start">
                    <div className="text-center md:text-left">
                      <Skeleton className="h-8 w-40 mx-auto md:mx-0" />
                      <Skeleton className="h-4 w-20 mt-2 mx-auto md:mx-0" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-10" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </div>
                  
                  <div className="flex justify-center md:justify-start gap-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Question & answer skeleton */}
          <Skeleton className="h-24 w-full mt-4 rounded-xl" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="container max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="hidden md:block md:col-span-1 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 