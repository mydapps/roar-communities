
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Users, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  // Fallback for community initials if image fails to load
  const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 animate-scale-in relative">
      {/* Price change indicator strip at top */}
      <div className={`h-1 w-full ${priceChange > 0 ? "bg-green-500" : "bg-red-500"}`} />
      
      {/* Background graph effect - simplified stylistic approach */}
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
            to={`/community/${name.toLowerCase().replace(/\s+/g, '-')}`}
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
            <span className="text-xs text-muted-foreground">
              {pricePerShare.toFixed(3)} ETH
            </span>
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
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span className="font-medium">{marketCap.toFixed(1)} ETH</span>
            </div>
          </div>
        </div>
        
        {/* Reward Pool - made more prominent */}
        <div className="bg-primary/5 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-medium text-primary">Reward Pool</span>
            <span className="font-bold text-sm">{rewardPool.toFixed(2)} ETH</span>
          </div>
          <Progress value={Math.min(rewardPool * 10, 100)} className="h-2.5" />
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/40 flex justify-between pt-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/community/${name.toLowerCase().replace(/\s+/g, '-')}`}>
            View Details
          </Link>
        </Button>
        <Button 
          size="sm"
          variant={isMember ? "default" : "outline"}
        >
          {isMember ? "Buy Shares" : "Join"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CommunityCard;
