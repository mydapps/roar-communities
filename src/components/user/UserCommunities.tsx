import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCommunity } from '@/utils/userApi';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserCommunitiesProps {
  communities: UserCommunity[];
}

const UserCommunities: React.FC<UserCommunitiesProps> = ({ communities }) => {
  const [showAll, setShowAll] = useState(false);
  const initialCommunitiesToShow = 5;
  const sortedCommunities = [...communities].sort((a, b) => b.shares - a.shares);
  const visibleCommunities = showAll ? sortedCommunities : sortedCommunities.slice(0, initialCommunitiesToShow);
  const hasMoreCommunities = sortedCommunities.length > initialCommunitiesToShow;
  
  if (!communities || communities.length === 0) {
    return (
      <Card className="shadow-sm border-border/30">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Communities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 bg-muted/30 rounded-md">
            <p className="text-muted-foreground">Not a member of any communities yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>Communities</span>
          <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] px-1.5 h-4 font-normal rounded-md">
            {communities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <ScrollArea className={showAll && communities.length > 10 ? "h-[350px]" : "h-auto"}>
        <CardContent className="p-0">
          <div className="grid gap-0 divide-y divide-border/40">
            {visibleCommunities.map((community) => (
              <Link
                key={community.name}
                to={`/c/${community.name}`}
                className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-9 w-9 border border-border/20">
                  <AvatarImage src={community.image} alt={community.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {community.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-card-foreground truncate">{community.name}</h3>
                    {community.is_admin && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-[9px] px-1 h-3.5 ml-auto">
                        <Shield className="h-2 w-2 mr-0.5" />Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {community.shares.toFixed(2)} {community.shares === 1 ? 'share' : 'shares'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </ScrollArea>
      
      {hasMoreCommunities && (
        <CardFooter className="p-2 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs w-full text-muted-foreground hover:text-foreground"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                Show All ({communities.length})
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UserCommunities; 