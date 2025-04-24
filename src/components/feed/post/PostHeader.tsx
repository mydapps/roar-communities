import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IpfsButton } from './IpfsButton';

interface PostHeaderProps {
  username: string;
  community?: string;
  timeAgo: string;
  avatar?: string;
  ipfsHash: string;
  postCode?: string;
  onVerifyIpfs?: () => void;
  ipfsSheetOpen?: boolean;
  setIpfsSheetOpen?: (open: boolean) => void;
}

export const PostHeader: React.FC<PostHeaderProps> = ({
  username,
  community,
  timeAgo,
  avatar,
  ipfsHash,
  postCode,
  onVerifyIpfs = () => {},
  ipfsSheetOpen = false,
  setIpfsSheetOpen = () => {}
}) => {
  const navigate = useNavigate();

  const handleUserProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/u/${username.split('.')[0]}`);
  };

  const handleCommunityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (community) {
      navigate(`/c/${community.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  const handleTimeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!postCode) return;
    
    if (community) {
      navigate(`/c/${community.toLowerCase().replace(/\s+/g, '-')}/${postCode}`);
    } else {
      navigate(`/${username.split('.')[0]}/${postCode}`);
    }
  };

  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };

  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar 
            className="h-12 w-12 border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={handleUserProfileClick}
          >
            <AvatarImage src={avatar ? `https://img.dapps.co/avatar/${avatar}.svg` : undefined} />
            <AvatarFallback>{username && username[0] ? username[0].toUpperCase() : '?'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span 
                className="font-medium text-foreground cursor-pointer hover:underline"
                onClick={handleUserProfileClick}
              >
                {formatUsername(username)}
              </span>
              <span className="text-muted-foreground text-sm mx-1">·</span>
              <span 
                className="text-muted-foreground text-sm cursor-pointer hover:text-muted-foreground/80"
                onClick={handleTimeClick}
              >
                {timeAgo}
              </span>
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
          onVerify={onVerifyIpfs} 
        />
      </div>
    </CardHeader>
  );
};
