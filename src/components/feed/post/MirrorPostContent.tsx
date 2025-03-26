
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  
  console.log("Rendering mirrored post with data:", {
    author: mirrorData.originalAuthor,
    hasQuote: !!mirrorData.quote,
    hasImages: mirrorData.originalImages?.length > 0,
    imageCount: mirrorData.originalImages?.length,
    originalTitle: mirrorData.originalTitle
  });
  
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
          
          <p className="text-sm mt-1 break-words">{mirrorData.originalBody}</p>
          
          {mirrorData.originalImages && mirrorData.originalImages.length > 0 && (
            <div className="mt-2">
              <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
                <img 
                  src={mirrorData.originalImages[0]} 
                  alt="Mirrored post attachment" 
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
              
              {mirrorData.originalImages.length > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{mirrorData.originalImages.length - 1} more images
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
