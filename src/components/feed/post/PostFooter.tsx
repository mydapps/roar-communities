import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Loader2, MessageCircle } from 'lucide-react';
import { RoarButton } from './RoarButton';
import { MirrorButton } from './MirrorButton';
import { CommentButton } from './CommentButton';
import { ShareButton } from './ShareButton';
import { TipButton } from '@/components/tip/TipButton';
import { ImageViewer } from './ImageViewer';
import { useLocation } from 'react-router-dom';
import { isMobile } from '@/utils/responsive';
import { Button } from '@/components/ui/button';

interface PostFooterProps {
  localRoared: boolean;
  localRoarCount: number;
  handleRoar: () => void;
  postCode?: string;
  mirrorSheetOpen: boolean;
  setMirrorSheetOpen: (open: boolean) => void;
  username: string;
  timeAgo: string;
  content: string;
  allImages?: string[];
  video?: string;
  shareSheetOpen: boolean;
  setShareSheetOpen: (open: boolean) => void;
  community?: string;
  onShareSuccess: (platform: string) => void;

  children?: React.ReactNode;
  commentCount: number;
  onToggleComments: () => void;
  isLoggedIn?: boolean;
  hideComments?: boolean;
  avatar?: string;
  onTriggerMobileCommentInput?: () => void;

  // Tipping props
  tipSheetOpen: boolean;
  setTipSheetOpen: (open: boolean) => void;
  tipCount?: number;
  hasUserTipped?: boolean;
  onTipSuccess?: (tipData: {
    senderHandle: string;
    receiverHandle: string;
    amount: number;
    asset: string;
    usdValue?: number;
    parentReplyId?: number;
  }) => void;
}

export const PostFooter: React.FC<PostFooterProps> = ({
  localRoared,
  localRoarCount,
  handleRoar,
  postCode,
  mirrorSheetOpen,
  setMirrorSheetOpen,
  username,
  timeAgo,
  content,
  allImages,
  video,
  shareSheetOpen,
  setShareSheetOpen,
  community,
  onShareSuccess,

  children,
  commentCount,
  onToggleComments,
  isLoggedIn,
  hideComments = false,
  avatar,
  onTriggerMobileCommentInput,

  // Tipping props
  tipSheetOpen,
  setTipSheetOpen,
  tipCount = 0,
  hasUserTipped = false,
  onTipSuccess
}) => {
  const location = useLocation();
  
  // Check if this is a detailed post page
  const isDetailedPostPage = location.pathname.includes('/post/') || 
                            location.pathname.match(/^\/c\/[^\/]+\/[^\/]+$/) || 
                            (location.pathname.match(/^\/[^\/]+\/[^\/]+$/) && !location.pathname.startsWith('/c/') && !location.pathname.startsWith('/u/'));
  


  
  // Function to trigger mobile comment input
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent Post component's click handler from firing
    if (onTriggerMobileCommentInput) {
      onTriggerMobileCommentInput();
    }
  };
  
  return (
    <CardFooter className="pt-0 flex justify-between flex-col">
      <div className="flex justify-between w-full mb-3">
        <div className="flex items-center gap-1.5">
          <RoarButton 
            count={localRoarCount} 
            active={localRoared} 
            onClick={handleRoar}
            postCode={postCode}
            isLoggedIn={isLoggedIn}
            handleApiCall={false} 
          />
          
          {/* Show comment button between roar and mirror on mobile detailed post page */}
          {isMobile() && isDetailedPostPage && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCommentClick}
              className="gap-2 hover:text-blue-500 hover:bg-blue-500/10 px-3 rounded-full transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </Button>
          )}
          
          {/* Show comment button except when explicitly hidden or on detailed post page */}
          {!hideComments && !isDetailedPostPage && (
            <CommentButton 
              count={commentCount} 
              onClick={onToggleComments}
            />
          )}
          
          <MirrorButton 
            open={mirrorSheetOpen} 
            onOpenChange={setMirrorSheetOpen} 
            username={username}
            timeAgo={timeAgo}
            content={content}
            images={allImages}
            video={video}
            postCode={postCode}
            community={community}
          />

          {/* Tip Button */}
          {postCode && (
            <TipButton
              postCode={postCode}
              receiverHandle={username}
              onTipClick={() => setTipSheetOpen(true)}
              tipCount={tipCount}
              hasUserTipped={hasUserTipped}
            />
          )}
        </div>
        
        <ShareButton 
          open={shareSheetOpen} 
          onOpenChange={setShareSheetOpen} 
          username={username}
          timeAgo={timeAgo}
          content={content}
          images={allImages}
          video={video}
          postCode={postCode}
          community={community}
          onShareSuccess={onShareSuccess}
          avatar={avatar}
        />
      </div>
      
      {children}
    </CardFooter>
  );
};
