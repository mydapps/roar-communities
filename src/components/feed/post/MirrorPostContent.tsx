import React, { useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MediaCarousel } from './MediaCarousel';
import { processTextContent } from '@/utils/textFormatting';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

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

// Define the regex for linkification using a single template literal
const MENTION_OR_URL_REGEX_MIRROR = new RegExp(
  `(\\b(?:https?://|www\\.)[^\\s<>()"\\]*[^\\s<>()"\\.,!?:;'])|(?<![\\w\\/@\\.])(@([a-zA-Z0-9_\\-]+(?:\\.[a-zA-Z0-9_\\-]+)*))|(?<![\\w\\/])(\\/c\\/([a-zA-Z0-9_\\-]+))|(\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b)`,
  'g'
);

export const MirrorPostContent = ({ mirrorData, onImageClick }: MirrorPostContentProps) => {
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  const [bodyHtmlToRender, parsedImagesFromMarkdown, parsedVideosFromMarkdown] = useMemo(() => {
    const mediaRegex = /!\[\]\((https:\/\/[^)]+)\)/g;
    const mediaUrlsFromMarkdown: string[] = [];
    let matches;
    
    const sanitizedOriginalBody = sanitizeHtml(mirrorData.originalBody);

    let tempSanitizedBodyForMediaExtraction = sanitizedOriginalBody;
    while ((matches = mediaRegex.exec(tempSanitizedBodyForMediaExtraction)) !== null) {
      mediaUrlsFromMarkdown.push(matches[1]);
    }
    
    const contentForLinkification = sanitizedOriginalBody.replace(mediaRegex, '').trim();
    
    const extractedImages: string[] = [];
    const extractedVideos: string[] = [];
    mediaUrlsFromMarkdown.forEach(url => {
      if (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video/')) {
        extractedVideos.push(url);
      } else {
        extractedImages.push(url);
      }
    });
    
    let finalHtml = '';
    let lastIndex = 0;
    contentForLinkification.replace(MENTION_OR_URL_REGEX_MIRROR, (match: string, 
      url: string | undefined, 
      userMentionFull: string | undefined, 
      _userMentionInner: string | undefined, 
      communityMentionFull: string | undefined, 
      _communityMentionInner: string | undefined, 
      email: string | undefined, 
      offset: number,
      _fullString: string // Add fullString to match expected signature for .replace with function
    ): string => {
      finalHtml += contentForLinkification.substring(lastIndex, offset);
      if (url) {
        let linkHref = url;
        if (url.startsWith('www.') && !url.startsWith('http://') && !url.startsWith('https://')) {
          linkHref = 'http://' + url;
        }
        if (linkHref.includes('?')) {
          linkHref += '&loadIn=defaultBrowser';
        } else {
          linkHref += '?loadIn=defaultBrowser';
        }
        finalHtml += `<a href="${linkHref}" target="_blank" rel="noopener noreferrer ugc" class="text-primary hover:underline">${url}</a>`;
      } else if (email) {
        finalHtml += email;
      } else if (userMentionFull) {
        const usernameForUrl = userMentionFull.substring(1).split('.')[0];
        finalHtml += `<a href="/u/${usernameForUrl}" class="text-primary hover:underline">${userMentionFull}</a>`;
      } else if (communityMentionFull) {
        const communityName = communityMentionFull.substring(3);
        finalHtml += `<a href="/c/${communityName}" class="text-primary hover:underline">${communityMentionFull}</a>`;
      }
      lastIndex = offset + match.length;
      return match; 
    });
    finalHtml += contentForLinkification.substring(lastIndex);
    
    return [finalHtml, extractedImages, extractedVideos];
  }, [mirrorData.originalBody]);
  
  const [mediaImagesFromProps, mediaVideosFromProps] = useMemo(() => {
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
  
  const allMedia = useMemo(() => {
    const media: { type: 'image' | 'video', url: string }[] = [];
    const uniqueUrls = new Set<string>();
    const addMediaItem = (item: { type: 'image' | 'video', url: string }) => {
      if (item.url && !uniqueUrls.has(item.url)) {
        media.push(item);
        uniqueUrls.add(item.url);
      }
    };
    mediaImagesFromProps.forEach(url => addMediaItem({ type: 'image', url }));
    mediaVideosFromProps.forEach(url => addMediaItem({ type: 'video', url }));
    parsedImagesFromMarkdown.forEach(url => addMediaItem({ type: 'image', url })); 
    parsedVideosFromMarkdown.forEach(url => addMediaItem({ type: 'video', url }));
    return media.length > 0 ? media : undefined;
  }, [mediaImagesFromProps, mediaVideosFromProps, parsedImagesFromMarkdown, parsedVideosFromMarkdown]);
  
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
      {/* Render the quote if it exists */}
      {mirrorData.quote && (
        <div className="text-sm italic p-2 pl-3 border-l-4 border-muted-foreground/50 my-2 mb-3 prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-strong:font-semibold prose-em:italic">
          {processTextContent(mirrorData.quote)}
        </div>
      )}

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
          
          {bodyHtmlToRender && (
            <div 
              className="text-sm mt-1 break-words whitespace-pre-line prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-strong:font-semibold prose-em:italic"
              dangerouslySetInnerHTML={{ __html: bodyHtmlToRender }}
            />
          )}
          
          {allMedia && allMedia.length > 0 && (
            <div 
              className="mt-2"
              // Stop click propagation when clicking on the media carousel
              onClick={(e) => {
                e.stopPropagation();
                console.log('Media Carousel area clicked, stopping propagation.');
              }}
            >
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
