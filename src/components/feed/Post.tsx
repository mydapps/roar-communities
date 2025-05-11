import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

import { PostHeader } from './post/PostHeader';
import { PostContent } from './post/PostContent';
import { PostFooter } from './post/PostFooter';
import { usePostMedia } from './post/usePostMedia';
import { CommentSection } from './post/CommentSection';
import { fetchReplies, CommentReply } from '@/utils/commentApi';
import { hidePost, pinCommunityPost } from '@/utils/postApi';
import { ImageViewer } from './post/ImageViewer';
// Import the confirmation sheet
import { HidePostConfirmationSheet } from './post/HidePostConfirmationSheet';
// Import the ReportPostSheet
import { ReportPostSheet } from './post/ReportPostSheet';
import { PinPostConfirmationModal } from './post/PinPostConfirmationModal';

export interface PostProps {
  username: string;
  community?: string;
  timeAgo: string;
  content: string;
  roarCount: number;
  commentCount: number;
  shareCount: number;
  images?: string[];
  video?: string;
  disableNavigation?: boolean;
  postCode?: string;
  roared?: boolean;
  onRoar?: () => void;
  isMirror?: boolean;
  mirrorData?: {
    quote: string;
    originalAuthor: string;
    originalCommunity: string;
    originalBody: string;
    originalTimeAgo: string;
    originalAvatar: string;
    originalImages?: string[];
    originalTitle?: string;
    originalPostCode?: string;
  };
  ipfs?: string;
  avatar?: string;
  hideComments?: boolean;
  isLoggedIn?: boolean;
  onToggleComments?: () => void;
  isAdmin?: boolean;
  isPinned?: boolean;
  onPostUpdated?: (postCode: string, newPinnedStatus: boolean) => void;
}

