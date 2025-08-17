import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight, Plus, Minus, TrendingUp, TrendingDown, Crown, Gift, Sparkles, Zap, Info } from 'lucide-react';
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
  onRewardPoolInfo?: () => void;
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
  userShares,
  onBuy,
  onSell,
  onRewardPoolInfo,
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

  const formatEth = (value: number): string => {
    if (value < 0.001) {
      return value.toFixed(6);
    } else if (value < 0.1) {
      return value.toFixed(4);
    } else {
      return value.toFixed(3);
    }
  };

  // Calculate approximate USD values (assuming 1 ETH = $3000 for simplicity)
  const ethToUsd = 3000;
  const priceInUsd = pricePerShare * ethToUsd;
  const rewardPoolInUsd = rewardPool * ethToUsd;
  
  const isPositiveChange = priceChange >= 0;
  const displayedPercentChange = priceChangePercent || 
    `${priceChange >= 0 ? '+' : ''}${(priceChange * 100).toFixed(2)}%`;

  // Truncate description for better readability
  const truncatedDescription = description.length > 85 ? 
    description.substring(0, 85) + '...' : description;

  // Determine if rewards are high (for special styling)
  const isHighReward = rewardPool > 1.0;

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/20 hover:to-muted/40 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] min-h-[440px] flex flex-col">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />
      
      {/* Status indicator with glow effect */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        isAdmin ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 shadow-lg shadow-amber-500/50' :
        isMember ? 'bg-gradient-to-r from-primary via-blue-500 to-primary shadow-lg shadow-primary/50' :
        'bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/20'
      }`} />
      
                    <div className="p-5 flex flex-col h-full gap-3">
         {/* Header Section - Community Identity */}
         <div className="flex items-start gap-4 flex-shrink-0">
           <Link to={`/c/${name}`} className="shrink-0 group/avatar">
             <div className="relative">
               <Avatar className="h-14 w-14 ring-2 ring-background group-hover/avatar:ring-primary/40 transition-all duration-300 shadow-lg">
                 <AvatarImage src={image} alt={name} className="object-cover" />
                 <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/20 text-primary font-bold text-lg">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
               {/* Pulsing effect for high reward communities */}
               {isHighReward && (
                 <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                   <Sparkles className="h-2.5 w-2.5 text-white" />
                 </div>
               )}
             </div>
          </Link>
          
           <div className="flex-1 min-w-0">
             <div className="flex items-start justify-between gap-2 mb-2">
               <Link to={`/c/${name}`} className="group/title flex-1">
                 <h3 className="font-bold text-base leading-tight truncate group-hover/title:text-primary transition-colors mb-1">
                   {name}
                 </h3>
            </Link>
               <div className="flex items-center gap-1 shrink-0">
                 {isAdmin && (
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger>
                         <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300 px-2 py-0.5 text-xs font-semibold shadow-sm">
                           <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Community Administrator</p>
                       </TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                 )}
                 {isMember && !isAdmin && (
                   <Badge className="bg-primary text-primary-foreground border-primary/20 px-2 py-0.5 text-xs font-semibold shadow-sm">
                  Member
                </Badge>
              )}
            </div>
             </div>
             
             {/* Community Stats */}
             <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
               <div className="flex items-center gap-1.5">
                 <Users className="h-4 w-4" />
                 <span className="font-medium">{formatNumber(members)}</span>
               </div>
             </div>
             
             {/* Description */}
             {truncatedDescription && (
               <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                 {truncatedDescription}
               </p>
             )}
          </div>
        </div>
        
                          {/* PROMINENT REWARDS SECTION - Always show for alignment */}
         <div className={`relative p-3 rounded-xl border-2 transition-all duration-300 flex-shrink-0 ${
           rewardPool > 0 
             ? isHighReward 
               ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-emerald-200 shadow-lg shadow-emerald-500/20' 
               : 'bg-gradient-to-br from-emerald-50/50 to-green-50/50 border-emerald-100'
             : 'bg-gradient-to-br from-orange-50/30 to-amber-50/30 border-orange-100/50'
         }`}>
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                 rewardPool > 0 
                   ? isHighReward ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-emerald-400'
                   : 'bg-gradient-to-r from-orange-400 to-amber-400'
               }`}>
                 {rewardPool > 0 ? (
                   <Gift className="h-3.5 w-3.5 text-white" />
                 ) : (
                   <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                 )}
               </div>
          <div>
                 <div className="flex items-center gap-1.5">
                   <p className={`text-xs font-semibold uppercase tracking-wider ${
                     rewardPool > 0 ? 'text-emerald-700' : 'text-orange-700'
                   }`}>
                     {rewardPool > 0 ? 'Reward Pool' : 'Reward Pool'}
                   </p>
                   {onRewardPoolInfo && (
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={onRewardPoolInfo}
                             className="h-5 w-5 p-0 hover:bg-transparent"
                           >
                             <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Learn how rewards work</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   )}
                 </div>
                 <div className="flex items-baseline gap-2">
                   {rewardPool > 0 ? (
                     <>
                       <span className="text-base font-bold text-emerald-800">{formatEth(rewardPool)} ETH</span>
                       {isHighReward && <Zap className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />}
                     </>
                   ) : (
                     <span className="text-base font-bold text-orange-800">Building Up...</span>
                   )}
                 </div>
               </div>
             </div>
             <div className="text-right">
               {rewardPool > 0 ? (
                 <>
                   <p className="text-sm font-bold text-emerald-700">{formatCurrency(rewardPoolInUsd)}</p>
                   {isHighReward && (
                     <Badge className="bg-emerald-500 text-white text-xs mt-1 animate-pulse">
                       🔥 High
                     </Badge>
                   )}
                 </>
               ) : (
                 <div className="flex flex-col items-end">
                   <p className="text-xs text-orange-600 font-medium">Coming Soon</p>
                 </div>
               )}
             </div>
           </div>
         </div>

                 {/* Financial Metrics Section */}
         <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-3 border border-muted/30 flex-grow">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Share Price</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold">{formatEth(pricePerShare)} ETH</span>
                <div className={`flex items-center gap-0.5 text-xs font-semibold ${
                  isPositiveChange ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {isPositiveChange ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  <span>{displayedPercentChange}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{formatCurrency(priceInUsd)}</p>
            </div>
            
            {marketCap > 0 && (
              <div className="text-right space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Liquidity</p>
                <p className="text-base font-bold">{formatCurrency(marketCap)}</p>
              </div>
            )}
          </div>
          
                                {/* User Ownership Display or Conversion Section */}
           {isLoggedIn && userShares !== undefined && userShares > 0 ? (
             <div className="bg-primary/10 border border-primary/30 rounded-lg p-2.5 mt-2">
               <div className="flex items-center justify-between">
                 <span className="text-sm font-semibold text-primary">My Shares</span>
                 <div className="text-right">
                   <p className="font-bold text-primary">{userShares.toFixed(2)}</p>
                   <p className="text-xs text-primary/70">
                     ~{formatCurrency(userShares * priceInUsd)}
                   </p>
              </div>
            </div>
          </div>
           ) : isLoggedIn && (
             /* Simple conversion message for non-members */
             <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/50 rounded-lg p-3 mt-2 text-center">
               <div className="flex items-center justify-center gap-2 mb-1">
                 <Sparkles className="h-4 w-4 text-blue-500" />
                 <p className="text-sm font-semibold text-blue-700">New Community</p>
               </div>
               <p className="text-xs text-blue-600">Join early for maximum growth potential</p>
            </div>
          )}
        </div>
        
                          {/* Action Section - Pushed to bottom */}
         <div className="mt-auto pt-3 flex-shrink-0">
           <div className="flex items-center justify-between gap-3">
             <div className="flex gap-2">
               {/* STANDOUT JOIN BUTTON */}
            <Button 
              size="sm" 
              onClick={onBuy} 
                 className={`${
                   isMember 
                     ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800' 
                     : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700'
                 } text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group/buy px-4 py-2 border-0 relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/buy:opacity-100 transition-opacity duration-300" />
                <Plus className="h-4 w-4 mr-2 group-hover/buy:rotate-90 transition-transform duration-300 relative z-10" />
                <span className="relative z-10 font-bold">
                  {isMember ? 'Buy More' : 'Join Now'}
                </span>
            </Button>
              
            {isMember && isLoggedIn && (
              <Button 
                size="sm" 
                onClick={onSell} 
                variant="outline" 
                   className="border-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-800/50 dark:text-rose-400 dark:hover:bg-rose-950/30 group/sell px-3 py-2 font-semibold transition-all duration-300"
              >
                  <Minus className="h-4 w-4 mr-1.5 group-hover/sell:rotate-180 transition-transform duration-300" />
                Sell
              </Button>
            )}
          </div>
          
            <Button 
              asChild 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground group/view px-3 py-2 hover:bg-muted/50 transition-all duration-200"
            >
              <Link to={`/c/${name}`} className="flex items-center gap-1.5">
                <span className="text-sm font-medium">View</span>
                <ChevronRight className="h-4 w-4 group-hover/view:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </Card>
  );
};

export default CommunityCard;
