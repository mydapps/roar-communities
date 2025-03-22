
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { isMobile } from '@/utils/responsive';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { ShareContent } from './ShareContent';
import { useToast } from '@/hooks/use-toast';

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
  community
}: ShareButtonProps) => {
  const mobile = isMobile();
  
  const handleClose = () => {
    onOpenChange(false);
  };
  
  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 hover:text-green-500 hover:bg-green-500/10"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Share Post</DrawerTitle>
            <DrawerDescription>
              Share this post with others
            </DrawerDescription>
          </DrawerHeader>
          
          <ShareContent 
            username={username}
            timeAgo={timeAgo}
            content={content}
            images={images}
            video={video}
            postCode={postCode}
            community={community}
            onClose={handleClose}
          />
          
          <DrawerFooter className="border-t p-4">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
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
          className="gap-2 hover:text-green-500 hover:bg-green-500/10"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Share Post</SheetTitle>
          <SheetDescription>
            Share this post with others
          </SheetDescription>
        </SheetHeader>
        
        <ShareContent 
          username={username}
          timeAgo={timeAgo}
          content={content}
          images={images}
          video={video}
          postCode={postCode}
          community={community}
          onClose={handleClose}
        />
        
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
