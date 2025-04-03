import React, { useRef, useEffect } from 'react';
import { useUserPosts } from '@/hooks/useUserPosts';
import { Post } from '@/components/feed/Post';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toggleRoar } from '@/utils/postApi';
import { toast } from 'sonner';

interface UserPostsProps {
  handle: string;
}

export const UserPosts: React.FC<UserPostsProps> = ({ handle }) => {
  const { 
    posts, 
    loading, 
    error, 
    loadMore, 
    hasMore,
    totalPosts,
    refreshPosts
  } = useUserPosts({ handle });
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  
  // Handle roar/upvote on posts
  const handleRoar = async (postCode: string) => {
    try {
      await toggleRoar(postCode);
      refreshPosts(); // Refresh posts to get updated state
    } catch (error) {
      console.error('Error roaring post:', error);
      toast.error('Failed to roar. Please try again.');
    }
  };
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (loading) return;
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, { threshold: 0.5 });
    
    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadMore]);
  
  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 border rounded-lg bg-background/50">
        <p className="text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={refreshPosts}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-12 border rounded-lg bg-background/50">
        <p className="text-lg font-medium">No posts yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          This user hasn't posted any content yet
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 mt-6">
      {posts.map((post) => (
        <Post
          key={`post-${post.code}`}
          username={post.author.handle}
          avatar={post.author.avatar || ''}
          community={post.community || undefined}
          timeAgo={post.time_ago}
          content={post.body} // Using body instead of title as requested
          roarCount={post.upvotes}
          commentCount={post.comments}
          shareCount={0}
          postCode={post.code}
          roared={post.has_upvoted}
          onRoar={() => handleRoar(post.code)}
          images={post.images && post.images.length > 0 
            ? post.images 
            : (post.image === 1 && post.image_url ? [post.image_url] : undefined)}
          video={post.has_video === 1 ? post.image_url : undefined}
        />
      ))}
      
      {/* Loading indicator & intersection observer target */}
      {hasMore && (
        <div 
          ref={loadingRef} 
          className="w-full py-4 flex justify-center"
        >
          {loading && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
        </div>
      )}
      
      {/* End of content message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {posts.length === totalPosts 
            ? `Showing all ${totalPosts} posts` 
            : `Showing ${posts.length} of ${totalPosts} posts`}
        </div>
      )}
    </div>
  );
}; 