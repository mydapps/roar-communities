import React, { useRef, useEffect, useState } from 'react';
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
  
  // State to track locally roared posts
  const [roaredPosts, setRoaredPosts] = useState<Record<string, boolean>>({});
  // State to track locally updated roar counts
  const [roarCounts, setRoarCounts] = useState<Record<string, number>>({});
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  
  // Handle roar/upvote on posts
  const handleRoar = async (postCode: string) => {
    try {
      console.log(`Toggling roar for post: ${postCode}`);
      
      // Find current post to check its status before update
      const currentPost = posts.find(p => p.code === postCode);
      if (!currentPost) return;
      
      const currentRoarStatus = roaredPosts[postCode] ?? currentPost.has_upvoted ?? false;
      const currentCount = roarCounts[postCode] ?? currentPost.upvotes ?? 0;
      
      // Calculate new count for optimistic update
      const newCount = currentRoarStatus ? currentCount - 1 : currentCount + 1;
      
      // Update UI immediately (optimistic update)
      setRoaredPosts(prev => ({
        ...prev,
        [postCode]: !currentRoarStatus
      }));
      
      // Update roar count
      setRoarCounts(prev => ({
        ...prev,
        [postCode]: newCount
      }));
      
      // Make API call
      const result = await toggleRoar(postCode);
      console.log(`Toggle roar result:`, result);
      
      if (result === false) {
        // If the API call fails, revert the optimistic update
        setRoaredPosts(prev => ({
          ...prev,
          [postCode]: currentRoarStatus
        }));
        
        // Revert roar count
        setRoarCounts(prev => ({
          ...prev,
          [postCode]: currentCount
        }));
        
        toast.error('Failed to update post. Please try again.');
      }
    } catch (error) {
      console.error('Error roaring post:', error);
      toast.error('Failed to roar. Please try again.');
      
      // Find current post to revert its status on error
      const currentPost = posts.find(p => p.code === postCode);
      if (currentPost) {
        setRoaredPosts(prev => ({
          ...prev,
          [postCode]: currentPost.has_upvoted ?? false
        }));
        
        // Revert roar count
        setRoarCounts(prev => ({
          ...prev,
          [postCode]: currentPost.upvotes
        }));
      }
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
  
  // Initialize roaredPosts state from loaded posts
  useEffect(() => {
    if (posts.length > 0) {
      const initialRoaredState = posts.reduce((acc, post) => {
        acc[post.code] = post.has_upvoted;
        return acc;
      }, {} as Record<string, boolean>);
      
      const initialRoarCounts = posts.reduce((acc, post) => {
        acc[post.code] = post.upvotes;
        return acc;
      }, {} as Record<string, number>);
      
      setRoaredPosts(prev => ({
        ...prev,
        ...initialRoaredState
      }));
      
      setRoarCounts(prev => ({
        ...prev,
        ...initialRoarCounts
      }));
    }
  }, [posts]);
  
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
      {posts.map((post) => {
        // Ensure is_mirror is properly converted to boolean
        const isMirrorPost = post.is_mirror === 1 || Boolean(post.is_mirror);
        
        // Use local state for roar status if available, otherwise use API value
        const isRoared = roaredPosts[post.code] !== undefined 
          ? roaredPosts[post.code] 
          : post.has_upvoted;
        
        // Use local state for roar count if available, otherwise use API value
        const roarCount = roarCounts[post.code] !== undefined
          ? roarCounts[post.code]
          : post.upvotes;
        
        return (
          <Post
            key={`post-${post.code}`}
            username={post.author.handle}
            avatar={post.author.avatar || ''}
            community={post.community || undefined}
            timeAgo={post.time_ago}
            content={post.body} // Using body instead of title as requested
            roarCount={roarCount}
            commentCount={post.comments}
            shareCount={0}
            postCode={post.code}
            roared={isRoared}
            onRoar={() => handleRoar(post.code)}
            images={post.images && post.images.length > 0 
              ? post.images 
              : (post.image === 1 && post.image_url ? [post.image_url] : undefined)}
            video={post.has_video === 1 ? post.image_url : undefined}
            // Mirror-related props
            isMirror={isMirrorPost}
            mirrorData={isMirrorPost ? {
              quote: post.mirror_quote || '',
              originalAuthor: post.original_author || '',
              originalCommunity: post.original_community || '',
              originalBody: post.original_body || '',
              originalTimeAgo: post.original_created_on || '',
              originalAvatar: post.original_author_avatar || '',
              originalImages: post.original_images || [],
              originalTitle: post.original_title || ''
            } : undefined}
            // Pass poll data
            is_poll={post.is_poll}
            poll_data={post.poll_data}
            // Enable comments functionality
            hideComments={false}
            isLoggedIn={true} // Assume logged in since we're viewing profile
            // Tipping functionality
            tipCount={0} // TODO: Add tip count from API if available
            hasUserTipped={post.has_tipped === 1}

          />
        );
      })}
      
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