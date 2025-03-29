
import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { CommunityMember } from '@/hooks/useCommunityMembers';

interface MembersListProps {
  members: CommunityMember[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  ethToUsd: number;
}

export const MembersList = ({ members, loading, hasMore, loadMore, ethToUsd }: MembersListProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={member.avatar || ''} />
              <AvatarFallback>{member.handle ? member.handle[0].toUpperCase() : '?'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{member.handle}</div>
              <div className="text-xs text-muted-foreground">Member #{member.id}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{member.shares.toFixed(2)} shares</div>
            <div className="text-xs text-muted-foreground">
              ~${(member.shares * 0.00254 * ethToUsd).toFixed(2)}
            </div>
          </div>
        </div>
      ))}
      
      <div ref={observerTarget} className="h-4 w-full flex justify-center items-center py-4">
        {loading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        {!hasMore && members.length > 0 && (
          <p className="text-sm text-muted-foreground">No more members to load</p>
        )}
      </div>
    </div>
  );
};
