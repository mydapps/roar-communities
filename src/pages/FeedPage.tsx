import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Post } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, User, Globe, TrendingUp, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { toggleRoar, fetchPosts, setupMirrorListener } from '@/utils/api';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';
import { usePreventZoom } from '@/hooks/usePreventZoom';

const FeedPage = () => {
  usePreventZoom();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh
  const [activeTab, setActiveTab] = useState<string>("personal");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");
  
  const loadPosts = useCallback(async (pageNum: number, replace = false) => {
    try {
      const fetchedPosts = await fetchPosts({ 
        page: pageNum,
        personal: activeTab === "personal",
        trending: activeTab === "trending",
        global: activeTab === "global"
      });
      
      if (replace) {
        setPosts(fetchedPosts);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }
      
      setHasMore(fetchedPosts.length > 0);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);
  
  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadPosts(1, true);
  }, [loadPosts, refreshKey, activeTab]);
  
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const cleanup = setupMirrorListener(() => {
      setRefreshKey(prev => prev + 1); // Force a refresh
    });
    
    return cleanup;
  }, []);
  
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1);
        loadPosts(page + 1);
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
  }, [hasMore, loading, page, loadPosts]);
  
  const handleRefresh = () => {
    setPage(1);
    setRefreshKey(prev => prev + 1); // Force a refresh
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
      
      // Check if the error is due to not being part of the community
      if (typeof response === 'object' && 'errCode' in response && response.errCode === "004") {
        console.log('User is not part of the community:', response.community);
        setCommunityName(response.community);
        setNotInCommunitySheetOpen(true);
        
        // Force refresh to ensure UI shows correct roar count
        setRefreshKey(prev => prev + 1);
        return;
      }
      
      // If successful, no need to do anything as the Post component handles the UI update
      
    } catch (error) {
      console.error("Error toggling roar:", error);
      toast.error("Error updating post. Please try again.");
      
      // Force refresh to ensure UI shows correct roar count
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
    setActiveTab(value);
    setError(null);
  };
  
  return (
    <div className="max-w-2xl mx-auto pt-8 pb-20 px-4">
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
          posts.map((post, index) => (
            <Post
              key={post.code ? `${post.code}-${refreshKey}` : `new-post-${index}-${Date.now()}`}
              username={post.handle}
              avatar={post.avatar || ''}
              community={post.community}
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
                originalImages: post.original_images || [],
                originalTitle: post.original_title || ''
              } : undefined}
              ipfs={post.ipfs}
            />
          ))
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
    </div>
  );
};

export default FeedPage;
