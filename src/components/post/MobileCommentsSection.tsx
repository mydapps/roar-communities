import React, { useState, useCallback, useEffect } from 'react';
import { CommentReply, toggleMeow, createReply } from '@/utils/commentApi';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { MobileCommentInput } from './MobileCommentInput';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';

interface MobileCommentsSectionProps {
  postCode: string;
  postAuthorHandle: string;
  replies: CommentReply[];
  onAddComment: (content: string, parentId?: number) => Promise<void>;
  onRefresh: () => void;
}

export const MobileCommentsSection: React.FC<MobileCommentsSectionProps> = ({
  postCode,
  postAuthorHandle,
  replies,
  onAddComment,
  onRefresh
}) => {
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    author: string;
    content: string;
  } | null>(null);
  const [meowedComments, setMeowedComments] = useState<Record<number, boolean>>({});
  const [localReplies, setLocalReplies] = useState<CommentReply[]>(replies);
  const isMobile = useIsMobile();
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");

  // Update local replies when prop changes
  useEffect(() => {
    setLocalReplies(replies);
  }, [replies]);

  // Handle meow (like) on a comment
  const handleMeowChange = async (commentId: number, newState: boolean) => {
    try {
      // Verify we have a valid numeric ID before proceeding
      if (!commentId || isNaN(commentId) || commentId <= 0) {
        console.error(`Invalid comment ID for meow toggle in mobile: ${commentId}`);
        toast.error('Cannot update reaction: Invalid comment ID');
        return;
      }
      
      console.log(`Mobile - Toggling meow for comment ID: ${commentId} to ${newState}`);
      
      // Update optimistically in UI first
      setMeowedComments(prev => ({
        ...prev,
        [commentId]: newState
      }));
      
      // Update comment's meow count in local state
      setLocalReplies(prevReplies => {
        const updateMeowCount = (comments: CommentReply[]): CommentReply[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                has_meowed: newState,
                meow_count: newState ? comment.meow_count + 1 : Math.max(0, comment.meow_count - 1)
              };
            }
            if (comment.sub_replies) {
              return {
                ...comment,
                sub_replies: updateMeowCount(comment.sub_replies)
              };
            }
            return comment;
          });
        };
        return updateMeowCount(prevReplies);
      });
      
      // API call to update meow state
      const response = await toggleMeow(commentId);
      
      if (!response.success) {
        throw new Error(`Server returned success=false for meow toggle`);
      }
    } catch (error) {
      console.error(`Error toggling meow for comment ID ${commentId}:`, error);
      // Revert optimistic update on error
      setMeowedComments(prev => ({
        ...prev,
        [commentId]: !newState
      }));
      
      // Revert the count update too
      setLocalReplies(prevReplies => {
        const revertMeowCount = (comments: CommentReply[]): CommentReply[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                has_meowed: !newState,
                meow_count: !newState ? comment.meow_count + 1 : Math.max(0, comment.meow_count - 1)
              };
            }
            if (comment.sub_replies) {
              return {
                ...comment,
                sub_replies: revertMeowCount(comment.sub_replies)
              };
            }
            return comment;
          });
        };
        return revertMeowCount(prevReplies);
      });
      
      toast.error('Failed to update reaction');
    }
  };

  // Open reply input for a specific comment
  const handleOpenReply = useCallback((commentId: number, handle: string, content: string) => {
    setReplyingTo({
      id: commentId,
      author: handle,
      content
    });
    // Removed the scrolling behavior that was causing poor UX
  }, []);

  // Cancel reply mode
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Main comment submission handler - NOW DELEGATES TO PARENT
  const handleSubmit = async (content: string, parentId?: number): Promise<void> => {
    // Basic validation before passing up
    if (!content.trim()) {
      toast.error('Comment cannot be empty.');
      return Promise.reject(new Error('Comment cannot be empty'));
    }

    try {
      console.log(`Mobile - Passing comment/reply to parent: parentId=${parentId}, content length=${content.length}`);
      
      // Create an optimistic comment/reply
      const userHandle = localStorage.getItem('dapps_user_handle') || 'you';
      const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
      
      // Create optimistic reply object
      const optimisticReply: CommentReply = {
        id: -Date.now(), // Temporary negative ID to identify it as optimistic
        uid: Number(localStorage.getItem('dapps_user_id') || '0'),
        handle: userHandle,
        avatar_url: userAvatar,
        content: content,
        created_on: new Date().toISOString(),
        time_ago: 'just now',
        upvotes: 0,
        meow_count: 0,
        has_meowed: false,
        sub_replies: []
      };
      
      // Update UI optimistically
      if (parentId) {
        // This is a reply to an existing comment
        setLocalReplies(prevReplies => {
          const addReplyToComment = (comments: CommentReply[]): CommentReply[] => {
            return comments.map(comment => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  sub_replies: comment.sub_replies 
                    ? [...comment.sub_replies, optimisticReply] 
                    : [optimisticReply]
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
      } else {
        // This is a top-level comment
        setLocalReplies(prevReplies => [...prevReplies, optimisticReply]);
      }
      
      // Call the parent handler to process the actual API call
      await onAddComment(content, parentId);
      
      // Clear reply mode after successful submission (assuming success from parent)
      setReplyingTo(null);
      
    } catch (error) {
      console.error('Error submitting comment via parent:', error);
      // Remove optimistic comment in case of failure
      setLocalReplies(prevReplies => {
        const removeOptimisticReply = (comments: CommentReply[]): CommentReply[] => {
          return comments.filter(comment => comment.id >= 0).map(comment => {
            if (comment.sub_replies) {
              return {
                ...comment,
                sub_replies: removeOptimisticReply(comment.sub_replies)
              };
            }
            return comment;
          });
        };
        
        return removeOptimisticReply(prevReplies);
      });
      throw error; // Re-throw to allow input component to handle isSubmitting state
    }
  };

  // Modified to match the expected function signature
  const handleReplySubmit = useCallback((parentId: number, content: string) => {
    return handleSubmit(content, parentId);
  }, [handleSubmit]);

  // Handle a reply to comment by opening the drawer
  const handleOpenMobileReply = useCallback((id: number, handle: string, content: string) => {
    handleOpenReply(id, handle, content);
  }, [handleOpenReply]);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Comments list */}
      <div className="space-y-6 mb-24">
        {localReplies.length > 0 ? (
          <div className="space-y-6 divide-y divide-border/20">
            {localReplies.map(reply => (
              <div key={reply.id} className="pt-6 first:pt-0">
                <EnhancedCommentItem 
                  comment={reply}
                  postAuthorHandle={postAuthorHandle}
                  onMeowChange={handleMeowChange}
                  onReply={handleReplySubmit}
                  isMobile={true}
                  onOpenMobileReply={handleOpenMobileReply}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-lg border border-border/40">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
      
      {/* Floating comment input */}
      <MobileCommentInput
        postCode={postCode}
        isReplyMode={!!replyingTo}
        replyToComment={replyingTo || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancelReply}
      />

      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </>
  );
};
