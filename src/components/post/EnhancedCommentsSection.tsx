
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { fetchReplies, CommentReply, createReply, toggleMeow } from '@/utils/commentApi';
import { RefreshCw, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileReplyDrawer } from './MobileReplyDrawer';

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
  // Mobile reply drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{
    id: number;
    handle: string;
    avatar?: string;
    content: string;
    isPost: boolean;
  } | null>(null);
  const isMobile = useIsMobile();

  // Fetch replies
  const fetchComments = useCallback(async () => {
    if (!postCode) return;
    
    setLoading(true);
    
    try {
      const response = await fetchReplies(postCode);
      
      if (response.success) {
        setReplies(response.replies);
        setReplyCount(response.total_count);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Could not load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [postCode]);
  
  useEffect(() => {
    // Only fetch if we don't have initial replies
    if (initialReplies.length === 0) {
      fetchComments();
    }
  }, [fetchComments, initialReplies.length]);
  
  // Handle comment submission
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      // Parent ID 0 means top-level comment
      await createReply(postCode, newComment);
      setNewComment('');
      fetchComments(); // Refresh comments after submission
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Could not post your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle reply to a comment
  const handleReplyToComment = async (parentId: number, content: string) => {
    if (!content.trim()) {
      // If on mobile and no content is provided, we're just opening the drawer
      if (isMobile) {
        // Find the comment being replied to
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
      await createReply(postCode, content, parentId);
      fetchComments(); // Refresh comments to show new reply
      toast.success('Reply added successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Could not post your reply. Please try again.');
      return Promise.reject(error);
    }
  };
  
  // Handle meow (like/unlike) on a comment
  const handleMeowChange = async (commentId: number, newState: boolean) => {
    const updatedReplies = updateMeowState(replies, commentId, newState);
    setReplies(updatedReplies);
    
    try {
      await toggleMeow(commentId);
    } catch (error) {
      console.error('Error toggling meow:', error);
      // Revert on error
      const revertedReplies = updateMeowState(replies, commentId, !newState);
      setReplies(revertedReplies);
      toast.error('Could not update meow. Please try again.');
    }
  };
  
  // Helper function to update meow state in nested replies
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

  // Mobile drawer handlers
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

  const handleDrawerSubmit = async (content: string) => {
    if (!replyTarget) return Promise.reject(new Error('No reply target'));
    
    if (replyTarget.isPost) {
      // If replying to the post itself
      setNewComment(content);
      await handleSubmitComment();
    } else {
      // If replying to a comment
      await handleReplyToComment(replyTarget.id, content);
    }
    return Promise.resolve();
  };
  
  // Get user avatar from localStorage
  const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Comments ({replyCount})</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchComments}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
      
      <form onSubmit={handleSubmitComment} className="flex gap-3 bg-muted/20 p-4 rounded-lg border border-border/40">
        <Avatar className="h-10 w-10 shrink-0 border border-muted/60">
          <AvatarImage src={`https://img.dapps.co/avatar/${userAvatar}.svg`} />
          <AvatarFallback>Y</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          {isMobile ? (
            <Button 
              variant="outline" 
              className="w-full justify-start text-muted-foreground font-normal"
              onClick={() => openReplyDrawer(0, postAuthorHandle, userAvatar, "Main post", true)}
            >
              Add a comment...
            </Button>
          ) : (
            <Textarea 
              placeholder="Add a comment..." 
              className="resize-none bg-background min-h-[80px]"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
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
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/20 rounded-lg border border-border/40">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
      
      {/* Mobile Reply Drawer */}
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
    </div>
  );
};
