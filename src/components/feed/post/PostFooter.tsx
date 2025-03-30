
import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { RoarButton } from './RoarButton';
import { MirrorButton } from './MirrorButton';
import { CommentButton } from './CommentButton';
import { ShareButton } from './ShareButton';
import { ImageViewer } from './ImageViewer';
import { useLocation } from 'react-router-dom';

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
  imageViewerOpen: boolean;
  setImageViewerOpen: (open: boolean) => void;
  selectedImageIndex: number;
  children?: React.ReactNode;
  commentCount: number;
  onToggleComments: () => void;
  isLoggedIn?: boolean;
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
  imageViewerOpen,
  setImageViewerOpen,
  selectedImageIndex,
  children,
  commentCount,
  onToggleComments,
  isLoggedIn
}) => {
  const location = useLocation();
  
  // Check if we're on a post detail page
  const isPostDetailPage = 
    /^\/c\/[\w-]+\/[\w-]+$/.test(location.pathname) || // community post: /c/communityId/postId
    /^\/[\w-]+\/[\w-]+$/.test(location.pathname) ||    // user post: /handle/postId
    /^\/post\/[\w-]+$/.test(location.pathname);        // generic post: /post/postId

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
          />
          
          <CommentButton 
            count={commentCount} 
            onClick={onToggleComments}
            hidden={isPostDetailPage} 
          />
          
          <MirrorButton 
            open={mirrorSheetOpen} 
            onOpenChange={setMirrorSheetOpen} 
            username={username}
            timeAgo={timeAgo}
            content={content}
            images={allImages}
            video={video}
            postCode={postCode}
          />
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
        />
      </div>
      
      {children}

      {allImages && allImages.length > 0 && (
        <ImageViewer 
          images={allImages} 
          selectedImageIndex={selectedImageIndex}
          open={imageViewerOpen} 
          onOpenChange={setImageViewerOpen} 
        />
      )}
    </CardFooter>
  );
};
