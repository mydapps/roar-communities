import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IpfsButton } from './IpfsButton';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, EyeOff, AlertTriangle, Loader2, Pin, PinOff, ShieldAlert, Share } from 'lucide-react';

interface PostHeaderProps {
  username: string;
  community?: string;
  ticker?: string | null; // Community ticker for proper linking
  timeAgo: string;
  avatar?: string;
  ipfsHash?: string;
  postCode?: string;
  onVerifyIpfs?: () => void;
  ipfsSheetOpen?: boolean;
  setIpfsSheetOpen?: (open: boolean) => void;
  onHidePost?: () => void;
  onReportPost?: () => void;
  isOwner?: boolean;
  isAdmin?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onAdminHideWarn?: () => void;
  onShare?: () => void;
}

export const PostHeader: React.FC<PostHeaderProps> = ({
  username,
  community,
  ticker,
  timeAgo,
  avatar,
  ipfsHash,
  postCode,
  onVerifyIpfs = () => { },
  ipfsSheetOpen = false,
  setIpfsSheetOpen = () => { },
  onHidePost,
  onReportPost,
  isOwner = false,
  isAdmin = false,
  isPinned = false,
  onTogglePin,
  onAdminHideWarn,
  onShare,
}) => {
  const navigate = useNavigate();

  const handleUserProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/u/${username.split('.')[0]}`);
  };

  // Helper function to get community URL path using ticker if available
  const getCommunityPath = (): string => {
    if (ticker) {
      // Use ticker for token-based communities
      return ticker;
    } else if (community) {
      // Fallback to community name for legacy communities
      return community.toLowerCase().replace(/\s+/g, '-');
    }
    return '';
  };

  const handleCommunityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (community) {
      navigate(`/c/${getCommunityPath()}`);
    }
  };

  const handleTimeClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!postCode) return;

    if (community) {
      navigate(`/c/${getCommunityPath()}/${postCode}`);
    } else {
      navigate(`/${username.split('.')[0]}/${postCode}`);
    }
  };

  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };

  const avatarUrl = avatar ? `https://img.dapps.co/avatar/${avatar}.svg` : undefined;

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    }
  };

  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar
            className="h-12 w-12 border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={handleUserProfileClick}
          >
            <AvatarImage src={avatarUrl} />
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

        <div className="flex items-center gap-1">
          {ipfsHash && onVerifyIpfs && typeof ipfsSheetOpen !== 'undefined' && setIpfsSheetOpen && (
            <IpfsButton
              ipfsHash={ipfsHash}
              postCode={postCode}
              onVerify={onVerifyIpfs}
              open={ipfsSheetOpen}
              onOpenChange={setIpfsSheetOpen}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onSelect={handleShareClick}
                className="cursor-pointer"
              >
                <Share className="mr-2 h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
              {(isOwner && onHidePost) || (isAdmin && onTogglePin) || (isAdmin && !isOwner && onAdminHideWarn) || onReportPost ? <DropdownMenuSeparator /> : null}
              {isOwner && onHidePost && (
                <DropdownMenuItem
                  onSelect={onHidePost}
                  className="cursor-pointer"
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  <span>Hide this post</span>
                </DropdownMenuItem>
              )}
              {isAdmin && onTogglePin && (
                <>
                  {isOwner && onHidePost && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onSelect={onTogglePin}
                    className="cursor-pointer"
                  >
                    {isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                    <span>{isPinned ? "Unpin Post" : "Pin Post"}</span>
                  </DropdownMenuItem>
                </>
              )}
              {isAdmin && !isOwner && onAdminHideWarn && (
                <>
                  {((isOwner && onHidePost) || (isAdmin && onTogglePin)) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onSelect={onAdminHideWarn}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    <span>Hide & Warn User</span>
                  </DropdownMenuItem>
                </>
              )}
              {((isOwner && onHidePost) || (isAdmin && onTogglePin) || (isAdmin && !isOwner && onAdminHideWarn)) && onReportPost && <DropdownMenuSeparator />}
              {onReportPost && (
                <DropdownMenuItem onSelect={onReportPost} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>Report this post</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>
  );
};
