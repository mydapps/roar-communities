
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { ShareIcon } from 'lucide-react';
import { ShareContent } from './ShareContent';

interface ShareButtonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  timeAgo: string;
  content: string;
  images?: string[];
  video?: string;
  postCode?: string;
  community?: string;
  onShareSuccess?: (platform: string) => void;
}

export const ShareButton = ({ 
  open, 
  onOpenChange, 
  username, 
  timeAgo, 
  content, 
  images,
  video,
  postCode,
  community,
  onShareSuccess
}: ShareButtonProps) => {
  const [shareCount, setShareCount] = useState(0);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post navigation
    onOpenChange(true);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  };
  
  const handleShareSuccess = (platform: string) => {
    setShareCount(prev => prev + 1);
    if (onShareSuccess) {
      onShareSuccess(platform);
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleClick}
          className="gap-2 hover:text-blue-500 hover:bg-blue-500/10"
        >
          <ShareIcon className="h-4 w-4" />
          {shareCount > 0 && <span>{shareCount}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:max-w-md sm:h-[85vh] mx-auto p-0 overflow-auto">
        <SheetHeader className="p-4 text-left border-b sticky top-0 bg-background z-10">
          <SheetTitle>Share Post</SheetTitle>
        </SheetHeader>
        <div className="overflow-auto">
          <ShareContent 
            username={username}
            timeAgo={timeAgo}
            content={content}
            images={images}
            video={video}
            postCode={postCode}
            community={community}
            onClose={handleClose}
            onShareSuccess={handleShareSuccess}
          />
        </div>
        <SheetClose className="absolute top-4 right-4" />
      </SheetContent>
    </Sheet>
  );
};
