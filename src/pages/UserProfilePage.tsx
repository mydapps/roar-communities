import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import useUserProfile from '@/hooks/useUserProfile';
import UserProfileHeader from '@/components/user/UserProfileHeader';
import UserCommunities from '@/components/user/UserCommunities';
import { UserPosts } from '@/components/user/UserPosts';
import EditProfileDialog from '@/components/user/EditProfileDialog';
import { UserProfile } from '@/utils/userApi';
import { useIsMobile } from '@/hooks/use-mobile';

const UserProfilePage = () => {
  const { handle = '' } = useParams<{ handle: string }>();
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    refreshProfile();
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
        <title>{profile ? `@${profile.handle} | Roar Communities` : 'Loading Profile...'}</title>
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
            onEdit={() => setEditDialogOpen(true)}
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
                  <TabsList className="w-full mb-6 bg-background border border-border/40 p-1">
                    <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                      Posts ({profile.post_count})
                    </TabsTrigger>
                    <TabsTrigger value="replies" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                      Replies ({profile.reply_count})
                    </TabsTrigger>
                    {/* Communities tab only on mobile */}
                    {isMobile && (
                      <TabsTrigger value="communities" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                        Communities ({profile.communities.length})
                      </TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="posts" className="space-y-4">
                    <UserPosts handle={profile.handle} />
                  </TabsContent>
                  
                  <TabsContent value="replies" className="space-y-4">
                    <div className="bg-muted/20 rounded-lg p-8 text-center border border-border/20">
                      <h3 className="text-muted-foreground font-medium">Replies will appear here</h3>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        The replies feature is coming soon
                      </p>
                    </div>
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
          
          {/* Edit Profile Dialog */}
          {profile && (
            <EditProfileDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              profile={profile}
              onProfileUpdated={handleProfileUpdated}
            />
          )}
        </div>
      ) : null}
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