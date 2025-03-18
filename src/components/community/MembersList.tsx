
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Member {
  username: string;
  shares: number;
  joinedAt: string;
}

interface MembersListProps {
  members: Member[];
}

export const MembersList = ({ members }: MembersListProps) => {
  return (
    <div className="space-y-4">
      {members.map((member, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${member.username}`} />
              <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{member.username}</div>
              <div className="text-sm text-muted-foreground">Joined {member.joinedAt}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{member.shares} shares</div>
            <div className="text-sm text-muted-foreground">~ 0.000 ETH</div>
          </div>
        </div>
      ))}
    </div>
  );
};
