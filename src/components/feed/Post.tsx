
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Import sub-components
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
  };
  ipfs?: string;
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
  ipfs
}: PostProps) => {
  const navigate = useNavigate();
  const [localRoared, setLocalRoared] = useState(roared);
  const [localRoarCount, setLocalRoarCount] = useState(roarCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<{id: string, user: string, text: string, timeAgo: string}[]>([]);
  const [mirrorSheetOpen, setMirrorSheetOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [ipfsSheetOpen, setIpfsSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const isMobile = useIsMobile();
  
  const { toast } = useToast();
  
  const ipfsHash = ipfs || postCode || `Qm${Array.from({length: 44}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  const handleRoar = () => {
    if (onRoar) {
      onRoar();
    } else {
      if (localRoared) {
        setLocalRoarCount(prev => prev - 1);
      } else {
        setLocalRoarCount(prev => prev + 1);
      }
      setLocalRoared(!localRoared);
    }
  };

  const handleCommentToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent post navigation
    setShowComments(!showComments);
    
    if (comments.length === 0) {
      setComments([
        { id: '1', user: 'sarah', text: 'This is amazing! Thanks for sharing.', timeAgo: '5m' },
        { id: '2', user: 'alex', text: 'I had a similar experience last week.', timeAgo: '12m' },
      ]);
    }
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
    if (images) {
      const index = images.findIndex(img => img === imageSrc);
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
    
    if (community && postCode) {
      navigate(`/c/${community.toLowerCase().replace(/\s+/g, '-')}/${postCode}`);
    }
  };

  const postId = useRef(postCode || Array.from({length: 6}, () => 
    Math.floor(Math.random() * 36).toString(36)).join('')
  ).current;

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
              <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${username}`} />
              <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{formatUsername(username)}</span>
                <span className="text-muted-foreground text-sm mx-1">·</span>
                <span className="text-muted-foreground text-sm">{timeAgo}</span>
              </div>
              {community && (
                <Badge variant="outline" className="mt-1 w-fit bg-secondary/30 hover:bg-secondary/50 transition-colors">
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
        <p className="text-sm mt-2">{content}</p>
        
        {isMirror && mirrorData && <MirrorPostContent mirrorData={mirrorData} />}
        
        {images && images.length > 0 && (
          <div className="mt-3 relative" data-media-element="true">
            <ImageCarousel images={images} onImageClick={handleImageClick} />
          </div>
        )}
        
        {video && (
          <div className="mt-3" data-media-element="true">
            <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
              <video 
                src={video} 
                controls 
                className="w-full h-full object-cover"
              />
            </AspectRatio>
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
            />
            
            <CommentButton count={commentCount} onClick={handleCommentToggle} />
            
            <MirrorButton 
              open={mirrorSheetOpen} 
              onOpenChange={setMirrorSheetOpen} 
              selectedCommunity={selectedCommunity} 
              onMirror={handleMirror}
              username={username}
              timeAgo={timeAgo}
              content={content}
              images={images}
              video={video}
            />
          </div>
          
          <ShareButton 
            open={shareSheetOpen} 
            onOpenChange={setShareSheetOpen} 
            username={username}
            timeAgo={timeAgo}
            content={content}
            images={images}
            video={video}
            postCode={postCode}
            community={community}
          />
        </div>
        
        {showComments && (
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            <CommentSection 
              comments={comments}
              onAddComment={handleAddComment}
            />
          </div>
        )}
      </CardFooter>

      {images && images.length > 0 && (
        <ImageViewer 
          images={images} 
          selectedImageIndex={selectedImageIndex}
          open={imageViewerOpen} 
          onOpenChange={setImageViewerOpen} 
        />
      )}
    </Card>
  );
};
