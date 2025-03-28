
import React, { useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Image as ImageIcon, Film } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';

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
}

export const MirrorPostContent = ({ mirrorData }: MirrorPostContentProps) => {
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
  
  // Combine all image sources
  const allImages = useMemo(() => {
    const combinedImages = [...mediaImages];
    if (parsedImages.length > 0) {
      combinedImages.push(...parsedImages);
    }
    return combinedImages.length > 0 ? combinedImages : undefined;
  }, [mediaImages, parsedImages]);
  
  // Combine all video sources
  const allVideos = useMemo(() => {
    const combinedVideos = [...mediaVideos];
    if (parsedVideos && parsedVideos.length > 0) {
      combinedVideos.push(...parsedVideos);
    }
    return combinedVideos.length > 0 ? combinedVideos : undefined;
  }, [mediaVideos, parsedVideos]);
  
  // Check if post has any media
  const hasMedia = useMemo(() => {
    return (allImages && allImages.length > 0) || (allVideos && allVideos.length > 0);
  }, [allImages, allVideos]);
  
  // Simple function to handle image click (could be expanded for a fullscreen viewer)
  const handleImageClick = (imageSrc: string) => {
    // For now, just open the image in a new tab
    window.open(imageSrc, '_blank');
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
          
          {hasMedia && (
            <div className="mt-2" data-media-element="true">
              {/* Header for media section when both image and video are present */}
              {allImages && allVideos && (
                <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                  {allImages && allImages.length > 0 && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{allImages.length} {allImages.length === 1 ? 'Image' : 'Images'}</span>
                    </div>
                  )}
                  {allVideos && allVideos.length > 0 && (
                    <div className="flex items-center gap-1 ml-3">
                      <Film className="h-3.5 w-3.5" />
                      <span>{allVideos.length} {allVideos.length === 1 ? 'Video' : 'Videos'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Display images */}
              {allImages && allImages.length > 0 && (
                <div className="mb-3">
                  <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
                    <ImageCarousel images={allImages} onImageClick={handleImageClick} />
                  </AspectRatio>
                </div>
              )}
              
              {/* Display videos */}
              {allVideos && allVideos.length > 0 && (
                <div className="space-y-3">
                  {allVideos.map((videoUrl, index) => (
                    <AspectRatio key={`video-${index}`} ratio={16/9} className="overflow-hidden rounded-md">
                      <video 
                        src={videoUrl} 
                        controls 
                        className="w-full h-full object-cover"
                        preload="metadata"
                        poster={`${videoUrl}?poster=true`}
                      />
                    </AspectRatio>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
