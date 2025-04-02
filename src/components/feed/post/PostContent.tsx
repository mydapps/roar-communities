import React from 'react';
import { CardContent } from '@/components/ui/card';
import { MediaCarousel } from './MediaCarousel';
import { MirrorPostContent } from './MirrorPostContent';

interface PostContentProps {
  content: string;
  isMirror: boolean;
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
  hasMedia: boolean;
  allMedia?: { type: 'image' | 'video', url: string }[];
  onImageClick: (imageSrc: string) => void;
}

export const PostContent: React.FC<PostContentProps> = ({
  content,
  isMirror,
  mirrorData,
  hasMedia,
  allMedia,
  onImageClick
}) => {
  return (
    <CardContent className="pb-3">
      {content && <p className="text-sm mt-2 break-words">{content}</p>}
      
      {isMirror && mirrorData && (
        <MirrorPostContent 
          mirrorData={{
            ...mirrorData,
            originalImages: mirrorData.originalImages || []
          }} 
          onImageClick={onImageClick}
        />
      )}
      
      {!isMirror && hasMedia && allMedia && (
        <div className="mt-3">
          <MediaCarousel 
            media={allMedia} 
            onImageClick={onImageClick} 
          />
        </div>
      )}
    </CardContent>
  );
};
