
import React, { useState, useCallback } from 'react';
import { CommentReply, toggleMeow } from '@/utils/commentApi';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { MobileCommentInput } from './MobileCommentInput';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  // Handle meow (like) on a comment
  const handleMeowChange = async (commentId: number, newState: boolean) => {
    try {
      // Optimistically update UI
      setMeowedComments(prev => ({
        ...prev,
        [commentId]: newState
      }));
      
      // API call to update meow state
      await toggleMeow(commentId);
    } catch (error) {
      console.error('Error toggling meow:', error);
      // Revert optimistic update on error
      setMeowedComments(prev => ({
        ...prev,
        [commentId]: !newState
      }));
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
    // Scroll to make sure the reply input is visible
    setTimeout(() => {
      window.scrollTo({ 
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }, []);

  // Cancel reply mode
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Main comment submission handler
  const handleSubmit = async (content: string, parentId?: number) => {
    if (!content.trim()) return;
    
    try {
      await onAddComment(content, parentId);
      setReplyingTo(null);
      onRefresh();
    } catch (error) {
      console.error('Error submitting comment:', error);
      throw error; // Let the input component handle the error
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Comments list */}
      <div className="space-y-6 mb-24">
        {replies.length > 0 ? (
          <div className="space-y-6 divide-y divide-border/20">
            {replies.map(reply => (
              <div key={reply.id} className="pt-6 first:pt-0">
                <EnhancedCommentItem 
                  comment={reply}
                  postAuthorHandle={postAuthorHandle}
                  onMeowChange={handleMeowChange}
                  // Fix: This needs to return a Promise<void> for the parentId and content
                  onReply={(parentId: number, content: string) => Promise.resolve()}
                  isMobile={true}
                  onOpenMobileReply={(id, handle, avatar, content) => 
                    handleOpenReply(id, handle, content)
                  }
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
    </>
  );
};
