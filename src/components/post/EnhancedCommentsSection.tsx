import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { fetchReplies, CommentReply, createReply, toggleMeow } from '@/utils/commentApi';
import { RefreshCw, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileReplyDrawer } from './MobileReplyDrawer';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';

interface EnhancedCommentsSectionProps {
  postCode: string;
  initialReplies?: CommentReply[];
  initialReplyCount?: number;
  postAuthorHandle: string;
}

export const EnhancedCommentsSection = ({
  postCode,
  initialReplies = [],
  initialReplyCount = 0,
  postAuthorHandle
}: EnhancedCommentsSectionProps) => {
  const [replies, setReplies] = useState<CommentReply[]>(initialReplies);
  const [replyCount, setReplyCount] = useState(initialReplyCount);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{
    id: number;
    handle: string;
    avatar?: string;
    content: string;
    isPost: boolean;
  } | null>(null);
  const isMobile = useIsMobile();
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");

  const fetchComments = useCallback(async () => {
    if (!postCode) return;
    
    setLoading(true);
    
    try {
      console.log(`Fetching comments for post ${postCode}`);
      const response = await fetchReplies(postCode, 20);
      
      if (response.success) {
        console.log('Fetched replies successfully:', response.replies);
        setReplies(response.replies);
        setReplyCount(response.total_count);
      } else {
        console.error('Failed to fetch replies:', response);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Could not load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [postCode]);
  
  useEffect(() => {
    if (initialReplies.length === 0) {
      fetchComments();
    }
  }, [fetchComments, initialReplies.length]);
  
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      console.log('Submitting comment to post:', postCode);
      const response = await createReply(postCode, newComment);
      
      if (!response.success && response.errCode === "004" && response.communityName) {
        setCommunityName(response.communityName);
        setNotInCommunitySheetOpen(true);
        setSubmitting(false);
        return;
      }
      
      if (response.success && response.reply_id) {
        console.log("Server returned reply_id:", response.reply_id);
        
        const newReply: CommentReply = {
          id: response.reply_id,
          uid: 0,
          handle: response.handle || localStorage.getItem('dapps_user_handle') || 'you',
          avatar_url: response.avatar_url || localStorage.getItem('dapps_user_avatar') || 'default',
          content: newComment,
          created_on: response.created_on || new Date().toISOString(),
          time_ago: 'just now',
          upvotes: 0,
          meow_count: 0,
          has_meowed: false,
          sub_replies: []
        };
        
        console.log("Created new comment with server-assigned ID:", newReply.id);
        
        setReplies(prev => [...prev, newReply]);
        setReplyCount(prev => prev + 1);
        setNewComment('');
        toast.success('Comment added successfully');
      } else {
        console.error('API response missing reply_id or success=false:', response);
        toast.error('Error adding comment. Please try again.');
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Could not post your comment. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReplyToComment = async (parentId: number, content: string) => {
    if (!content.trim()) {
      if (isMobile) {
        const findComment = (comments: CommentReply[], id: number): CommentReply | undefined => {
          for (const comment of comments) {
            if (comment.id === id) return comment;
            if (comment.sub_replies) {
              const found = findComment(comment.sub_replies, id);
              if (found) return found;
            }
          }
          return undefined;
        };
        
        const targetComment = findComment(replies, parentId);
        if (targetComment) {
          setReplyTarget({
            id: parentId,
            handle: targetComment.handle,
            avatar: targetComment.avatar_url,
            content: targetComment.content,
            isPost: false
          });
          setDrawerOpen(true);
        }
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    
    try {
      console.log(`Creating reply to comment ${parentId} with content: ${content}`);
      const response = await createReply(postCode, content, parentId);
      
      if (!response.success && response.errCode === "004" && response.communityName) {
        setCommunityName(response.communityName);
        setNotInCommunitySheetOpen(true);
        return Promise.resolve();
      }
      
      if (response.success && response.reply_id) {
        console.log('Reply created successfully with ID:', response.reply_id);
        
        const newReply: CommentReply = {
          id: response.reply_id,
          uid: 0,
          handle: response.handle || localStorage.getItem('dapps_user_handle') || 'you',
          avatar_url: response.avatar_url || localStorage.getItem('dapps_user_avatar') || 'default',
          content: content,
          created_on: response.created_on || new Date().toISOString(),
          time_ago: 'just now',
          upvotes: 0,
          meow_count: 0,
          has_meowed: false
        };
        
        console.log("Created new reply with server-assigned ID:", newReply.id);
        
        setReplies(prevReplies => {
          const addReplyToComment = (comments: CommentReply[]): CommentReply[] => {
            return comments.map(comment => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  sub_replies: comment.sub_replies 
                    ? [...comment.sub_replies, newReply] 
                    : [newReply]
                };
              } else if (comment.sub_replies) {
                return {
                  ...comment,
                  sub_replies: addReplyToComment(comment.sub_replies)
                };
              }
              return comment;
            });
          };
          
          return addReplyToComment(prevReplies);
        });
        
        setReplyCount(prev => prev + 1);
        toast.success('Reply added successfully');
      } else {
        console.error('API response missing reply_id or success=false:', response);
        toast.error('Error adding reply. Please try again.');
        console.log('API reported success=false or missing reply_id, refreshing comments');
        fetchComments();
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Could not post your reply. Please try again.');
      return Promise.reject(error);
    }
  };
  
  const handleMeowChange = async (commentId: number, newState: boolean) => {
    console.log(`Toggling meow for comment ID: ${commentId} to ${newState}`);
    
    if (!commentId || isNaN(commentId) || commentId <= 0) {
      console.error(`Invalid comment ID for meow toggle: ${commentId}`);
      toast.error('Cannot update reaction: Invalid comment ID');
      return;
    }
    
    const updatedReplies = updateMeowState(replies, commentId, newState);
    setReplies(updatedReplies);
    
    try {
      const response = await toggleMeow(commentId);
      console.log('Meow toggle response:', response);
      
      if (!response.success) {
        console.error(`Server returned success=false for meow toggle on comment ID ${commentId}`);
        throw new Error(`Server returned success=false for meow toggle`);
      }
    } catch (error) {
      console.error(`Error toggling meow for comment ID ${commentId}:`, error);
      const revertedReplies = updateMeowState(replies, commentId, !newState);
      setReplies(revertedReplies);
      toast.error('Could not update meow. Please try again.');
    }
  };
  
  const updateMeowState = (
    replyList: CommentReply[], 
    targetId: number, 
    newState: boolean
  ): CommentReply[] => {
    return replyList.map(reply => {
      if (reply.id === targetId) {
        return {
          ...reply,
          has_meowed: newState,
          meow_count: newState ? reply.meow_count + 1 : Math.max(0, reply.meow_count - 1)
        };
      }
      
      if (reply.sub_replies && reply.sub_replies.length > 0) {
        return {
          ...reply,
          sub_replies: updateMeowState(reply.sub_replies, targetId, newState)
        };
      }
      
      return reply;
    });
  };

  const openReplyDrawer = (id: number, handle: string, avatar: string, content: string, isPost: boolean = false) => {
    setReplyTarget({
      id,
      handle,
      avatar,
      content,
      isPost
    });
    setDrawerOpen(true);
  };

  const drawerSubmissionInProgress = useRef(false);

  const handleDrawerSubmit = async (content: string) => {
    if (!replyTarget || drawerSubmissionInProgress.current) return Promise.reject(new Error('No reply target or submission in progress'));
    
    drawerSubmissionInProgress.current = true;
    
    try {
      if (replyTarget.isPost) {
        setNewComment(content);
        await handleSubmitComment();
      } else {
        await handleReplyToComment(replyTarget.id, content);
      }
      
      setTimeout(() => {
        drawerSubmissionInProgress.current = false;
      }, 500);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error in drawer submit:', error);
      drawerSubmissionInProgress.current = false;
      return Promise.reject(error);
    }
  };

  const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Comments ({replyCount})</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fetchComments();
          }}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
      
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmitComment(e);
        }} 
        className="flex gap-3 bg-muted/20 p-4 rounded-lg border border-border/40"
      >
        <Avatar className="h-10 w-10 shrink-0 border border-muted/60">
          <AvatarImage src={`https://img.dapps.co/avatar/${userAvatar}.svg`} />
          <AvatarFallback>Y</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          {isMobile ? (
            <Button 
              type="button"
              variant="outline" 
              className="w-full justify-start text-muted-foreground font-normal"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openReplyDrawer(0, postAuthorHandle, userAvatar, "Main post", true);
              }}
            >
              Add a comment...
            </Button>
          ) : (
            <Textarea 
              placeholder="Add a comment..." 
              className="resize-none bg-background min-h-[80px]"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          {!isMobile && (
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className="gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Comment
              </Button>
            </div>
          )}
        </div>
      </form>
      
      {replies.length > 0 ? (
        <div className="space-y-6 pt-4 divide-y divide-border/20">
          {replies.map(reply => (
            <div key={reply.id} className="pt-6 first:pt-0">
              <EnhancedCommentItem 
                comment={reply}
                postAuthorHandle={postAuthorHandle}
                onMeowChange={handleMeowChange}
                onReply={handleReplyToComment}
                isMobile={isMobile}
                onOpenMobileReply={(commentId, handle, avatar, content) => {
                  openReplyDrawer(commentId, handle, avatar, content);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/20 rounded-lg border border-border/40">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
      
      {isMobile && replyTarget && (
        <MobileReplyDrawer 
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onSubmit={handleDrawerSubmit}
          targetUser={replyTarget.handle}
          targetUserAvatar={replyTarget.avatar}
          targetContent={replyTarget.content}
          isReplyingTo={replyTarget.isPost ? 'post' : 'comment'}
        />
      )}
      
      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </div>
  );
};
