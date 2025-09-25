import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { Post } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, User, Globe, TrendingUp, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { toggleRoar, fetchPosts, setupMirrorListener } from '@/utils/api';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';
import { usePreventZoom } from '@/hooks/usePreventZoom';
import { ProfileSuggestionModule } from '@/components/suggestions/ProfileSuggestionModule';
import NotificationPermissionModal from '@/components/notifications/NotificationPermissionModal';
import { useDeviceNotifications } from '@/hooks/useDeviceNotifications';
import { useNavigate } from 'react-router-dom';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { cn } from '@/lib/utils';

const SUGGESTION_INTERVAL = 7;
const MIN_POSTS_BEFORE_SUGGESTION = 3;
const POSTS_PER_PAGE = 10;

const FeedPage = () => {
  usePreventZoom();
  const navigate = useNavigate();
  
  // Check if username is set, redirect to avatar-handle if not
  useUsernameCheck();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [showProfileSuggestionModule, setShowProfileSuggestionModule] = useState(true);
  const requestInFlight = useRef(false);
  
  // Notification modal state
  const { isMobileApp, isRegistered, isEnabled } = useDeviceNotifications();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  const loadPosts = useCallback(async (pageNum: number, replacePosts = false) => {
    if (requestInFlight.current && !replacePosts) {
      console.log('[FeedPage] loadPosts bailed: request already in flight and not a replace operation.');
      return;
    }

    console.log(`[FeedPage] loadPosts called: pageNum=${pageNum}, replacePosts=${replacePosts}`);
    requestInFlight.current = true;
    setLoading(true);
    setError(null);

    try {
      const fetchedPosts = await fetchPosts({ 
        page: pageNum,
        limit: POSTS_PER_PAGE,
        personal: activeTab === "personal",
        trending: activeTab === "trending",
        global: activeTab === "global"
      });
      console.log(`[FeedPage] Fetched ${fetchedPosts.length} posts for page ${pageNum}.`);
      
      setPosts(prevPosts => {
        if (replacePosts) {
          console.log('[FeedPage] Replacing posts.');
          return fetchedPosts;
        } else {
          const existingCodes = new Set(prevPosts.map(p => p.code));
          const newUniquePosts = fetchedPosts.filter(p => !existingCodes.has(p.code));
          if (newUniquePosts.length === 0 && fetchedPosts.length > 0) {
              console.log('[FeedPage] Fetched posts were all duplicates or already present.');
          }
          console.log(`[FeedPage] Appending ${newUniquePosts.length} new unique posts to ${prevPosts.length} existing ones.`);
          return [...prevPosts, ...newUniquePosts];
        }
      });
      
      const newHasMore = fetchedPosts.length === POSTS_PER_PAGE;
      console.log(`[FeedPage] Setting hasMore to: ${newHasMore}`);
      setHasMore(newHasMore);

    } catch (err) {
      console.error('[FeedPage] Error loading posts:', err);
      setError('Failed to load posts. Please try again.');
      setHasMore(false);
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      console.log('[FeedPage] loadPosts finished.');
    }
  }, [activeTab, setPosts, setLoading, setError, setHasMore]);
  
  useEffect(() => {
    console.log(`[FeedPage] useEffect for page/tab/refreshKey change: page=${page}, activeTab=${activeTab}, refreshKey=${refreshKey}`);
    if (page === 1) {
      setShowProfileSuggestionModule(true);
      loadPosts(1, true);
    } else {
      loadPosts(page, false);
    }
  }, [page, activeTab, refreshKey, loadPosts]);
  
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const cleanup = setupMirrorListener(() => {
      setRefreshKey(prev => prev + 1);
    });
    
    return cleanup;
  }, []);
  
  // Check if we should show the notification permission modal
  useEffect(() => {
    // Simple check - wait for posts to load then check conditions
    if (loading) return;
    
    // Only for mobile app users  
    if (!isMobileApp) {
      console.log('[FeedPage] Not mobile app, skipping notification modal');
      return;
    }
    
    // Check if user has been prompted before
    const hasBeenPrompted = localStorage.getItem('dapps_notification_prompted') === 'true';
    if (hasBeenPrompted) {
      console.log('[FeedPage] User already prompted for notifications, skipping modal');
      return;
    }
    
    // Don't show if already registered and enabled (but only if we're sure)
    if (isRegistered && isEnabled) {
      console.log('[FeedPage] User already has notifications enabled, skipping modal');
      return;
    }
    
    console.log('[FeedPage] Conditions met, showing notification modal in 2 seconds');
    console.log('[FeedPage] isMobileApp:', isMobileApp);
    console.log('[FeedPage] isRegistered:', isRegistered); 
    console.log('[FeedPage] isEnabled:', isEnabled);
    console.log('[FeedPage] hasBeenPrompted:', hasBeenPrompted);
    
    // Show modal after a delay
    const timer = setTimeout(() => {
      console.log('[FeedPage] Showing notification permission modal');
      setShowNotificationModal(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isMobileApp, isRegistered, isEnabled, loading]);
  
  // Add event listener for mobile feed refresh
  useEffect(() => {
    const handleFeedRefresh = () => {
      console.log('[FeedPage] Feed refresh triggered from mobile navigation');
      handleRefresh();
    };

    window.addEventListener('feedRefresh', handleFeedRefresh);
    
    return () => {
      window.removeEventListener('feedRefresh', handleFeedRefresh);
    };
  }, []);
  
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasMore && !loading) {
        console.log('[FeedPage] Observer triggered: preparing to load next page.');
        setPage(prev => prev + 1);
      }
    };
    
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });
    
    if (loadingRef.current && hasMore) {
      observerRef.current.observe(loadingRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading]);
  
  const handleRefresh = () => {
    setPage(1);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleNewPost = (newPost: any) => {
    console.log('New post created:', newPost);
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };
  
  const handleRoar = async (postCode: string) => {
    if (!postCode) {
      console.error("Cannot roar post: missing postCode");
      toast.error("Unable to update post. Missing identifier.");
      return;
    }
    
    try {
      const response = await toggleRoar(postCode);
      
      if (typeof response === 'object' && 'errCode' in response && response.errCode === "004") {
        console.log('User is not part of the community:', response.community);
        setCommunityName(response.community);
        setNotInCommunitySheetOpen(true);
        
        setRefreshKey(prev => prev + 1);
        return;
      }
      
    } catch (error) {
      console.error("Error toggling roar:", error);
      toast.error("Error updating post. Please try again.");
      
      setRefreshKey(prev => prev + 1);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  const handleTabChange = (value: string) => {
    console.log(`[FeedPage] Tab changing from ${activeTab} to ${value}`);
    setActiveTab(value);
    setError(null);
    
    // Reset posts and pagination when switching tabs to ensure fresh data
    setPosts([]);
    setPage(1);
    setHasMore(true);
    
    // Force a refresh to get fresh data from API
    setRefreshKey(prev => prev + 1);
  };
  
  const handleDismissSuggestionModule = useCallback(() => {
    setShowProfileSuggestionModule(false);
    console.log('[FeedPage] ProfileSuggestionModule dismissed by user.');
  }, []);

  return (
    <div className={cn(
      // Responsive feed container strategy
      "mx-auto pt-8 pb-20 px-4",
      // Mobile: full width with padding
      "w-full max-w-none",
      // Tablet: moderate constraint for readability
      "sm:max-w-2xl",
      // Desktop: wider but still readable
      "md:max-w-3xl lg:max-w-4xl",
      // Large desktop: optimal reading width
      "xl:max-w-4xl 2xl:max-w-5xl",
      // Ultra-wide: cap for optimal reading experience
      "3xl:max-w-[900px]"
    )}>
      <div className="mb-6">
        <CreatePostCard onPostCreated={handleNewPost} />
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <div className="relative overflow-x-auto pb-2 no-scrollbar">
          <TabsList className="inline-flex w-auto min-w-full whitespace-nowrap grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-1.5 flex-shrink-0">
              <User className="h-3.5 w-3.5" />
              <span>Personal</span>
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-1.5 flex-shrink-0">
              <Globe className="h-3.5 w-3.5" />
              <span>Global</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1.5 flex-shrink-0">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Trending</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
          {error}
          <Button variant="link" onClick={handleRefresh} className="ml-2 p-0 h-auto">
            Try Again
          </Button>
        </div>
      )}
      
      <div className="space-y-4 mt-6">
        {posts.length > 0 ? (
          (() => {
            let suggestionModuleInstanceCount = 0;
            return posts.flatMap((post, index) => {
              const postComponent = (
            <Post
                  key={post.code ? `${post.code}-${refreshKey}-${activeTab}` : `new-post-${index}-${Date.now()}`}
              username={post.handle}
              avatar={post.avatar || ''}
              community={post.community}
              ticker={post.ticker}
              timeAgo={post.timeAgo}
              content={post.is_mirror === 1 ? (post.mirror_quote || '') : post.body}
              roarCount={post.upvotes}
              commentCount={post.reply_count}
              shareCount={0}
              postCode={post.code}
              roared={post.roar === 1 || post.has_upvoted === 1}
              onRoar={() => handleRoar(post.code)}
              images={post.images || (post.image === 1 ? [post.image_url] : undefined)}
              isMirror={post.is_mirror === 1}
              mirrorData={post.is_mirror === 1 ? {
                quote: post.mirror_quote || '',
                originalAuthor: post.original_author || '',
                originalCommunity: post.original_community || '',
                originalBody: post.original_body || '',
                originalTimeAgo: post.original_created_on || '',
                originalAvatar: post.original_author_avatar || '',
                originalImages: post.original_images || (post.original_image === 1 ? [post.original_image_url] : []),
                originalPostCode: post.original_post_code
              } : undefined}
              ipfs={post.ipfs}
              is_poll={Boolean(post.is_poll)}
              poll_data={post.poll_data || null}
              hasUserTipped={post.has_tipped === 1}
              is_dao_proposal={post.is_dao_proposal || false}
              dao_proposal_data={post.dao_proposal_data || null}
            />
              );

              console.log(`[FeedPage] Post Index: ${index}, showProfileSuggestionModule: ${showProfileSuggestionModule}, MinMet: ${(index + 1) >= MIN_POSTS_BEFORE_SUGGESTION}, IntervalMet: ${(index + 1) % SUGGESTION_INTERVAL === 0}, InstanceCount: ${suggestionModuleInstanceCount}`);

              const componentsToReturn = [postComponent];

              if (
                  showProfileSuggestionModule && 
                  (index + 1) >= MIN_POSTS_BEFORE_SUGGESTION && 
                  (index + 1) % SUGGESTION_INTERVAL === 0
              ) {
                suggestionModuleInstanceCount++;
                console.log(`[FeedPage] RENDERING ProfileSuggestionModule at index ${index}, Instance: ${suggestionModuleInstanceCount}`);
                componentsToReturn.push(
                  <ProfileSuggestionModule 
                    key={`profile-suggestions-${activeTab}-${refreshKey}-${suggestionModuleInstanceCount}`} 
                    fetchPageNumber={suggestionModuleInstanceCount}
                    onDismiss={handleDismissSuggestionModule}
                    initialLimit={8}
                  />
                );
              }
              return componentsToReturn;
            });
          })()
        ) : (
          !loading && !error && (
            <div className="text-center py-8 border rounded-lg bg-background/50 w-full">
              <p className="text-muted-foreground">No posts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "personal" 
                  ? "Join some communities to see posts here" 
                  : "No posts available at the moment"}
              </p>
            </div>
          )
        )}
        
        <div 
          className="flex justify-center py-8"
          ref={loadingRef}
        >
          {loading && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
          
          {!loading && !hasMore && posts.length > 0 && (
            <p className="text-sm text-muted-foreground">You've reached the end</p>
          )}
        </div>
      </div>
      
      {showScrollToTop && (
        <Button
          className="fixed bottom-24 right-4 md:bottom-8 rounded-full h-12 w-12 shadow-lg flex items-center justify-center"
          onClick={scrollToTop}
          size="icon"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
      
      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
      
      <NotificationPermissionModal
        isOpen={showNotificationModal}
        onClose={() => {
          console.log('[FeedPage] Modal onClose called');
          setShowNotificationModal(false);
        }}
        onPermissionGranted={() => {
          console.log('Notification permission granted!');
        }}
      />
    </div>
  );
};

export default FeedPage;
