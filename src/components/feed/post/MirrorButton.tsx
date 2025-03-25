
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Repeat2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { MirrorContent } from './MirrorContent';
import { useToast } from '@/hooks/use-toast';

interface MirrorButtonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  timeAgo: string;
  content: string;
  images?: string[];
  video?: string;
  postCode?: string;
}

export const MirrorButton = ({ 
  open, 
  onOpenChange, 
  username, 
  timeAgo, 
  content, 
  images, 
  video,
  postCode
}: MirrorButtonProps) => {
  const mobile = useIsMobile();
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [quoteText, setQuoteText] = useState('');
  const [mirroring, setMirroring] = useState(false);
  const { toast } = useToast();
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post navigation
    onOpenChange(true);
  };
  
  const handleCommunitySelect = (community: string | null) => {
    setSelectedCommunity(community);
  };
  
  const handleQuoteChange = (quote: string) => {
    setQuoteText(quote);
  };
  
  const handleMirror = async () => {
    if (!selectedCommunity || !postCode) {
      return;
    }
    
    setMirroring(true);
    
    try {
      const userKey = localStorage.getItem('dapps_user_key');
      
      if (!userKey) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to mirror posts",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch('https://api.dapps.co/mirror_post', {
        method: 'POST',
        headers: {
          'x-user-key': userKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postCode: postCode,
          communityTo: selectedCommunity,
          quoteText: quoteText.trim() || undefined
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mirror post: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "SUCCESS") {
        toast({
          title: "Success!",
          description: `Post mirrored to ${selectedCommunity}`,
        });
        onOpenChange(false);
        setSelectedCommunity(null);
        setQuoteText('');
      } else {
        throw new Error(data.message || 'Failed to mirror post');
      }
    } catch (error) {
      console.error('Error mirroring post:', error);
      toast({
        title: "Error",
        description: "Failed to mirror post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setMirroring(false);
    }
  };
  
  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 hover:text-purple-500 hover:bg-purple-500/10"
            onClick={handleClick}
          >
            <Repeat2 className="h-4 w-4" />
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
            onCommunitySelect={handleCommunitySelect}
            onQuoteChange={handleQuoteChange}
            selectedCommunity={selectedCommunity}
            quoteText={quoteText}
          />
          
          <DrawerFooter className="flex-row justify-between gap-2 p-4 border-t">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button 
              onClick={handleMirror}
              disabled={!selectedCommunity || mirroring}
              className="gap-1.5"
            >
              {mirroring ? (
                <>
                  <span className="animate-spin">↻</span>
                  Mirroring...
                </>
              ) : (
                <>
                  <Repeat2 className="h-4 w-4" />
                  Mirror Post
                </>
              )}
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
          onClick={handleClick}
        >
          <Repeat2 className="h-4 w-4" />
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
          onCommunitySelect={handleCommunitySelect}
          onQuoteChange={handleQuoteChange}
          selectedCommunity={selectedCommunity}
          quoteText={quoteText}
        />
        
        <SheetFooter className="flex flex-row justify-between gap-2 mt-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button 
            onClick={handleMirror}
            disabled={!selectedCommunity || mirroring}
            className="gap-1.5"
          >
            {mirroring ? (
              <>
                <span className="animate-spin">↻</span>
                Mirroring...
              </>
            ) : (
              <>
                <Repeat2 className="h-4 w-4" />
                Mirror Post
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
