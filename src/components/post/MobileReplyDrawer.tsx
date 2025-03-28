
import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X, Loader2 } from 'lucide-react';

interface MobileReplyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string) => Promise<void>;
  targetUser: string;
  targetUserAvatar?: string;
  targetContent: string;
  isReplyingTo: 'post' | 'comment';
}

export const MobileReplyDrawer: React.FC<MobileReplyDrawerProps> = ({
  open,
  onOpenChange,
  onSubmit,
  targetUser,
  targetUserAvatar = 'default',
  targetContent,
  isReplyingTo
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(replyContent);
      setReplyContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvatarUrl = (avatarPath: string) => {
    if (avatarPath.includes('https://img.dapps.co/avatar/')) {
      return avatarPath;
    }
    return `https://img.dapps.co/avatar/${avatarPath}.svg`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Reply to {targetUser}</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DrawerTitle>
          <div className="mt-4 border-l-2 border-primary/20 pl-4 py-2 bg-muted/30 rounded-md">
            <div className="flex gap-2 items-start">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={getAvatarUrl(targetUserAvatar)} />
                <AvatarFallback>{targetUser[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{targetUser}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{targetContent}</p>
              </div>
            </div>
          </div>
        </DrawerHeader>
        
        <div className="px-4 py-2">
          <Textarea
            placeholder={`Reply to ${targetUser}...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[120px] resize-none"
            autoFocus
          />
        </div>
        
        <DrawerFooter>
          <Button 
            className="w-full gap-2" 
            onClick={handleSubmit} 
            disabled={!replyContent.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Reply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
