
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

import { ImageCarousel } from './post/ImageCarousel';
import { ImageViewer } from './post/ImageViewer';
import { RoarButton } from './post/RoarButton';
import { CommentButton } from './post/CommentButton';
import { MirrorButton } from './post/MirrorButton';
import { ShareButton } from './post/ShareButton';
import { IpfsButton } from './post/IpfsButton';
import { MirrorPostContent } from './post/MirrorPostContent';
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
  avatar
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
  
  // Parse embedded media from content
  const [parsedContent, parsedImages, parsedVideos] = useMemo(() => {
    // Regular expression to find markdown image syntax
    const mediaRegex = /!\[\]\((https:\/\/[^)]+)\)/g;
    const mediaUrls: string[] = [];
    let matches;
    
    // Find all media URLs in the content
    while ((matches = mediaRegex.exec(content)) !== null) {
      mediaUrls.push(matches[1]);
    }
    
    // Remove markdown images from content text
    const cleanedContent = content.replace(mediaRegex, '').trim();
    
    // Separate images and videos
    const extractedImages: string[] = [];
    const extractedVideos: string[] = [];
    
    mediaUrls.forEach(url => {
      if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
        extractedVideos.push(url);
      } else {
        extractedImages.push(url);
      }
    });
    
    return [cleanedContent, extractedImages, extractedVideos];
  }, [content]);
  
  // Combine explicitly provided images with ones extracted from content
  const allImages = useMemo(() => {
    const combinedImages = [...(images || [])];
    if (parsedImages.length > 0) {
      combinedImages.push(...parsedImages);
    }
    return combinedImages.length > 0 ? combinedImages : undefined;
  }, [images, parsedImages]);
  
  const { toast } = useToast();
  
  const ipfsHash = ipfs || postCode || `Qm${Array.from({length: 44}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  useEffect(() => {
    setLocalRoared(roared);
    setLocalRoarCount(roarCount);
  }, [roared, roarCount]);

  const handleRoar = async () => {
    if (onRoar) {
      const newRoaredState = !localRoared;
      setLocalRoared(newRoaredState);
      setLocalRoarCount(prev => newRoaredState ? prev + 1 : prev - 1);
      
      onRoar();
    }
  };

  const handleCommentToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showComments) {
      setLoadingComments(true);
      setTimeout(() => {
        setLoadingComments(false);
      }, 1000);
    }
    
    setShowComments(!showComments);
  };

  const handleAddComment = (text: string) => {
    if (text.trim()) {
      const newId = `comment-${Date.now()}`;
      setComments([
        ...comments,
        { id: newId, user: 'you', text, timeAgo: 'just now' }
      ]);
      toast({
        title: "Comment added",
        description: "Your comment has been added to the post"
      });
    }
  };

  const handleMirror = () => {
    if (selectedCommunity) {
      setMirrorSheetOpen(false);
      setSelectedCommunity(null);
    }
  };

  const verifyOnIpfs = () => {
    window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank');
  };

  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
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

  const handleCommunityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (community) {
      navigate(`/c/${community.toLowerCase().replace(/\s+/g, '-')}`);
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
    
    if (community && postCode) {
      navigate(`/c/${community.toLowerCase().replace(/\s+/g, '-')}/${postCode}`);
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

  // Added missing useMemo import 
  const { useMemo } = React;

  return (
    <Card 
      className="border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden animate-scale-in"
      onClick={handlePostClick}
      style={{ cursor: disableNavigation ? 'default' : 'pointer' }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20 hover:border-primary/50 transition-colors">
              <AvatarImage src={avatar ? `https://img.dapps.co/avatar/${avatar}.svg` : undefined} />
              <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{formatUsername(username)}</span>
                <span className="text-muted-foreground text-sm mx-1">·</span>
                <span className="text-muted-foreground text-sm">{timeAgo}</span>
              </div>
              {community && (
                <Badge 
                  variant="outline" 
                  className="mt-1 w-fit bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={handleCommunityClick}
                >
                  <span className="text-xs">{community}</span>
                </Badge>
              )}
            </div>
          </div>
          
          <IpfsButton 
            open={ipfsSheetOpen} 
            onOpenChange={setIpfsSheetOpen} 
            ipfsHash={ipfsHash} 
            onVerify={verifyOnIpfs} 
          />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {parsedContent && <p className="text-sm mt-2 break-words">{parsedContent}</p>}
        
        {isMirror && mirrorData && (
          <MirrorPostContent 
            mirrorData={{
              ...mirrorData,
              originalImages: mirrorData.originalImages || []
            }} 
          />
        )}
        
        {!isMirror && allImages && allImages.length > 0 && (
          <div className="mt-3 relative" data-media-element="true">
            <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
              <ImageCarousel images={allImages} onImageClick={handleImageClick} />
            </AspectRatio>
          </div>
        )}
        
        {!isMirror && (parsedVideos && parsedVideos.length > 0 || video) && (
          <div className="mt-3 space-y-3" data-media-element="true">
            {/* Display explicitly provided video */}
            {video && (
              <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
                <video 
                  src={video} 
                  controls 
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              </AspectRatio>
            )}
            
            {/* Display videos extracted from content */}
            {parsedVideos && parsedVideos.map((videoUrl, index) => (
              <AspectRatio key={`video-${index}`} ratio={16/9} className="overflow-hidden rounded-md">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              </AspectRatio>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex justify-between flex-col">
        <div className="flex justify-between w-full mb-3">
          <div className="flex items-center gap-1.5">
            <RoarButton 
              count={localRoarCount} 
              active={localRoared} 
              onClick={handleRoar}
              postCode={postCode}
            />
            
            <CommentButton count={commentCount} onClick={handleCommentToggle} />
            
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
            onShareSuccess={handleShareSuccess}
          />
        </div>
        
        {showComments && (
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
      </CardFooter>

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

