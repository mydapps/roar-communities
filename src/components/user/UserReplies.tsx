import React, { useRef, useEffect } from 'react';
import { useUserReplies } from '@/hooks/useUserReplies';
import { UserReplyData } from '@/utils/userApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Reply } from 'lucide-react';
import { Post } from '@/components/feed/Post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toggleMeow } from '@/utils/commentApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UserRepliesProps {
  handle: string;
}

export const UserReplies: React.FC<UserRepliesProps> = ({ handle }) => {
  const { 
    replies, 
    loading, 
    error, 
    loadMore, 
    hasMore,
    totalReplies,
    refreshReplies
  } = useUserReplies({ handle });
  
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  
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
  
  const handleReplyMeow = async (replyId: number) => {
    try {
      await toggleMeow(replyId);
      refreshReplies(); // Refresh to get updated state
    } catch (error) {
      toast.error('Failed to update reply. Please try again.');
    }
  };

  // Navigate to the original post when clicked
  const navigateToPost = (replyData: UserReplyData) => {
    const { post } = replyData;
    if (post.community) {
      navigate(`/c/${post.community.toLowerCase().replace(/\s+/g, '-')}/${post.code}`);
    } else {
      navigate(`/${post.author.handle.split('.')[0]}/${post.code}`);
    }
  };
  
  // Function to extract just the handle part from avatar URL
  const extractAvatarHandle = (avatarUrl: string): string => {
    if (!avatarUrl) return '';
    
    // Handle both https://img.dapps.co/avatar/handle.svg and handle formats
    if (avatarUrl.includes('/avatar/')) {
      const match = avatarUrl.match(/\/avatar\/([^.]+)/);
      return match ? match[1] : '';
    }
    
    return avatarUrl;
  };
  
  if (loading && replies.length === 0) {
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
          onClick={refreshReplies}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (replies.length === 0 && !loading) {
    return (
      <div className="text-center py-12 border rounded-lg bg-background/50">
        <p className="text-lg font-medium">No replies yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          This user hasn't replied to any posts yet
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 mt-6">
      {replies.map((replyData) => {
        try {
          // Debug: Log raw data for first item
          if (replies.indexOf(replyData) === 0) {
            console.log('First reply data:', JSON.stringify(replyData, null, 2));
          }
          
          // Make sure we have all required data with fallbacks
          const postAuthor = replyData.post.author || { handle: 'unknown', avatar: '' };
          const replyAuthor = replyData.reply.author || { handle: handle, avatar: '' };
          
          const postAvatarHandle = extractAvatarHandle(postAuthor.avatar);
          const replyAvatarHandle = extractAvatarHandle(replyAuthor.avatar);
          
          return (
            <Card key={`reply-${replyData.reply.id}`} className="overflow-hidden border border-border/40 shadow-sm">
              {/* Original post */}
              <Post
                username={postAuthor.handle}
                avatar={postAvatarHandle}
                community={replyData.post.community || undefined}
                timeAgo={replyData.post.time_ago}
                content={replyData.post.body}
                roarCount={replyData.post.upvotes}
                commentCount={replyData.post.comments}
                shareCount={0}
                postCode={replyData.post.code}
                disableNavigation={true} // Prevent automatic navigation
                images={replyData.post.images && replyData.post.images.length > 0 
                  ? replyData.post.images 
                  : (replyData.post.image === 1 && replyData.post.image_url ? [replyData.post.image_url] : undefined)}
                video={replyData.post.has_video === 1 ? replyData.post.image_url : undefined}
                hideComments={true}
                // Tipping functionality
                tipCount={0} // TODO: Add tip count from API if available
                hasUserTipped={replyData.post.has_tipped === 1}
              />
              
              {/* User's reply */}
              <div 
                onClick={() => navigateToPost(replyData)}
                className="px-4 py-3 border-t border-border/30 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center">
                      <Reply className="h-4 w-4 text-primary mr-2" />
                      <Avatar className="h-7 w-7">
                        <AvatarImage 
                          src={replyAuthor.avatar}
                          alt={replyAuthor.handle}
                        />
                        <AvatarFallback className="text-xs">
                          {(replyAuthor.handle).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">@{replyAuthor.handle}</span>
                        <span className="text-xs text-muted-foreground">{replyData.reply.time_ago}</span>
                      </div>
                      
                      <p className="text-sm mt-1">{replyData.reply.content}</p>
                      
                      <div className="flex items-center mt-2 gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplyMeow(replyData.reply.id);
                          }}
                        >
                          <span className="text-base mr-1.5" role="img" aria-label="cat">
                            🐱
                          </span>
                          <span>{replyData.reply.meow_count}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        } catch (error) {
          console.error('Error rendering reply:', error, replyData);
          return null; // Skip rendering this reply if there's an error
        }
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
      {!hasMore && replies.length > 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {replies.length === totalReplies 
            ? `Showing all ${totalReplies} replies` 
            : `Showing ${replies.length} of ${totalReplies} replies`}
        </div>
      )}
    </div>
  );
}; 