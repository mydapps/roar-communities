import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { CommentReply, createReply } from '@/utils/commentApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';

interface CommentItemProps {
  user: string;
  text: string;
  timeAgo: string;
  avatarUrl?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ user, text, timeAgo, avatarUrl }) => {
  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={avatarUrl || `https://img.dapps.co/avatar/default.svg`} />
        <AvatarFallback>{user[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">{user}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm mt-1">{text}</p>
      </div>
    </div>
  );
};

interface CommentSectionProps {
  comments: CommentReply[];
  postCode: string;
  onAddComment: (comment: string | CommentReply) => void;
  username?: string;
  community?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ 
  comments, 
  postCode,
  onAddComment,
  username,
  community
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      const response = await createReply(postCode, newComment);
      
      // Check if user is not part of the community
      if (!response.success && response.errCode === "004" && response.communityName) {
        // Show the not in community modal
        setCommunityName(response.communityName);
        setNotInCommunitySheetOpen(true);
        setSubmitting(false);
        return;
      }
      
      if (response.success) {
        const newCommentData: CommentReply = {
          id: response.reply_id || 0,
          handle: response.handle || 'you',
          content: newComment,
          time_ago: response.created_on || 'just now',
          avatar_url: response.avatar_url || 'https://img.dapps.co/avatar/default.svg',
          created_on: response.created_on || new Date().toISOString(),
          uid: 0, // Default value
          upvotes: 0,
          meow_count: 0,
          has_meowed: false
        };
        
        onAddComment(newCommentData);
        setNewComment('');
        toast.success('Comment added successfully');
      } else {
        toast.error('Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleViewAllComments = () => {
    if (postCode) {
      if (community) {
        navigate(`/c/${community}/${postCode}`);
      } else if (username) {
        // Handle user post - navigate to /:handle/:postId
        const handle = username.split('.')[0]; // Remove domain part if present
        navigate(`/${handle}/${postCode}`);
      } else {
        // Fallback to generic post route
        navigate(`/post/${postCode}`);
      }
    }
  };
  
  return (
    <div className="space-y-3 mt-2">
      {comments.length > 0 && (
        <div className="space-y-1 divide-y divide-border/30">
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id}
              user={comment.handle}
              text={comment.content}
              timeAgo={comment.time_ago}
              avatarUrl={comment.avatar_url}
            />
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 items-end mt-3">
        <Textarea 
          placeholder="Add a comment..." 
          className="min-h-[60px] text-sm"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button 
          type="submit" 
          size="sm"
          className="shrink-0"
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      
      {comments.length > 0 && (
        <div className="text-center">
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={handleViewAllComments}
          >
            View all comments
          </Button>
        </div>
      )}
      
      {/* Modal that shows when user is not part of the community */}
      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </div>
  );
};
