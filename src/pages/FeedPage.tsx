import React, { useState, useEffect, useCallback } from 'react';
import { Post } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { fetchPosts, setupMirrorListener } from '@/utils/api';

const FeedPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh
  
  const loadPosts = useCallback(async (pageNum: number, replace = false) => {
    setLoading(true);
    setError(null);
    
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
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadPosts(page + 1);
    }
  };
  
  const handleRefresh = () => {
    setPage(1);
    setRefreshKey(prev => prev + 1); // Force a refresh
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <div className="max-w-2xl mx-auto pt-8 pb-20 px-4">
      <CreatePostCard onPostCreated={handleRefresh} />
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
          {error}
          <Button variant="link" onClick={handleRefresh} className="ml-2 p-0 h-auto">
            Try Again
          </Button>
        </div>
      )}
      
      <div className="space-y-4 mt-6">
        {posts.map((post) => (
          <Post
            key={`${post.code}-${refreshKey}`}
            username={post.handle}
            avatar={post.avatar || ''}
            community={post.community}
            timeAgo={post.timeAgo}
            content={post.body}
            roarCount={post.upvotes}
            commentCount={post.reply_count}
            shareCount={0}
            postCode={post.code}
            roared={post.roar === 1}
            images={post.multiple_images === 1 ? post.images : (post.image === 1 ? [post.image_url] : undefined)}
            isMirror={post.is_mirror === 1}
            mirrorData={post.is_mirror === 1 ? {
              quote: post.mirror_quote || '',
              originalAuthor: post.original_author || '',
              originalCommunity: post.original_community || '',
              originalBody: post.original_body || '',
              originalTimeAgo: post.original_created_on || '',
              originalAvatar: post.original_author_avatar || '',
              originalImages: post.original_images || []
            } : undefined}
            ipfs={post.ipfs}
          />
        ))}
        
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
        
        {!loading && posts.length === 0 && (
          <div className="text-center py-8 border rounded-lg bg-background/50">
            <p className="text-muted-foreground">No posts found</p>
            <p className="text-sm text-muted-foreground mt-1">Join some communities to see posts here</p>
          </div>
        )}
        
        {!loading && hasMore && (
          <div className="flex justify-center pt-4">
            <Button onClick={handleLoadMore} variant="outline" className="w-full">
              Load More
            </Button>
          </div>
        )}
        
        {!loading && !hasMore && posts.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">You've reached the end</p>
          </div>
        )}
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
