
import React from 'react';
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
  const mobile = useIsMobile();
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post navigation
    onOpenChange(true);
  };
  
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
            username={username}
            timeAgo={timeAgo}
            content={content}
            images={images}
            video={video}
            postCode={postCode}
            community={community}
            onShareSuccess={onShareSuccess}
            onClose={() => onOpenChange(false)}
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
          username={username}
          timeAgo={timeAgo}
          content={content}
          images={images}
          video={video}
          postCode={postCode}
          community={community}
          onShareSuccess={onShareSuccess}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
