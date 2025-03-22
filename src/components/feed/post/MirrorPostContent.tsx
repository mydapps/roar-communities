
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
      <div className="text-sm text-muted-foreground mb-2">
        {mirrorData.quote && mirrorData.quote.trim() !== "" ? (
          <p className="italic">{mirrorData.quote}</p>
        ) : (
          <p>Mirrored from {mirrorData.originalCommunity}</p>
        )}
      </div>
      
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${mirrorData.originalAvatar}`} />
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
    </div>
  );
};
