import React, { useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MediaCarousel } from './MediaCarousel';
// import { processTextContent } from '@/utils/textFormatting'; // No longer used here
import { processRichTextForDisplayingPosts } from '@/utils/textFormatting'; // Import the new function
// import { sanitizeHtml } from '@/utils/sanitizeHtml'; // No longer needed directly here

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
    originalPostCode?: string;
  };
  onImageClick?: (imageSrc: string) => void;
}

// MENTION_OR_URL_REGEX_MIRROR is no longer needed as processTextContent handles this.

export const MirrorPostContent = ({ mirrorData, onImageClick }: MirrorPostContentProps) => {
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  const processedOriginalHtmlBody = useMemo(() => {
    return processRichTextForDisplayingPosts(mirrorData.originalBody);
  }, [mirrorData.originalBody]);
  
  // Media from mirrorData.originalImages (e.g., attachments) will be handled by MediaCarousel.
  // Media embedded in markdown in originalBody is now rendered by processTextContent.
  const mediaForCarousel = useMemo(() => {
    if (!mirrorData.originalImages || mirrorData.originalImages.length === 0) return undefined;
    
    const mediaItems: { type: 'image' | 'video', url: string }[] = [];
    const uniqueUrls = new Set<string>();

    mirrorData.originalImages.forEach(url => {
      if (url && !uniqueUrls.has(url)) {
        const type = (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video/')) ? 'video' : 'image';
        mediaItems.push({ type, url });
        uniqueUrls.add(url);
      }
    });
    return mediaItems.length > 0 ? mediaItems : undefined;
  }, [mirrorData.originalImages]);
  
  const handleImageClick = (imageSrc: string) => {
    if (onImageClick) {
      onImageClick(imageSrc);
    } else {
      window.open(imageSrc, '_blank');
    }
  };
  
  return (
    <div 
      className="mt-3 border rounded-md p-3 bg-muted/30 overflow-hidden"
      data-mirror-content-area="true"
    >
      {/* Quote rendering removed from here */}

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
          
          {/* Render the processed original body using dangerouslySetInnerHTML */}
          {processedOriginalHtmlBody && (
            <div 
              className="text-sm mt-1 break-words whitespace-pre-line prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-strong:font-semibold prose-em:italic"
              dangerouslySetInnerHTML={{ __html: processedOriginalHtmlBody }}
            />
          )}
          
          {/* MediaCarousel now only shows media from mirrorData.originalImages */}
          {mediaForCarousel && mediaForCarousel.length > 0 && (
            <div 
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Media Carousel area clicked, stopping propagation.');
              }}
            >
              <MediaCarousel 
                media={mediaForCarousel} 
                onImageClick={handleImageClick} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
