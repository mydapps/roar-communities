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
import { TipSheet } from '@/components/tip/TipSheet';
import { usePostMedia } from './post/usePostMedia';
import { CommentSection } from './post/CommentSection';
import { fetchReplies, CommentReply } from '@/utils/commentApi';
import { hidePost, pinCommunityPost, PollData } from '@/utils/postApi';
import { voteOnPoll } from '@/utils/pollApi';
import { ImageViewer } from './post/ImageViewer';
import { HidePostConfirmationSheet } from './post/HidePostConfirmationSheet';
import { ReportPostSheet } from './post/ReportPostSheet';
import { PinPostConfirmationModal } from './post/PinPostConfirmationModal';
import { HideWarnModal } from '@/components/admin/HideWarnModal';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';
import { useImageViewer } from '@/components/contexts/ImageViewerContext';

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
  is_poll?: boolean;
  poll_data?: PollData | null;
  onTriggerMobileCommentInput?: () => void;
  tipCount?: number; // Number of tips this post has received
  hasUserTipped?: boolean; // Whether current user has tipped this post
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
  is_poll = false,
  poll_data = null,
  onTriggerMobileCommentInput,
  tipCount = 0,
  hasUserTipped = false,
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
  const [ipfsSheetOpen, setIpfsSheetOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [showHideConfirmation, setShowHideConfirmation] = useState(false);
  const [isAnimatingHide, setIsAnimatingHide] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentIsPinned, setCurrentIsPinned] = useState(isPinned);
  const [showHideWarnModal, setShowHideWarnModal] = useState(false);
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [sheetCommunityName, setSheetCommunityName] = useState("");
  const [tipSheetOpen, setTipSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Image viewer hook
  const { openImageViewer } = useImageViewer();
  
  const [currentPollData, setCurrentPollData] = useState<PollData | null>(poll_data);
  
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
    setCurrentPollData(poll_data);
  }, [roared, roarCount, isPinned, poll_data]);

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
      openImageViewer(allImages, index !== -1 ? index : 0);
    } else if (imageSrc) {
      openImageViewer([imageSrc], 0);
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
    console.log(`Post shared successfully on ${platform}`);
  };
  
  const handleShare = () => {
    setShareSheetOpen(true);
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
  
  const handleVoteOnPoll = async (optionId: number) => {
    if (!postCode || !currentPollData || !currentPollData.is_active) {
      console.warn("Voting not allowed: conditions not met (no postCode, no pollData, or poll inactive).");
      toast({
        title: "Vote Not Allowed",
        description: "This poll is not active or an error occurred.",
        variant: "default",
      });
      return;
    }

    try {
      const response = await voteOnPoll(postCode, optionId);

      if (response.success && typeof response.chosen_option_id !== 'undefined') {
        setCurrentPollData(prevPollData => {
          if (!prevPollData) return null;

          const previousVoteMade = prevPollData.user_has_voted;
          const previousOptionId = prevPollData.chosen_option_id;
          let newTotalVotes = prevPollData.total_votes;

          const newOptions = prevPollData.options.map(opt => {
            let newVoteCount = opt.vote_count;

            if (previousVoteMade && opt.option_id === previousOptionId && opt.option_id !== response.chosen_option_id) {
              // This option was the previous vote, but not the new one. Decrement.
              newVoteCount = Math.max(0, newVoteCount - 1);
            } else if (opt.option_id === response.chosen_option_id) {
              // This option is the new vote.
              if (!previousVoteMade || opt.option_id !== previousOptionId) {
                // Increment if it's a new vote overall, or if it's a changed vote (to a different option).
                // This prevents double-incrementing if the user clicks the already-voted option (which shouldn't happen if PollDisplay disables it, but good for safety).
                newVoteCount = newVoteCount + 1;
              }
              // If previousVoteMade was true AND opt.option_id === previousOptionId (i.e. clicking the same option again),
              // the count remains unchanged by this block, correctly reflecting no change in votes for that option.
            }
            return { ...opt, vote_count: newVoteCount };
          });
          
          if (!previousVoteMade) {
            // If it's a brand new vote (user hadn't voted before)
            newTotalVotes = newTotalVotes + 1;
          } else if (previousVoteMade && previousOptionId !== response.chosen_option_id) {
            // If user changed their vote from one option to another, total votes remain the same.
            // No change to newTotalVotes needed here.
          }
          // If user clicks the same option they already voted for:
          // PollDisplay.tsx allows initiating the vote. The API call is made.
          // `previousVoteMade` is true. `previousOptionId` === `response.chosen_option_id`.
          // In this scenario, vote counts for options won't change based on the new logic.
          // `newTotalVotes` also won't change. This seems correct.

          return {
            ...prevPollData,
            options: newOptions.map(opt => ({
              ...opt,
              percentage: newTotalVotes > 0 ? (opt.vote_count / newTotalVotes) * 100 : 0,
            })),
            total_votes: newTotalVotes,
            user_has_voted: true,
            chosen_option_id: response.chosen_option_id,
          };
        });

        toast({
          title: "Vote Cast!",
          description: response.message || "Your vote has been recorded.",
        });
      } else {
        // API returned success: false or missing chosen_option_id
        if (response && response.errCode === "POLL_COMMUNITY_ACCESS_DENIED" && response.community) {
          setSheetCommunityName(response.community);
          setNotInCommunitySheetOpen(true);
        } else {
          throw new Error(response.message || "Failed to record vote. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Error in handleVoteOnPoll:", error);
      if (error && error.errCode === "POLL_COMMUNITY_ACCESS_DENIED" && error.community) {
        setSheetCommunityName(error.community);
        setNotInCommunitySheetOpen(true);
      } else {
        toast({
          title: "Vote Failed",
          description: error.message || "Could not record your vote due to an unexpected error.",
          variant: "destructive",
        });
      }
    }
  };
  
  if (isHidden && !isAnimatingHide) {
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
          onShare={handleShare}
        />
        
        <PostContent 
          content={parsedContent}
          isMirror={isMirror}
          mirrorData={mirrorData}
          hasMedia={hasMedia}
          allMedia={allMedia}
          onImageClick={handleImageClick}
          is_poll={is_poll}
          poll_data={currentPollData}
          postCode={postCode}
          onVoteOnPoll={handleVoteOnPoll}
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
          commentCount={commentCount}
          onToggleComments={handleToggleComments}
          isLoggedIn={userIsLoggedIn}
          hideComments={hideComments}
          avatar={avatar}
          onTriggerMobileCommentInput={onTriggerMobileCommentInput}
          tipSheetOpen={tipSheetOpen}
          setTipSheetOpen={setTipSheetOpen}
          tipCount={tipCount}
          hasUserTipped={hasUserTipped}
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

      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={sheetCommunityName}
      />

      {/* Tip Sheet */}
      {postCode && (
        <TipSheet
          isOpen={tipSheetOpen}
          onClose={() => setTipSheetOpen(false)}
          postCode={postCode}
          receiverHandle={username}
          receiverAvatar={avatar}
        />
      )}
    </>
  );
};
