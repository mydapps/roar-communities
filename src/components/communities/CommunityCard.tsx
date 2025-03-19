import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Users, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TradeSheet } from '@/components/shares/TradeSheet';

export interface CommunityCardProps {
  name: string;
  description: string;
  members: number;
  pricePerShare: number;
  priceChange: number;
  rewardPool: number;
  marketCap: number;
  image?: string;
  isMember?: boolean;
}

const CommunityCard = ({ 
  name, 
  description, 
  members, 
  pricePerShare, 
  priceChange, 
  rewardPool, 
  marketCap,
  image = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&h=500&fit=crop",
  isMember = false
}: CommunityCardProps) => {
  const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
  
  const ethToUsd = 3500;
  const priceInUsd = pricePerShare * ethToUsd;
  const rewardPoolUsd = rewardPool * ethToUsd;
  const marketCapUsd = marketCap * ethToUsd;
  
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 animate-scale-in relative">
      <div className={`h-1 w-full ${priceChange > 0 ? "bg-green-500" : "bg-red-500"}`} />
      
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cpath d='M0,50 Q25,${priceChange > 0 ? '30' : '70'} 50,${priceChange > 0 ? '20' : '80'} T100,${priceChange > 0 ? '10' : '90'} V100 H0 Z' fill='%23${priceChange > 0 ? '10B981' : 'EF4444'}' /%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom'
        }}
      />
      
      <CardHeader className="pb-2 flex flex-row items-start gap-4">
        <Avatar className="h-14 w-14 border-2 border-primary/10">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Link 
            to={`/c/${name.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-lg font-bold hover:text-primary transition-colors"
          >
            {name}
          </Link>
          
          <div className="flex items-center gap-2 mt-1">
            {priceChange > 0 ? (
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                <ArrowUp className="h-3 w-3 mr-1" />
                {priceChange.toFixed(1)}%
              </Badge>
            ) : (
              <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                <ArrowDown className="h-3 w-3 mr-1" />
                {Math.abs(priceChange).toFixed(1)}%
              </Badge>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold">
                {pricePerShare.toFixed(3)} ETH
              </span>
              <span className="text-xs text-muted-foreground">
                ${priceInUsd.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Members</div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span className="font-medium">{members.toLocaleString()}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <span className="font-medium">{marketCap.toFixed(1)} ETH</span>
              </div>
              <span className="text-xs text-muted-foreground">${marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-primary/5 rounded-lg p-3 mb-4 border border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-primary">Reward Pool</span>
              <div className="text-right">
                <div className="font-bold text-lg">{rewardPool.toFixed(2)} ETH</div>
                <div className="text-xs text-muted-foreground">${rewardPoolUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/40 flex justify-between pt-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/c/${name.toLowerCase().replace(/\s+/g, '-')}`}>
            View Details
          </Link>
        </Button>
        {isMember ? (
          <Button 
            size="sm"
            variant="default"
            onClick={() => setTradeSheetOpen(true)}
          >
            Buy Shares
          </Button>
        ) : (
          <Button 
            size="sm"
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg"
            onClick={() => setTradeSheetOpen(true)}
          >
            Join
          </Button>
        )}
      </CardFooter>
      
      <TradeSheet
        open={tradeSheetOpen}
        onOpenChange={setTradeSheetOpen}
        community={{
          name: name,
          currentPrice: pricePerShare
        }}
        action={isMember ? "buy" : "buy"}
        userEthBalance="0.536"
      />
    </Card>
  );
};

export default CommunityCard;
