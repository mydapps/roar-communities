
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Repeat2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { MirrorContent } from './MirrorContent';
import { useToast } from '@/hooks/use-toast';

// Create a custom event for post mirroring
export const POST_MIRRORED_EVENT = 'post-mirrored';

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
  
  const handleMirror = async (e: React.MouseEvent) => {
    // Prevent any navigation
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedCommunity || !postCode) {
      toast({
        title: "Error",
        description: "Please select a community to mirror to",
        variant: "destructive"
      });
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
        setMirroring(false);
        return;
      }
      
      console.log("Mirroring post:", {
        postCode,
        communityTo: selectedCommunity,
        quoteText: quoteText.trim() || undefined
      });
      
      const response = await fetch('https://api.dapps.co/mirror_post', {
        method: 'POST',
        headers: {
          'x-user-key': userKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_code: postCode,
          community_to: selectedCommunity,
          quote_text: quoteText.trim() || undefined
        })
      });
      
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          console.error("Mirror API error response (text):", errorText);
        }
        throw new Error(errorMessage);
      }
      
      // Check if response is JSON
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        console.log("Mirror API response:", data);
        
        if (data.status === "SUCCESS") {
          toast({
            title: "Success!",
            description: `Post mirrored to ${selectedCommunity}`,
          });
          onOpenChange(false);
          setSelectedCommunity(null);
          setQuoteText('');
          
          // Dispatch a custom event to notify that a post was mirrored
          const mirroredEvent = new CustomEvent(POST_MIRRORED_EVENT, {
            detail: {
              originalPostCode: postCode,
              mirroredPostCode: data.mirroredPostCode || '',
              communityTo: selectedCommunity
            }
          });
          document.dispatchEvent(mirroredEvent);
        } else {
          throw new Error(data.message || 'Failed to mirror post');
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error('Error mirroring post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mirror post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setMirroring(false);
    }
  };
  
  // Render component based on device type
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
        <DrawerContent className="max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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
              <Button variant="outline" onClick={(e) => e.stopPropagation()}>Cancel</Button>
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
      <SheetContent side="right" className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
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
            <Button variant="outline" onClick={(e) => e.stopPropagation()}>Cancel</Button>
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
