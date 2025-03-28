import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Post } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';
import { fetchPosts, setupMirrorListener, toggleRoar } from '@/utils/api';
import { toast } from 'sonner';

const FeedPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  const loadPosts = useCallback(async (pageNum: number, replace = false) => {
    try {
      const fetchedPosts = await fetchPosts({ 
        page: pageNum,
        personal: true 
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
  }, []);
  
  useEffect(() => {
    setLoading(true);
    loadPosts(1, true);
  }, [loadPosts, refreshKey]);
  
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
      const success = await toggleRoar(postCode);
      if (!success) {
        toast.error("Failed to update post. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling roar:", error);
      toast.error("Error updating post. Please try again.");
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <div className="max-w-2xl mx-auto pt-8 pb-20 px-4">
      <CreatePostCard onPostCreated={handleNewPost} />
      
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
              roared={post.roar === 1}
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
              <p className="text-sm text-muted-foreground mt-1">Join some communities to see posts here</p>
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
    </div>
  );
};

export default FeedPage;