export const Post = ({ 
  username, 
  community, 
  timeAgo, 
  content, 
  roarCount, 
  commentCount, 
  shareCount,
  images,
  video,
  disableNavigation = false,
  postCode,
  roared = false,
  onRoar,
  isMirror = false,
  mirrorData,
  ipfs,
  avatar,
  hideComments = false,
  isLoggedIn,
  onToggleComments,
  isAdmin = false,
  isPinned = false,
  onPostUpdated,
}: PostProps) => {
  const navigate = useNavigate();
  const [localRoared, setLocalRoared] = useState(roared);
  const [hasRoared, setHasRoared] = useState(roared);
  const [localRoarCount, setLocalRoarCount] = useState(roarCount);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState<CommentReply[]>([]);
  const [mirrorSheetOpen, setMirrorSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [ipfsSheetOpen, setIpfsSheetOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  // State for the confirmation sheet
  const [showHideConfirmation, setShowHideConfirmation] = useState(false);
  // State for animation trigger
  const [isAnimatingHide, setIsAnimatingHide] = useState(false);
  // State for Report Post sheet
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentIsPinned, setCurrentIsPinned] = useState(isPinned);
  const isMobile = useIsMobile();
  
  const { parsedContent, allMedia, allImages: normalImages, hasMedia } = usePostMedia(content, images, video);
  
  // Combine normal images with mirrored post images if this is a mirrored post
  const allImages = useMemo(() => {
    const combinedImages = new Set<string>();

    // Add normal images (already deduplicated by usePostMedia)
    if (normalImages) {
      normalImages.forEach(img => {
        if (img && img.trim() !== '' && img !== 'https://dapps.co/dapps.png') {
          combinedImages.add(img);
        }
      });
    }

    // Add images from mirrorData, ensuring uniqueness
    if (isMirror && mirrorData?.originalImages) {
      mirrorData.originalImages.forEach(img => {
        if (img && img.trim() !== '' && img !== 'https://dapps.co/dapps.png') {
          combinedImages.add(img); // Set handles uniqueness automatically
        }
      });
    }
    
    const uniqueImageList = Array.from(combinedImages);
    return uniqueImageList.length > 0 ? uniqueImageList : undefined;

  }, [normalImages, isMirror, mirrorData]);
  
  const { toast } = useToast();
  
  // Determine if the logged-in user is the owner
  const loggedInUserHandle = localStorage.getItem('dapps_user_handle'); 
  const isOwner = loggedInUserHandle === username;
  
  const userIsLoggedIn = isLoggedIn !== undefined ? isLoggedIn : !!localStorage.getItem('dapps_user_id');
  
  const ipfsHash = ipfs || postCode || `Qm${Array.from({length: 44}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  useEffect(() => {
    setHasRoared(roared);
    setLocalRoarCount(roarCount);
    setCurrentIsPinned(isPinned);
  }, [roared, roarCount, isPinned]);

  const handleRoar = async () => {
    if (!userIsLoggedIn) {
      toast({
        title: "Login Required",
        description: "You need to login to roar at this post",
        variant: "destructive",
        action: <button 
          className="bg-primary text-white px-3 py-1 rounded text-xs"
          onClick={() => navigate('/index')}
        >
          Login
        </button>
      });
      return;
    }
    
    if (postCode) {
      // Update local UI state
      const newRoaredState = !hasRoared;
      setHasRoared(newRoaredState);
      setLocalRoarCount(prev => newRoaredState ? prev + 1 : prev - 1);
      
      // Call parent callback which will handle the API call
      if (onRoar) {
        onRoar();
      }
    } else {
      console.error("Cannot roar post: missing postCode");
      toast({
        title: "Error",
        description: "Unable to roar this post. Missing post identifier.",
        variant: "destructive"
      });
    }
  };

  const handleVerifyIpfs = () => {
    console.log(`Verifying IPFS hash: ${ipfsHash}`);
    toast({
      title: "IPFS Verification",
      description: `Verifying content with IPFS hash: ${ipfsHash}`,
    });
  };

  const handleImageClick = (imageSrc: string) => {
    if (allImages) {
      const index = allImages.findIndex(img => img === imageSrc);
      if (index !== -1) {
        setSelectedImageIndex(index);
        setImageViewerOpen(true);
      } else {
        // Fallback for cases where the image isn't found in allImages
        // This should not happen with our fixes, but as a safety measure
        console.warn("Image clicked but not found in allImages:", imageSrc);
        
        // Create a temporary array with just this image and show it
        setSelectedImageIndex(0);
        // Update allImages temporarily to include this image
        // We don't actually modify allImages since it's derived from useMemo
        const tempImages = [imageSrc];
        // Show the image viewer
        setImageViewerOpen(true);
      }
    } else if (imageSrc) {
      // No allImages array, but we have an image source
      // Create a temporary array with just this image
      setSelectedImageIndex(0);
      setImageViewerOpen(true);
    }
  };

  const handlePostClick = (e: React.MouseEvent) => {
    const targetElement = e.target as HTMLElement;
    const isClickInsideMirror = targetElement.closest('[data-mirror-content-area="true"]');
    
    console.log("handlePostClick triggered");
    console.log("Clicked Element:", targetElement);
    console.log("Is click inside mirror area?", !!isClickInsideMirror);
    console.log("isMirror prop:", isMirror);
    console.log("mirrorData:", mirrorData);
    console.log("disableNavigation:", disableNavigation);
    console.log("Closest button:", targetElement.closest('button'));
    console.log("Closest link:", targetElement.closest('a'));
    console.log("Closest media element:", targetElement.closest('[data-media-element="true"]'));
    console.log("Closest form:", targetElement.closest('form'));
    console.log("Closest comment section:", targetElement.closest('[data-comment-section="true"]'));
    console.log("Show comments:", showComments);

    // 1. Handle navigation for mirrored post content click FIRST
    if (isClickInsideMirror && isMirror && mirrorData?.originalPostCode) {
      // We explicitly DO NOT check disableNavigation here, as we want this click to work
      console.log("-> Attempting to navigate to ORIGINAL post:", mirrorData.originalPostCode);
      const originalAuthorHandle = mirrorData.originalAuthor.split('.')[0];
      if (mirrorData.originalCommunity) {
        const url = `/c/${mirrorData.originalCommunity.toLowerCase().replace(/\s+/g, '-')}/${mirrorData.originalPostCode}`;
        console.log("Navigating to URL:", url);
        navigate(url);
      } else if (originalAuthorHandle) {
        const url = `/${originalAuthorHandle}/${mirrorData.originalPostCode}`;
        console.log("Navigating to URL:", url);
        navigate(url);
      } else {
        console.warn("Cannot determine original post URL fully, navigating with postCode only.");
        const url = `/post/${mirrorData.originalPostCode}`;
        console.log("Navigating to Fallback URL:", url);
        navigate(url);
      }
      return; // Stop further execution after handling mirror click
    }

    // 2. Prevent navigation for other cases (disabled, button, link, media, form, comments)
    if (disableNavigation || 
        targetElement.closest('button') || 
        targetElement.closest('a') ||
        targetElement.closest('[data-media-element="true"]') || 
        targetElement.closest('form') ||
        (targetElement.closest('[data-comment-section="true"]') && showComments) || 
        showComments
        ) {
      console.log("-> Preventing navigation (disabled, button, link, media, form, or comments shown)");
      return;
    }
    
    // 3. Default navigation for the post itself (if not handled above and not prevented)
    if (postCode) {
      console.log("-> Attempting to navigate to CURRENT post:", postCode);
      if (community) {
        const url = `/c/${community.toLowerCase().replace(/\s+/g, '-')}/${postCode}`;
        console.log("Navigating to URL:", url);
        navigate(url);
      } else {
        const url = `/${username.split('.')[0]}/${postCode}`;
        console.log("Navigating to URL:", url);
        navigate(url);
      }
    } else {
      console.log("-> No postCode found, cannot navigate.");
    }
  };

  const handleShareSuccess = (platform: string) => {
    setTimeout(() => {
      setShareSheetOpen(false);
    }, 2000);
  };
  
  const postId = useRef(postCode || Array.from({length: 6}, () => 
    Math.floor(Math.random() * 36).toString(36)).join('')
  ).current;

  const handleAddComment = (commentOrText: string | CommentReply) => {
    if (typeof commentOrText === 'string') {
      if (!commentOrText.trim()) return;
      
      if (!userIsLoggedIn) {
        toast({
          title: "Login Required",
          description: "You need to login to comment on this post",
          variant: "destructive",
          action: <button 
            className="bg-primary text-white px-3 py-1 rounded text-xs"
            onClick={() => navigate('/index')}
          >
            Login
          </button>
        });
        return;
      }
      
      const newComment: CommentReply = {
        id: Date.now(),
        uid: 0,
        handle: localStorage.getItem('dapps_user_handle') || 'You',
        avatar_url: localStorage.getItem('dapps_user_avatar') || 'default',
        content: commentOrText,
        created_on: new Date().toISOString(),
        time_ago: 'just now',
        upvotes: 0,
        meow_count: 0,
        has_meowed: false
      };
      
      setComments(prev => [...prev, newComment]);
    } else {
      // If we received a complete CommentReply object
      setComments(prev => [...prev, commentOrText]);
    }
  };

  const handleToggleComments = async () => {
    if (!userIsLoggedIn) {
      toast({
        title: "Login Required",
        description: "You need to login to view comments",
        variant: "destructive",
        action: <button 
          className="bg-primary text-white px-3 py-1 rounded text-xs"
          onClick={() => navigate('/index')}
        >
          Login
        </button>
      });
      return;
    }
    
    setShowComments(!showComments);
    
    // Call the external handler if provided (to focus comment inputs)
    if (onToggleComments) {
      onToggleComments();
    }
    
    if (!showComments && !loadingComments && comments.length === 0 && postCode) {
      setLoadingComments(true);
      
      try {
        const response = await fetchReplies(postCode, 3);
        
        if (response.success) {
          setComments(response.replies);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // --- Updated Hide/Report Handlers ---
  // Opens the confirmation sheet
  const handleOpenHideConfirmation = () => {
    if (!isOwner || isHiding || isHidden) return; // Prevent opening if not owner or already hiding/hidden
    console.log(`UI Action: Open hide confirmation for post ${postCode}`);
    setShowHideConfirmation(true);
  };

  // Called when the user confirms the hide action in the sheet
  const confirmHidePost = async () => {
    if (!postCode) {
      toast({ description: "Cannot hide post: Missing identifier.", variant: "destructive" });
      return;
    }
    if (isHiding) return; // Prevent double clicks

    console.log(`UI Action: Confirmed hide post ${postCode}`);
    setIsHiding(true); // Show loading state in the sheet

    try {
      const response = await hidePost(postCode, 'hide');
      if (response.success) {
        // Close the modal FIRST
        setShowHideConfirmation(false);
        
        // Wait briefly for modal to close, then start animation
        setTimeout(() => {
          setIsAnimatingHide(true);
          toast({ description: response.message || "Post hidden successfully." });

          // Wait for animation (0.3s) + small buffer before removing from DOM
          setTimeout(() => {
            setIsHidden(true); 
          }, 350); // Match animation duration + buffer
        }, 50); // Short delay after closing modal
        
      } else {
        toast({ description: response.message || "Failed to hide post.", variant: "destructive" });
        setIsHiding(false); // Reset loading state on failure
      }
    } catch (error) {
      console.error("Error in confirmHidePost:", error);
      toast({ description: "An unexpected error occurred while hiding the post.", variant: "destructive" });
      setIsHiding(false); // Reset loading state on error
    }
    // Note: We don't set isHiding back to false on success because the component will unmount
  };

  const handleReportPost = () => {
    console.log(`UI Action: Report post ${postCode}`);
    if (!postCode) {
      toast({ description: "Cannot report post: Missing identifier.", variant: "destructive" });
      return;
    }
    // Open the report sheet
    setShowReportSheet(true); 
  };

  // Callback for successful report submission
  const handleReportSuccess = () => {
    console.log(`Report submitted successfully for post ${postCode}`);
    // Optionally: Add further logic here, e.g., disable report button locally
  };
  // --- End Handlers ---
  
  // Pin modal toggle handler
  const handleTogglePin = () => {
    if (isAdmin) {
      setIsPinModalOpen(true);
    }
  };

  // Handler for the pin/unpin confirmation
  const handleConfirmPinUnpin = async (action: 'pin' | 'unpin') => {
    if (!postCode) {
      throw new Error("Post code is missing.");
    }
    try {
      const response = await pinCommunityPost({ postCode, action });
      if (response.success) {
        // Call onSuccess which is now part of this component's logic
        toast.success(response.message || `Post successfully ${action}ned.`);
        const newPinnedStatus = action === 'pin';
        setCurrentIsPinned(newPinnedStatus); // Update local state immediately
        if (onPostUpdated) {
          onPostUpdated(postCode, newPinnedStatus);
        }
        setIsPinModalOpen(false); // Close modal on success
      } else {
        throw new Error(response.message || `Failed to ${action} post.`);
      }
    } catch (error: any) {
      console.error(`Failed to ${action} post:`, error);
      // Re-throw to be caught by modal for display, but also toast here for general feedback
      toast.error(error.message || `Failed to ${action} post. Please try again.`);
      throw error; 
    }
  };
  
  // Conditionally render null if the post is hidden
  if (isHidden) {
    return null;
  }

  return (
    <>
      <Card 
        className={cn(
          "border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden",
          // Use the new animation class
          isAnimatingHide ? "animate-collapse-out" : "animate-scale-in" 
        )}
        onClick={handlePostClick}
        style={{ 
          cursor: disableNavigation ? 'default' : 'pointer',
          // Ensure animation is visible before element is removed
          animationFillMode: isAnimatingHide ? 'forwards' : 'none' 
        }}
      >
        <PostHeader 
          username={username}
          community={community}
          timeAgo={timeAgo}
          avatar={avatar}
          ipfsHash={ipfsHash}
          postCode={postCode}
          onVerifyIpfs={handleVerifyIpfs}
          ipfsSheetOpen={ipfsSheetOpen}
          setIpfsSheetOpen={setIpfsSheetOpen}
          onHidePost={isOwner ? handleOpenHideConfirmation : undefined}
          onReportPost={handleReportPost}
          isOwner={isOwner}
          isAdmin={isAdmin}
          isPinned={currentIsPinned}
          onTogglePin={isAdmin ? handleTogglePin : undefined}
        />
        
        <PostContent 
          content={parsedContent}
          isMirror={isMirror}
          mirrorData={mirrorData}
          hasMedia={hasMedia}
          allMedia={allMedia}
          onImageClick={handleImageClick}
        />
        
        <PostFooter
          localRoared={hasRoared}
          localRoarCount={localRoarCount}
          handleRoar={handleRoar}
          postCode={postCode}
          mirrorSheetOpen={mirrorSheetOpen}
          setMirrorSheetOpen={setMirrorSheetOpen}
          username={username}
          timeAgo={timeAgo}
          content={content}
          allImages={allImages}
          video={video}
          shareSheetOpen={shareSheetOpen}
          setShareSheetOpen={setShareSheetOpen}
          community={community}
          onShareSuccess={handleShareSuccess}
          imageViewerOpen={imageViewerOpen}
          setImageViewerOpen={setImageViewerOpen}
          selectedImageIndex={selectedImageIndex}
          commentCount={commentCount}
          onToggleComments={handleToggleComments}
          isLoggedIn={userIsLoggedIn}
          hideComments={hideComments}
          avatar={avatar}
        >
          {showComments && !hideComments && (
            <div onClick={(e) => e.stopPropagation()} className="w-full">
              {loadingComments ? (
                <div className="w-full py-4 flex justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <CommentSection
                  postCode={postCode || ''}
                  comments={comments}
                  onAddComment={handleAddComment}
                  username={username}
                  community={community}
                />
              )}
            </div>
          )}
        </PostFooter>
        
        {/* Always include the image viewer, even for mirrored posts */}
        {allImages && allImages.length > 0 && (
          <ImageViewer 
            images={allImages} 
            selectedImageIndex={selectedImageIndex}
            open={imageViewerOpen} 
            onOpenChange={setImageViewerOpen} 
          />
        )}
      </Card>
      
      {/* Render the confirmation sheet */}
      <HidePostConfirmationSheet
        open={showHideConfirmation}
        onOpenChange={setShowHideConfirmation}
        onConfirm={confirmHidePost}
        isHiding={isHiding}
      />
      
      {/* Report Post Sheet */}
      {postCode && (
        <ReportPostSheet
          open={showReportSheet}
          onOpenChange={setShowReportSheet}
          postCode={postCode}
          onReportSuccess={handleReportSuccess}
        />
      )}
      {/* Pin Post Confirmation Modal */}
      {postCode && (
        <PinPostConfirmationModal
          isOpen={isPinModalOpen}
          onOpenChange={setIsPinModalOpen}
          postCode={postCode}
          isCurrentlyPinned={currentIsPinned}
          communityName={community}
          onConfirmPinUnpin={handleConfirmPinUnpin}
          onSuccess={() => { /* OnSuccess is now handled within handleConfirmPinUnpin itself */ }}
        />
      )}
    </>
  );
};
