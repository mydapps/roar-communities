import React, { useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MediaCarousel } from './MediaCarousel';

interface MirrorPostContentProps {
  mirrorData: {
    quote: string;
    originalAuthor: string;
    originalCommunity: string;
    originalBody: string;
    originalTimeAgo: string;
    originalAvatar: string;
    originalImages?: string[];
    originalTitle?: string;
  };
  onImageClick?: (imageSrc: string) => void;
}

export const MirrorPostContent = ({ mirrorData, onImageClick }: MirrorPostContentProps) => {
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  // Process and clean the original body content to remove markdown image/video tags
  const [cleanedBody, parsedImages, parsedVideos] = useMemo(() => {
    const mediaRegex = /!\[\]\((https:\/\/[^)]+)\)/g;
    const mediaUrls: string[] = [];
    let matches;
    
    while ((matches = mediaRegex.exec(mirrorData.originalBody)) !== null) {
      mediaUrls.push(matches[1]);
    }
    
    const cleanedContent = mirrorData.originalBody.replace(mediaRegex, '').trim();
    
    const extractedImages: string[] = [];
    const extractedVideos: string[] = [];
    
    mediaUrls.forEach(url => {
      if (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video/')) {
        extractedVideos.push(url);
      } else {
        extractedImages.push(url);
      }
    });
    
    return [cleanedContent, extractedImages, extractedVideos];
  }, [mirrorData.originalBody]);
  
  // Process original images array to separate videos and images
  const [mediaImages, mediaVideos] = useMemo(() => {
    if (!mirrorData.originalImages || mirrorData.originalImages.length === 0) return [[], []];
    
    const imgArray: string[] = [];
    const vidArray: string[] = [];
    
    mirrorData.originalImages.forEach(url => {
      if (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video/')) {
        vidArray.push(url);
      } else {
        imgArray.push(url);
      }
    });
    
    return [imgArray, vidArray];
  }, [mirrorData.originalImages]);
  
  // Combine all media sources into a single array of media items
  const allMedia = useMemo(() => {
    const media: { type: 'image' | 'video', url: string }[] = [];
    
    // Add images from original images array
    mediaImages.forEach(url => {
      media.push({ type: 'image', url });
    });
    
    // Add videos from original images array
    mediaVideos.forEach(url => {
      media.push({ type: 'video', url });
    });
    
    // Add images parsed from markdown
    parsedImages.forEach(url => {
      media.push({ type: 'image', url });
    });
    
    // Add videos parsed from markdown
    parsedVideos.forEach(url => {
      media.push({ type: 'video', url });
    });
    
    return media.length > 0 ? media : undefined;
  }, [mediaImages, mediaVideos, parsedImages, parsedVideos]);
  
  // Replace the handleImageClick function
  const handleImageClick = (imageSrc: string) => {
    if (onImageClick) {
      // Use the parent's image click handler if provided
      onImageClick(imageSrc);
    } else {
      // Fallback to opening in a new tab if no handler provided
      window.open(imageSrc, '_blank');
    }
  };
  
  return (
    <div className="mt-3 border rounded-md p-3 bg-muted/30 overflow-hidden">
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={`https://img.dapps.co/avatar/${mirrorData.originalAvatar}.svg`} />
          <AvatarFallback>{mirrorData.originalAuthor.length > 0 ? mirrorData.originalAuthor[0].toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-medium text-sm truncate">{formatUsername(mirrorData.originalAuthor)}</span>
            <span className="text-muted-foreground text-xs mx-1">·</span>
            <span className="text-muted-foreground text-xs">{mirrorData.originalTimeAgo}</span>
            <span className="text-muted-foreground text-xs mx-1">·</span>
            <span className="text-muted-foreground text-xs">{mirrorData.originalCommunity}</span>
          </div>
          
          {mirrorData.originalTitle && (
            <p className="text-sm font-semibold mt-1 break-words">{mirrorData.originalTitle}</p>
          )}
          
          {cleanedBody && (
            <p className="text-sm mt-1 break-words">{cleanedBody}</p>
          )}
          
          {allMedia && allMedia.length > 0 && (
            <div className="mt-2">
              <MediaCarousel 
                media={allMedia} 
                onImageClick={handleImageClick} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
