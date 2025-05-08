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
import MobileMirrorSheet, { PERSONAL_FEED_INTERNAL_IDENTIFIER } from './MobileMirrorSheet';

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
    if (open && userCommunities === null && mobile) {
      const loadUserCommunities = async () => {
        setLoadingUserCommunities(true);
        try {
          const communities = await fetchCommunities({ personal: true, limit: 500 });
          setUserCommunities(communities);
        } catch (error) {
          console.error("Failed to fetch user communities for mirror:", error);
          setUserCommunities([]); 
          toast.error("Could not load your communities. Mirroring to communities might be affected.");
        } finally {
          setLoadingUserCommunities(false);
        }
      };
      loadUserCommunities();
    }
    if (!open && !notInCommunitySheetOpen) {
       // Reset when closed only if not showing the other sheet
       // No, MobileMirrorSheet handles its own internal reset. 
       // This component should only reset userCommunities if they are context-specific to this modal instance,
       // but they are fetched for the mobile sheet so clearing here might be too aggressive if desktop uses them too.
       // For now, let MobileMirrorSheet handle its reset. If desktop version uses userCommunities, then they should persist while open.
    }
  }, [open, notInCommunitySheetOpen, mobile]);
  
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
  
  const handleMobileMirrorSubmit = async (communityTo: string, quoteTextVal: string, postCodeVal: string): Promise<boolean> => {
    // communityTo is the community NAME or empty string for personal feed
    // postCodeVal is passed from MobileMirrorSheet's postData
    
    if (!postCodeVal) {
      console.error("Missing postCode in mobile mirror submit");
      toast.error("Unable to mirror this post: missing post identifier");
      return false;
    }

    // Validate that user is not trying to mirror to the same community (if source community exists)
    if (community && communityTo === community && communityTo !== "") { // PERSONAL_FEED_INTERNAL_IDENTIFIER is internal to sheet, API expects ""
      toast.error("You cannot mirror a post to the same community it's already in.");
      return false;
    }

    // Community Membership Check (if applicable, less direct in new flow but good to keep if mirroring FROM community)
    if (community && userCommunities && !loadingUserCommunities) { // `community` here is sourceCommunity
      const isMemberOfSource = userCommunities.some(uc => uc.name === community);
      // This check might be less relevant now as the new mobile flow doesn't directly show source community info during mirroring
      // However, if the backend enforces that a user must be a member of the source community to mirror *from* it, it might still be needed.
      // For now, let's assume this check is primarily for mirroring *into* a community where membership matters.
    }

    setMirroring(true); // Use this component's mirroring state for overall feedback if needed
    try {
      const userId = localStorage.getItem('dapps_user_id');
      if (!userId) {
        toast.error("You need to be logged in to mirror posts.");
        return false;
      }

      const mirrorParams = {
        postCode: postCodeVal,
        communityTo: communityTo, // Already correctly formatted by MobileMirrorSheet
        quoteText: quoteTextVal.trim() || undefined
      };
      
      console.log("Sending mirror request (from MobileMirrorSheet) with params:", mirrorParams);
      const success = await mirrorPost(mirrorParams);
      
      if (success) {
        const destination = communityTo === "" 
          ? "your personal feed" 
          : communityTo;
        toast.success(`Post mirrored to ${destination}!`);
        
        const mirroredEvent = new CustomEvent(POST_MIRRORED_EVENT, {
          detail: {
            originalPostCode: postCodeVal,
            communityTo: communityTo,
            isPersonalFeed: communityTo === ""
          }
        });
        document.dispatchEvent(mirroredEvent);
        onOpenChange(false); // Close the main button's controlled modal state
        return true;
      } else {
        throw new Error('Failed to mirror post (API returned false)');
      }
    } catch (error: any) {
      console.error("Error in handleMobileMirrorSubmit:", error);
      toast.error(error.message || "Failed to mirror post.");
      return false;
    } finally {
      setMirroring(false);
    }
  };

  // Original handleMirror (for desktop Sheet with MirrorContent)
  const handleMirrorDesktop = async (e: React.MouseEvent, currentSelectedCommunity: string | null, currentQuoteText: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentSelectedCommunity) {
      uiToast({
        title: "Error",
        description: "Please select where to mirror this post",
        variant: "destructive"
      });
      return;
    }
    if (community && currentSelectedCommunity === community && currentSelectedCommunity !== PERSONAL_FEED) {
      uiToast({
        title: "Cannot Mirror",
        description: "You cannot mirror a post to the same community it's already in",
        variant: "destructive"
      });
      return;
    }
    if (loadingUserCommunities) {
      uiToast({ title: "Checking membership...", description: "Please wait while we verify community membership." });
      return;
    }
    if (!postCode) {
      console.error("Missing postCode in desktop mirror request");
      uiToast({ title: "Error", description: "Unable to mirror post: missing ID", variant: "destructive" });
      return;
    }
    
    setMirroring(true);
    try {
      const userId = localStorage.getItem('dapps_user_id');
      if (!userId) {
        uiToast({ title: "Auth Error", description: "Login required", variant: "destructive" });
        setMirroring(false); return;
      }
      const mirrorParams = {
        postCode: postCode, 
        communityTo: currentSelectedCommunity === PERSONAL_FEED ? "" : currentSelectedCommunity,
        quoteText: currentQuoteText.trim() || undefined
      };
      const success = await mirrorPost(mirrorParams);
      if (success) {
        onOpenChange(false);
        const destination = currentSelectedCommunity === PERSONAL_FEED ? "your feed" : currentSelectedCommunity;
        toast.success(`Post mirrored to ${destination}`, { description: "Mirrored post published." });
        const mirroredEvent = new CustomEvent(POST_MIRRORED_EVENT, { detail: { originalPostCode: postCode, communityTo: mirrorParams.communityTo, isPersonalFeed: mirrorParams.communityTo === "" } });
        document.dispatchEvent(mirroredEvent);
      } else { throw new Error('Failed to mirror post'); }
    } catch (err: any) {
      toast.error(err.message || "Failed to mirror post");
    } finally {
      setMirroring(false);
    }
  };
  
  // State for desktop version (if kept separate)
  const [desktopSelectedCommunity, setDesktopSelectedCommunity] = useState<string | null>(null);
  const [desktopQuoteText, setDesktopQuoteText] = useState('');

  if (mobile) {
    const mobilePostData = {
        username,
        timeAgo,
        content,
        images,
        video,
        postCode,
        community, // Source community name
        // avatarUrl: pass author's avatar if available, otherwise MobileMirrorSheet will use a fallback
    };
    return (
      <>
        {/* Trigger Button - can be outside or handled by parent like a feed item */}
        {/* For this example, assuming MirrorButton itself is the trigger for its own state */}
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 hover:text-purple-500 hover:bg-purple-500/10"
            onClick={handleClick} // This sets `open` to true
          >
            <Repeat2 className="h-4 w-4" />
            <span>Mirror</span>
          </Button>

        <MobileMirrorSheet 
            open={open} 
            onOpenChange={onOpenChange} 
            postData={mobilePostData}
            userCommunities={userCommunities}
            loadingUserCommunities={loadingUserCommunities}
            onMirrorSubmit={handleMobileMirrorSubmit}        
        />
        <NotInCommunitySheet 
          open={notInCommunitySheetOpen}
          onOpenChange={setNotInCommunitySheetOpen}
          communityName={communityNameForSheet}
        />
      </>
    );
  }
  
  // Desktop version using Sheet and MirrorContent
  return (
    <>
    <Sheet open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) { // Reset desktop-specific state on close
            setDesktopSelectedCommunity(null);
            setDesktopQuoteText('');
        }
    }}>
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
          onCommunitySelect={setDesktopSelectedCommunity} // Use desktop state setter
          onQuoteChange={setDesktopQuoteText} // Use desktop state setter
          selectedCommunity={desktopSelectedCommunity} // Pass desktop state
          quoteText={desktopQuoteText} // Pass desktop state
          sourceCommunity={community}
        />
        
        <SheetFooter className="flex-row justify-between gap-2 p-4 border-t bg-background sticky bottom-0 left-0 right-0 z-10">
          <SheetClose asChild>
            <Button variant="outline" onClick={(e) => e.stopPropagation()}>Cancel</Button>
          </SheetClose>
          <Button 
            onClick={(e) => handleMirrorDesktop(e, desktopSelectedCommunity, desktopQuoteText)}
            disabled={!desktopSelectedCommunity || mirroring || loadingUserCommunities}
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
