
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, SendHorizontal, Plus, Minus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityPortfolioItem } from '@/utils/communityApi';

interface CommunityShareCardProps {
  community: CommunityPortfolioItem;
  onBuyClick: (community: CommunityPortfolioItem) => void;
  onSellClick: (community: CommunityPortfolioItem) => void;
  onSendClick: (community: CommunityPortfolioItem) => void;
}

export const CommunityShareCard = ({ 
  community,
  onBuyClick,
  onSellClick,
  onSendClick
}: CommunityShareCardProps) => {
  const { 
    community: name, 
    image, 
    shares, 
    price, 
    price_change_percentage, 
    price_direction, 
    value 
  } = community;
  
  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      <div className={`h-1.5 w-full ${price_direction === 'up' ? "bg-green-500" : "bg-red-500"}`} />
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src={image} alt={name} />
            <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold">{name}</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={price_direction === 'up' ? "text-green-600" : "text-red-600"}>
                {price_direction === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {price_direction === 'up' ? "+" : ""}{price_change_percentage.toFixed(2)}%
              </Badge>
              <span className="text-xs text-muted-foreground">{price.eth.toFixed(8)} ETH</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-4 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Shares Owned</div>
            <div className="font-medium text-lg">{shares}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="font-medium text-lg">{value.eth.toFixed(6)} ETH</div>
            <div className="text-xs text-muted-foreground">${value.usd.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="flex justify-between space-x-2 mt-4">
          <Button variant="outline" className="flex-1 hover:bg-green-500/10" onClick={() => onBuyClick(community)}>
            <Plus className="h-4 w-4 mr-1" />
            Buy
          </Button>
          <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-500/10" onClick={() => onSellClick(community)}>
            <Minus className="h-4 w-4 mr-1" />
            Sell
          </Button>
          <Button variant="outline" className="flex-grow-0 aspect-square p-2" onClick={() => onSendClick(community)}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
