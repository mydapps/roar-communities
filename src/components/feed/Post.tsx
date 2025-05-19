import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { PostHeader } from './post/PostHeader';
import { PostContent } from './post/PostContent';
import { PostFooter } from './post/PostFooter';
import { usePostMedia } from './post/usePostMedia';
import { CommentSection } from './post/CommentSection';
import { fetchReplies, CommentReply } from '@/utils/commentApi';
import { hidePost, pinCommunityPost } from '@/utils/postApi';
import { ImageViewer } from './post/ImageViewer';
import { HidePostConfirmationSheet } from './post/HidePostConfirmationSheet';
import { ReportPostSheet } from './post/ReportPostSheet';
import { PinPostConfirmationModal } from './post/PinPostConfirmationModal';
import { HideWarnModal } from '@/components/admin/HideWarnModal';

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
  const [showHideConfirmation, setShowHideConfirmation] = useState(false);
  const [isAnimatingHide, setIsAnimatingHide] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentIsPinned, setCurrentIsPinned] = useState(isPinned);
  const [showHideWarnModal, setShowHideWarnModal] = useState(false);
  const isMobile = useIsMobile();
  
  const { parsedContent, allMedia, allImages: normalImages, hasMedia } = usePostMedia(content, images, video);
  
  const allImages = useMemo(() => {
    const combinedImages = new Set<string>();

    if (normalImages) {
      normalImages.forEach(img => {
        if (img && img.trim() !== '' && img !== 'https://dapps.co/dapps.png') {
          combinedImages.add(img);
        }
      });
    }

    if (isMirror && mirrorData?.originalImages) {
      mirrorData.originalImages.forEach(img => {
        if (img && img.trim() !== '' && img !== 'https://dapps.co/dapps.png') {
          combinedImages.add(img);
        }
      });
    }
    
    const uniqueImageList = Array.from(combinedImages);
    return uniqueImageList.length > 0 ? uniqueImageList : undefined;

  }, [normalImages, isMirror, mirrorData]);
  
  const { toast } = useToast();
  
  const loggedInUserHandle = localStorage.getItem('dapps_user_handle'); 
  const isOwner = loggedInUserHandle === username;
  
  const userIsLoggedIn = useMemo(() => {
    return !!localStorage.getItem('dapps_user_id'); 
  }, []);
  
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
      const newRoaredState = !hasRoared;
      setHasRoared(newRoaredState);
      setLocalRoarCount(prev => newRoaredState ? prev + 1 : prev - 1);
      
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
    if (ipfsHash) {
      const url = `https://ipfs.dapps.co/ipfs/${ipfsHash}?loadIn=defaultBrowser`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast({
        title: "IPFS Verification",
        description: `Opening IPFS content for hash: ${ipfsHash}`,
      });
    } else {
      toast({
        title: "IPFS Hash Missing",
        description: "Cannot verify content as IPFS hash is not available.",
        variant: "destructive",
      });
    }
  };

  const handleImageClick = (imageSrc: string) => {
    if (allImages) {
      const index = allImages.findIndex(img => img === imageSrc);
      if (index !== -1) {
        setSelectedImageIndex(index);
        setImageViewerOpen(true);
      } else {
        console.warn("Image clicked but not found in allImages:", imageSrc);
        
        setSelectedImageIndex(0);
        setImageViewerOpen(true);
      }
    } else if (imageSrc) {
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

    if (isClickInsideMirror && isMirror && mirrorData?.originalPostCode) {
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
      return;
    }

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
          onClick={() => navigate('/login')}
        >
          Login
        </button>
      });
      return;
    }
    
    setShowComments(!showComments);
    
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

  const handleOpenHideConfirmation = () => {
    if (!isOwner || isHiding || isHidden) return;
    console.log(`UI Action: Open hide confirmation for post ${postCode}`);
    setShowHideConfirmation(true);
  };

  const confirmHidePost = async () => {
    if (!postCode) {
      toast({ description: "Cannot hide post: Missing identifier.", variant: "destructive" });
      return;
    }
    if (isHiding) return;

    console.log(`UI Action: Confirmed hide post ${postCode}`);
    setIsHiding(true);

    try {
      const response = await hidePost(postCode, 'hide');
      if (response.success) {
        setShowHideConfirmation(false);
        
        setTimeout(() => {
          setIsAnimatingHide(true);
          toast({ description: response.message || "Post hidden successfully." });

          setTimeout(() => {
            setIsHidden(true); 
          }, 350);
        }, 50);
        
      } else {
        toast({ description: response.message || "Failed to hide post.", variant: "destructive" });
        setIsHiding(false);
      }
    } catch (error) {
      console.error("Error in confirmHidePost:", error);
      toast({ description: "An unexpected error occurred while hiding the post.", variant: "destructive" });
      setIsHiding(false);
    }
  };

  const handleReportPost = () => {
    console.log(`UI Action: Report post ${postCode}`);
    if (!postCode) {
      toast({ description: "Cannot report post: Missing identifier.", variant: "destructive" });
      return;
    }
    setShowReportSheet(true); 
  };

  const handleReportSuccess = () => {
    console.log(`Report submitted successfully for post ${postCode}`);
  };
  
  const handleTogglePin = () => {
    if (isAdmin) {
      setIsPinModalOpen(true);
    }
  };

  const handleConfirmPinUnpin = async (action: 'pin' | 'unpin') => {
    if (!postCode) {
      throw new Error("Post code is missing.");
    }
    try {
      const response = await pinCommunityPost({ postCode, action });
      if (response.success) {
        toast({ description: response.message || `Post successfully ${action}ned.` });
        const newPinnedStatus = action === 'pin';
        setCurrentIsPinned(newPinnedStatus);
        if (onPostUpdated) {
          onPostUpdated(postCode, newPinnedStatus);
        }
        setIsPinModalOpen(false);
      } else {
        throw new Error(response.message || `Failed to ${action} post.`);
      }
    } catch (error: any) {
      console.error(`Failed to ${action} post:`, error);
      toast({ description: error.message || `Failed to ${action} post. Please try again.`, variant: "destructive" });
      throw error; 
    }
  };
  
  const handleOpenHideWarnModal = () => {
    if (!isAdmin || isOwner || !postCode || !community) return;
    console.log(`UI Action: Open hide/warn modal for post ${postCode} in ${community}`);
    setShowHideWarnModal(true);
  };

  const handleHideWarnSuccess = () => {
    console.log(`Post ${postCode} hidden and warning issued by admin.`);
    setTimeout(() => {
      setIsAnimatingHide(true);
      setTimeout(() => {
        setIsHidden(true); 
      }, 350);
    }, 50); 
  };
  
  if (isHidden) {
    return null;
  }

  return (
    <>
      <Card 
        className={cn(
          "border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden",
          isAnimatingHide ? "animate-collapse-out" : "animate-scale-in" 
        )}
        onClick={handlePostClick}
        style={{ 
          cursor: disableNavigation ? 'default' : 'pointer',
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
          onAdminHideWarn={isAdmin && !isOwner ? handleOpenHideWarnModal : undefined}
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
        
        {allImages && allImages.length > 0 && (
          <ImageViewer 
            images={allImages} 
            selectedImageIndex={selectedImageIndex}
            open={imageViewerOpen} 
            onOpenChange={setImageViewerOpen} 
          />
        )}
      </Card>
      
      <HidePostConfirmationSheet
        open={showHideConfirmation}
        onOpenChange={setShowHideConfirmation}
        onConfirm={confirmHidePost}
        isHiding={isHiding}
      />
      
      {postCode && (
        <ReportPostSheet
          open={showReportSheet}
          onOpenChange={setShowReportSheet}
          postCode={postCode}
          onReportSuccess={handleReportSuccess}
        />
      )}
      {postCode && community && (
        <PinPostConfirmationModal
          isOpen={isPinModalOpen}
          onOpenChange={setIsPinModalOpen}
          postCode={postCode}
          isCurrentlyPinned={currentIsPinned}
          communityName={community}
          onConfirmPinUnpin={handleConfirmPinUnpin}
          onSuccess={() => {}}
        />
      )}

      {postCode && community && (
        <HideWarnModal
          open={showHideWarnModal}
          onOpenChange={setShowHideWarnModal}
          postCode={postCode}
          communityName={community}
          onSuccess={handleHideWarnSuccess}
        />
      )}
    </>
  );
};
