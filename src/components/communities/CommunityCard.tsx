import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CommunityCardProps {
  name: string;
  description: string;
  members: number;
  pricePerShare: number;
  priceChange: number;
  priceChangePercent?: string;
  rewardPool: number;
  lastDistributed?: string;
  marketCap: number;
  image: string;
  isMember: boolean;
  isAdmin?: boolean;
  userShares?: number;
  onBuy?: () => void;
  onSell?: () => void;
  isLoggedIn?: boolean;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ 
  name, 
  description, 
  members, 
  pricePerShare, 
  priceChange, 
  priceChangePercent = '', 
  rewardPool, 
  lastDistributed,
  marketCap, 
  image,
  isMember,
  isAdmin = false,
  userShares = 0,
  onBuy,
  onSell,
  isLoggedIn = true
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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Calculate approximate USD values (assuming 1 ETH = $3000 for simplicity)
  // In a real app, you would get this from an API or context
  const ethToUsd = 3000;
  const priceInUsd = pricePerShare * ethToUsd;
  const rewardPoolInUsd = rewardPool * ethToUsd;
  
  const priceChangeColor = priceChange >= 0 ? "text-emerald-500" : "text-rose-500";
  const displayedPercentChange = priceChangePercent || 
    `${priceChange >= 0 ? '+' : ''}${(priceChange * 100).toFixed(2)}%`;

  return (
    <Card className="overflow-hidden border-border/20 hover:border-border/30 transition-all duration-300 bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-slate-900/20">
      <div className="p-4 sm:p-5">
        {/* Header section with avatar and title */}
        <div className="flex items-center mb-3 gap-3 relative">
          <Link to={`/c/${name}`} className="shrink-0">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="min-w-0 flex-1">
            <Link to={`/c/${name}`} className="hover:text-primary transition-colors">
              <h3 className="font-medium text-base sm:text-lg truncate">{name}</h3>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                <span>{formatNumber(members)}</span>
              </div>
              {isAdmin ? (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px] px-1 h-4">
                  Admin
                </Badge>
              ) : isMember && (
                <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] px-1 h-4">
                  Member
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Price and ownership info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3 border-t border-b py-3 text-sm border-border/20">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Price</div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="font-medium">{pricePerShare.toFixed(6)} ETH</span>
                <span className={`text-xs ${priceChangeColor}`}>{displayedPercentChange}</span>
              </div>
              <span className="text-xs text-muted-foreground">{formatCurrency(priceInUsd)}</span>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Reward Pool</div>
            <div className="flex flex-col">
              <div className="bg-primary/10 rounded-md px-2 py-1 -mx-1">
                <span className="font-medium text-primary">{rewardPool.toFixed(4)} ETH</span>
                <span className="text-xs text-primary/80 block">{formatCurrency(rewardPoolInUsd)}</span>
              </div>
            </div>
          </div>
          
          {isLoggedIn && userShares && userShares > 0 && (
            <div className="col-span-2 mt-0.5 bg-primary/5 rounded-md px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-xs font-medium">Your Ownership</span>
              <span className="text-xs font-medium">{userShares.toFixed(2)} shares</span>
            </div>
          )}
        </div>
        
        {/* Bottom action bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <Button 
              size="sm" 
              onClick={onBuy} 
              variant="default" 
              className="h-8 px-3 text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              {isMember ? 'Buy' : 'Join'}
            </Button>
            {isMember && isLoggedIn && (
              <Button 
                size="sm" 
                onClick={onSell} 
                variant="outline" 
                className="h-8 px-3 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
              >
                <Minus className="h-3 w-3 mr-1.5" />
                Sell
              </Button>
            )}
          </div>
          
          <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs">
            <Link to={`/c/${name}`}>
              View Details
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CommunityCard;
