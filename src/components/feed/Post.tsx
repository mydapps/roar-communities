import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { fetchReplies, CommentReply } from '@/utils/commentApi';
import { ImageViewer } from './post/ImageViewer';

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
  isLoggedIn?: boolean;
  onToggleComments?: () => void;
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
  onToggleComments
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
  const isMobile = useIsMobile();
  
  const { parsedContent, allMedia, allImages: normalImages, hasMedia } = usePostMedia(content, images, video);
  
  // Combine normal images with mirrored post images if this is a mirrored post
  const allImages = useMemo(() => {
    if (isMirror && mirrorData?.originalImages && mirrorData.originalImages.length > 0) {
      // Filter out any invalid URLs or duplicate images
      const mirrorImages = mirrorData.originalImages.filter(img => 
        img && img.trim() !== '' && img !== 'https://dapps.co/dapps.png'
      );
      
      // Combine normal images (if any) with mirror images
      return normalImages ? [...normalImages, ...mirrorImages] : mirrorImages;
    }
    
    return normalImages;
  }, [normalImages, isMirror, mirrorData]);
  
  const { toast } = useToast();
  
  const userIsLoggedIn = isLoggedIn !== undefined ? isLoggedIn : !!localStorage.getItem('dapps_user_key');
  
  const ipfsHash = ipfs || postCode || `Qm${Array.from({length: 44}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  useEffect(() => {
    setHasRoared(roared);
    setLocalRoarCount(roarCount);
  }, [roared, roarCount]);

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
        postCode={postCode}
        onVerifyIpfs={handleVerifyIpfs}
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
  );
};
