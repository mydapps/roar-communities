
import React, { useState } from 'react';
import { Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ShareContent } from './ShareContent';
import { useIsMobile } from '@/hooks/use-mobile';

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
  onShareSuccess: (platform: string) => void;
  avatar?: string;
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
  onShareSuccess,
  avatar
}: ShareButtonProps) => {
  const mobile = useIsMobile();
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post navigation
    onOpenChange(true);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  };
  
  // Use avatar URL if provided, otherwise username will be used to generate a fallback avatar
  const userIdentifier = avatar || username;
  
  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="px-2 hover:text-green-500 hover:bg-green-500/10"
            onClick={handleClick}
          >
            <Share className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Share Post</DrawerTitle>
          </DrawerHeader>
          
          <ShareContent 
            username={userIdentifier}
            timeAgo={timeAgo}
            content={content}
            images={images}
            video={video}
            postCode={postCode}
            community={community}
            onShareSuccess={onShareSuccess}
            onClose={handleClose}
          />
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="px-2 hover:text-green-500 hover:bg-green-500/10"
          onClick={handleClick}
        >
          <Share className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Share Post</SheetTitle>
        </SheetHeader>
        
        <ShareContent 
          username={userIdentifier}
          timeAgo={timeAgo}
          content={content}
          images={images}
          video={video}
          postCode={postCode}
          community={community}
          onShareSuccess={onShareSuccess}
          onClose={handleClose}
        />
      </SheetContent>
    </Sheet>
  );
};
