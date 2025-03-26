
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface MirrorPostContentProps {
  mirrorData: {
    quote: string;
    originalAuthor: string;
    originalCommunity: string;
    originalBody: string;
    originalTimeAgo: string;
    originalAvatar: string;
  };
}

export const MirrorPostContent = ({ mirrorData }: MirrorPostContentProps) => {
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  return (
    <div className="mt-3 border rounded-md p-3 bg-muted/30">
      {mirrorData.quote && mirrorData.quote.trim() !== "" && (
        <p className="italic text-sm mb-3">{mirrorData.quote}</p>
      )}
      
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={`https://img.dapps.co/avatar/${mirrorData.originalAvatar}.svg`} />
          <AvatarFallback>{mirrorData.originalAuthor[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm">{formatUsername(mirrorData.originalAuthor)}</span>
            <span className="text-muted-foreground text-xs mx-1">·</span>
            <span className="text-muted-foreground text-xs">{mirrorData.originalTimeAgo}</span>
          </div>
          
          <p className="text-sm mt-1">{mirrorData.originalBody}</p>
        </div>
      </div>
      
      {!mirrorData.quote || mirrorData.quote.trim() === "" ? (
        <div className="text-xs text-muted-foreground mt-2">
          Mirrored from {mirrorData.originalCommunity}
        </div>
      ) : null}
    </div>
  );
};
