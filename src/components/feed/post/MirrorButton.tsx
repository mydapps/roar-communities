
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { isMobile } from '@/utils/responsive';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { MirrorContent } from './MirrorContent';

interface MirrorButtonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCommunity: string | null;
  onMirror: () => void;
  username: string;
  timeAgo: string;
  content: string;
  images?: string[];
  video?: string;
}

export const MirrorButton = ({ 
  open, 
  onOpenChange, 
  selectedCommunity, 
  onMirror, 
  username, 
  timeAgo, 
  content, 
  images, 
  video 
}: MirrorButtonProps) => {
  const mobile = isMobile();
  
  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 hover:text-purple-500 hover:bg-purple-500/10"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Mirror</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Mirror Post</DrawerTitle>
            <DrawerDescription>
              Share this post with other communities
            </DrawerDescription>
          </DrawerHeader>
          
          <MirrorContent 
            username={username} 
            timeAgo={timeAgo} 
            content={content} 
            images={images} 
            video={video} 
          />
          
          <DrawerFooter className="flex-row justify-between gap-2 p-4 border-t">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button 
              onClick={onMirror}
              disabled={!selectedCommunity}
              className="gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              Mirror Post
            </Button>
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
          className="gap-2 hover:text-purple-500 hover:bg-purple-500/10"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Mirror</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Mirror Post</SheetTitle>
          <SheetDescription>
            Share this post with other communities
          </SheetDescription>
        </SheetHeader>
        
        <MirrorContent 
          username={username} 
          timeAgo={timeAgo} 
          content={content} 
          images={images} 
          video={video} 
        />
        
        <SheetFooter className="flex flex-row justify-between gap-2 mt-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button 
            onClick={onMirror}
            disabled={!selectedCommunity}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Mirror Post
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
