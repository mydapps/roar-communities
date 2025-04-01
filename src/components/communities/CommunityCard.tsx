
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users, TrendingUp, Gift, Coins, Plus, Minus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CommunityCardProps {
  name: string;
  description: string;
  members: number;
  pricePerShare: number;
  priceChange: number;
  rewardPool: number;
  marketCap: number;
  image: string;
  isMember: boolean;
  onBuy?: () => void;
  onSell?: () => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ 
  name, 
  description, 
  members, 
  pricePerShare, 
  priceChange, 
  rewardPool, 
  marketCap, 
  image,
  isMember,
  onBuy,
  onSell
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };

  const priceChangeColor = priceChange >= 0 ? "text-green-600" : "text-red-600";
  const priceChangeSign = priceChange >= 0 ? "+" : "";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{name}</h3>
              {isMember && (
                <Badge variant="outline" className="ml-3 bg-primary/10 text-primary border-primary/20">
                  Member
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5 mr-1" />
              {formatNumber(members)} members
            </div>
          </div>
        </div>
        
        <p className="text-muted-foreground mb-4 text-sm line-clamp-2">{description}</p>
        
        <div className="grid grid-cols-2 gap-y-2 mb-4">
          <div className="flex items-center">
            <Coins className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span className="text-sm">{pricePerShare.toFixed(6)} ETH</span>
          </div>
          <div className="flex items-center justify-end">
            <TrendingUp className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span className={`text-sm ${priceChangeColor}`}>
              {priceChangeSign}{priceChange}%
            </span>
          </div>
          <div className="flex items-center">
            <Gift className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span className="text-sm">{rewardPool.toFixed(2)} ETH</span>
          </div>
          <div className="flex items-center justify-end">
            <span className="text-sm text-muted-foreground">
              Cap: ${formatNumber(marketCap)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button size="sm" onClick={onBuy} className="px-3">
              <Plus className="h-4 w-4 mr-1" />
              {isMember ? 'Buy' : 'Join'}
            </Button>
            {isMember && (
              <Button size="sm" onClick={onSell} variant="outline" className="px-3">
                <Minus className="h-4 w-4 mr-1" />
                Sell
              </Button>
            )}
          </div>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to={`/community/${name}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CommunityCard;
