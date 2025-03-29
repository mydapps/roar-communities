
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MobileCommentInputProps {
  postCode: string;
  isReplyMode?: boolean;
  replyToComment?: {
    id: number;
    author: string;
    content: string;
  };
  onSubmit: (content: string, parentId?: number) => Promise<void>;
  onCancel?: () => void;
}

export const MobileCommentInput: React.FC<MobileCommentInputProps> = ({
  postCode,
  isReplyMode = false,
  replyToComment,
  onSubmit,
  onCancel
}) => {
  const [isExpanded, setIsExpanded] = useState(isReplyMode);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Get user info from localStorage
  const userAvatar = localStorage.getItem('dapps_user_avatar') || 'default';
  const isLoggedIn = !!localStorage.getItem('dapps_user_key');

  useEffect(() => {
    // Auto-focus the textarea when expanded
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle when users click on the input area
  const handleInputClick = () => {
    if (!isLoggedIn) {
      toast.error('Please log in to comment', {
        description: 'You need to be logged in to join the conversation',
        action: {
          label: 'Login',
          onClick: () => navigate('/index')
        }
      });
      return;
    }
    setIsExpanded(true);
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, replyToComment?.id);
      setContent('');
      if (!isReplyMode) {
        setIsExpanded(false);
      } else if (onCancel) {
        onCancel();
      }
      toast.success(isReplyMode ? 'Reply posted' : 'Comment posted');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post your comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel (for reply mode)
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setIsExpanded(false);
      setContent('');
    }
  };

  // Truncate comment content for reply preview
  const truncateContent = (text: string, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-background border-t border-border/60 transition-all duration-300 ease-in-out z-50',
        isExpanded ? 'h-auto pt-3 pb-16 px-4' : 'h-16 p-3'
      )}
      style={{
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}
    >
      {isReplyMode && isExpanded && replyToComment && (
        <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
          <div>
            <span className="font-medium">Replying to @{replyToComment.author.split('.')[0]}: </span>
            <span>{truncateContent(replyToComment.content)}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6" 
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex gap-3 items-start">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={`https://img.dapps.co/avatar/${userAvatar}.svg`} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 relative">
          {isExpanded ? (
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isReplyMode ? `Reply to @${replyToComment?.author.split('.')[0]}...` : "Add a comment..."}
              className="w-full min-h-[80px] p-3 rounded-lg border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-sm bg-background resize-none"
            />
          ) : (
            <div 
              className="w-full p-3 rounded-lg border border-border/60 bg-background text-muted-foreground text-sm cursor-pointer flex items-center h-10"
              onClick={handleInputClick}
            >
              Join the conversation
            </div>
          )}
          
          {isExpanded && (
            <Button
              size="sm"
              className="absolute bottom-2 right-2 h-8 w-8 rounded-full p-0"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
