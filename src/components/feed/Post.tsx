
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

import { PostHeader } from './post/PostHeader';
import { PostContent } from './post/PostContent';
import { PostFooter } from './post/PostFooter';
import { usePostMedia } from './post/usePostMedia';
import { CommentSection } from './post/CommentSection';

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
  };
  ipfs?: string;
  avatar?: string;
  hideComments?: boolean;
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
  hideComments = false
}: PostProps) => {
  const navigate = useNavigate();
  const [localRoared, setLocalRoared] = useState(roared);
  const [localRoarCount, setLocalRoarCount] = useState(roarCount);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<{id: string, user: string, text: string, timeAgo: string}[]>([]);
  const [mirrorSheetOpen, setMirrorSheetOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [ipfsSheetOpen, setIpfsSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const isMobile = useIsMobile();
  
  const { parsedContent, allMedia, allImages, hasMedia } = usePostMedia(content, images, video);
  
  const { toast } = useToast();
  
  const ipfsHash = ipfs || postCode || `Qm${Array.from({length: 44}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  useEffect(() => {
    setLocalRoared(roared);
    setLocalRoarCount(roarCount);
  }, [roared, roarCount]);

  const handleRoar = async () => {
    if (postCode) {
      const newRoaredState = !localRoared;
      setLocalRoared(newRoaredState);
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

  const handleVerifyOnIpfs = () => {
    window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank');
  };

  const handleImageClick = (imageSrc: string) => {
    if (allImages) {
      const index = allImages.findIndex(img => img === imageSrc);
      if (index !== -1) {
        setSelectedImageIndex(index);
        setImageViewerOpen(true);
      }
    }
  };

  const handlePostClick = (e: React.MouseEvent) => {
    if (disableNavigation || 
        (e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('a') ||
        (e.target as HTMLElement).closest('[data-media-element="true"]') ||
        (e.target as HTMLElement).closest('form') ||
        showComments) {
      return;
    }
    
    if (postCode) {
      if (community) {
        navigate(`/c/${community.toLowerCase().replace(/\s+/g, '-')}/${postCode}`);
      } else {
        navigate(`/${username.split('.')[0]}/${postCode}`);
      }
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

  // Add the handleAddComment function
  const handleAddComment = (text: string) => {
    if (!text.trim()) return;
    
    const newCommentObj = {
      id: `comment-${Date.now()}`,
      user: 'You',
      text: text,
      timeAgo: 'just now'
    };
    
    setComments(prev => [newCommentObj, ...prev]);
    setNewComment('');
  };

  return (
    <Card 
      className="border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden animate-scale-in"
      onClick={handlePostClick}
      style={{ cursor: disableNavigation ? 'default' : 'pointer' }}
    >
      <PostHeader 
        username={username}
        community={community}
        timeAgo={timeAgo}
        avatar={avatar}
        ipfsHash={ipfsHash}
        onVerifyIpfs={handleVerifyOnIpfs}
        ipfsSheetOpen={ipfsSheetOpen}
        setIpfsSheetOpen={setIpfsSheetOpen}
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
        localRoared={localRoared}
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
      >
        {!hideComments && showComments && (
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            {loadingComments ? (
              <div className="w-full py-8 flex justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <CommentSection 
                comments={comments}
                postCode={postCode || ''}
                onAddComment={handleAddComment}
              />
            )}
          </div>
        )}
      </PostFooter>
    </Card>
  );
};
