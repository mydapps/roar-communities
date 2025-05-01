import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Repeat2, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, DrawerTrigger } from '@/components/ui/drawer';
import { MirrorContent, PERSONAL_FEED } from './MirrorContent';
import { useToast } from '@/hooks/use-toast';
import { mirrorPost, fetchCommunities, Community } from '@/utils/api';
import { toast } from 'sonner';
import { restoreBodyScrolling } from '@/utils/deviceUtils';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';

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
  community?: string;
}

export const MirrorButton = ({ 
  open, 
  onOpenChange, 
  username, 
  timeAgo, 
  content, 
  images, 
  video,
  postCode,
  community
}: MirrorButtonProps) => {
  const mobile = useIsMobile();
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [quoteText, setQuoteText] = useState('');
  const [mirroring, setMirroring] = useState(false);
  const { toast: uiToast } = useToast();
  // State for community membership check sheet
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityNameForSheet, setCommunityNameForSheet] = useState("");
  const [userCommunities, setUserCommunities] = useState<Community[] | null>(null);
  const [loadingUserCommunities, setLoadingUserCommunities] = useState(false);
  
  // Fetch user communities when the modal opens
  useEffect(() => {
    if (open && userCommunities === null) {
      const loadUserCommunities = async () => {
        setLoadingUserCommunities(true);
        try {
          // Only fetch personal communities
          const communities = await fetchCommunities({ personal: true, limit: 500 }); // Fetch a larger limit
          setUserCommunities(communities);
        } catch (error) {
          console.error("Failed to fetch user communities for mirror check:", error);
          // Proceed without check if fetch fails, maybe log an error?
          setUserCommunities([]); // Set to empty array to allow proceeding
        } finally {
          setLoadingUserCommunities(false);
        }
      };
      loadUserCommunities();
    }
    // Reset when closed if not showing the other sheet
    if (!open && !notInCommunitySheetOpen) {
      setUserCommunities(null);
    }
  }, [open, notInCommunitySheetOpen]);
  
  // Effect to cleanup scroll locks when drawer/sheet closes
  useEffect(() => {
    if (!open && mobile) {
      // Small delay to allow animations to complete
      const timer = setTimeout(() => {
        restoreBodyScrolling();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open, mobile]);
  
  // Ensure scrolling is restored when component unmounts
  useEffect(() => {
    return () => {
      if (mobile) {
        restoreBodyScrolling();
      }
    };
  }, [mobile]);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post navigation
    onOpenChange(true);
  };
  
  const handleCommunitySelect = (community: string | null) => {
    console.log("Community selected in MirrorButton:", community);
    setSelectedCommunity(community);
  };
  
  const handleQuoteChange = (quote: string) => {
    setQuoteText(quote);
  };
  
  // Custom handler for closing the drawer/sheet
  const handleCloseModal = () => {
    onOpenChange(false);
    // Ensure scrolling is restored
    if (mobile) {
      setTimeout(restoreBodyScrolling, 100);
    }
  };
  
  const handleMirror = async (e: React.MouseEvent) => {
    // Prevent any navigation
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Mirror request details:", {
      postCode,
      selectedCommunity,
      quoteText: quoteText.trim(),
      sourceCommunity: community
    });
    
    if (!selectedCommunity) {
      uiToast({
        title: "Error",
        description: "Please select where to mirror this post",
        variant: "destructive"
      });
      return;
    }
    
    // Validate that user is not trying to mirror to the same community
    if (community && selectedCommunity === community && selectedCommunity !== PERSONAL_FEED) {
      uiToast({
        title: "Cannot Mirror",
        description: "You cannot mirror a post to the same community it's already in",
        variant: "destructive"
      });
      return;
    }
    
    // *** Community Membership Check ***
    if (community && userCommunities && !loadingUserCommunities) {
      const isMember = userCommunities.some(uc => uc.name === community);
      if (!isMember) {
        console.log(`User not member of source community: ${community}. Showing sheet.`);
        setCommunityNameForSheet(community);
        setNotInCommunitySheetOpen(true);
        handleCloseModal(); // Close the mirror modal
        return; // Stop the mirror process
      }
    }
    // If still loading communities, prevent mirroring for now
    if (loadingUserCommunities) {
      uiToast({
        title: "Checking membership...",
        description: "Please wait while we verify community membership.",
      });
      return;
    }
    // *** End Check ***
    
    if (!postCode) {
      console.error("Missing postCode in mirror request");
      uiToast({
        title: "Error",
        description: "Unable to mirror this post: missing post identifier",
        variant: "destructive"
      });
      return;
    }
    
    setMirroring(true);
    
    try {
      const userId = localStorage.getItem('dapps_user_id');
      
      if (!userId) {
        uiToast({
          title: "Authentication Error",
          description: "You need to be logged in to mirror posts",
          variant: "destructive"
        });
        setMirroring(false);
        return;
      }
      
      // Using the proper parameter names as expected by the API
      // If mirroring to personal feed, use empty string for communityTo
      const mirrorParams = {
        postCode: postCode, 
        communityTo: selectedCommunity === PERSONAL_FEED ? "" : selectedCommunity,
        quoteText: quoteText.trim() || undefined
      };
      
      console.log("Sending mirror request with params:", mirrorParams);
      
      const success = await mirrorPost(mirrorParams);
      
      if (success) {
        // Close the mirror dialog first
        handleCloseModal();
        
        // Destination text for the success message
        const destination = selectedCommunity === PERSONAL_FEED 
          ? "your feed" 
          : selectedCommunity;
        
        // Then show toast notification
        toast.success(`Post mirrored to ${destination}`, {
          description: "Your mirrored post has been published successfully",
          duration: 5000,
        });
        
        setSelectedCommunity(null);
        setQuoteText('');
        
        // Dispatch a custom event to notify that a post was mirrored
        const mirroredEvent = new CustomEvent(POST_MIRRORED_EVENT, {
          detail: {
            originalPostCode: postCode,
            communityTo: selectedCommunity === PERSONAL_FEED ? "" : selectedCommunity,
            isPersonalFeed: selectedCommunity === PERSONAL_FEED
          }
        });
        document.dispatchEvent(mirroredEvent);
      } else {
        throw new Error('Failed to mirror post');
      }
    } catch (error) {
      console.error('Error mirroring post:', error);
      
      // Extract the error message
      let errorMessage = "Failed to mirror post. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide a more user-friendly message for the most common error
        if (errorMessage.includes("Cannot mirror to the same community")) {
          errorMessage = "You cannot mirror a post to the same community it's already in.";
        }
      }
      
      uiToast({
        title: "Mirror Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setMirroring(false);
      // Ensure scrolling is restored
      if (mobile) {
        setTimeout(restoreBodyScrolling, 150);
      }
    }
  };
  
  // Render component based on device type
  if (mobile) {
    return (
      <>
      <Drawer open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        // Ensure scrolling is restored when drawer is closed
        if (!isOpen) {
          setTimeout(restoreBodyScrolling, 150); 
        }
      }}>
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
              Share this post to your feed or other communities
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
            sourceCommunity={community}
          />
          
          <DrawerFooter className="flex-row justify-between gap-2 p-4 border-t bg-background sticky bottom-0 left-0 right-0 z-10">
            <DrawerClose asChild>
              <Button variant="outline" onClick={(e) => {
                e.stopPropagation();
                setTimeout(restoreBodyScrolling, 150);
              }}>Cancel</Button>
            </DrawerClose>
            <Button 
              onClick={handleMirror}
                disabled={!selectedCommunity || mirroring || loadingUserCommunities}
              className="gap-1.5"
            >
              {mirroring ? (
                <>
                  <span className="animate-spin">↻</span>
                  Mirroring...
                </>
                ) : loadingUserCommunities ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
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

        <NotInCommunitySheet 
          open={notInCommunitySheetOpen}
          onOpenChange={setNotInCommunitySheetOpen}
          communityName={communityNameForSheet}
        />
      </>
    );
  }
  
  return (
    <>
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
            Share this post to your feed or other communities
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
          sourceCommunity={community}
        />
        
        <SheetFooter className="flex-row justify-between gap-2 p-4 border-t bg-background sticky bottom-0 left-0 right-0 z-10">
          <SheetClose asChild>
            <Button variant="outline" onClick={(e) => e.stopPropagation()}>Cancel</Button>
          </SheetClose>
          <Button 
            onClick={handleMirror}
              disabled={!selectedCommunity || mirroring || loadingUserCommunities}
            className="gap-1.5"
          >
            {mirroring ? (
              <>
                <span className="animate-spin">↻</span>
                Mirroring...
              </>
              ) : loadingUserCommunities ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
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

      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityNameForSheet}
      />
    </>
  );
};
