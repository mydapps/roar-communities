import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { GenericShareDialog } from '@/components/community/GenericShareDialog'; // Import the new component
import { 
  ArrowUp, 
  ArrowDown, 
  Users, 
  DollarSign, 
  Share2
} from 'lucide-react';

// Define the structure of community data needed by the header
interface CommunityData {
  name?: string;
  image?: string;
  members_count?: number;
  prices?: {
    buy_price_usd?: number;
    buy_price?: number;
    price_change_percent?: number;
  };
  market_cap?: {
    usd?: number;
    eth?: number;
  };
  description?: string; // Added for potential use in ShareDialog
  // Add other community fields if needed by header/share dialog
}

// Define the structure of user data needed by the header
interface UserData {
  shares?: number;
  share_value?: {
    usd?: number;
    eth?: number;
  };
  // Add other user fields if needed
}

interface CommunityHeaderProps {
  isMobile: boolean;
  community: CommunityData | null | undefined;
  user: UserData | null | undefined;
  hasShares: boolean;
  priceChange: number;
  bannerUrl: string | null | undefined;
  handleBuyAction: () => void;
  handleSellAction: () => void;
  id: string | undefined; // Community ID from params
  ethToUsd: number;
  availableRewards: number;
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  isMobile,
  community,
  user,
  hasShares,
  priceChange,
  bannerUrl,
  handleBuyAction,
  handleSellAction,
  id,
  ethToUsd,
  availableRewards
}) => {

  const communityName = community?.name || id || 'Community';
  const communityImage = community?.image;
  const communityMembersCount = community?.members_count || 0;
  const buyPriceUsd = community?.prices?.buy_price_usd;
  const buyPriceEth = community?.prices?.buy_price;
  const marketCapUsd = community?.market_cap?.usd;
  const marketCapEth = community?.market_cap?.eth;
  const userShares = user?.shares;
  const userShareValueUsd = user?.share_value?.usd;
  const userShareValueEth = user?.share_value?.eth;

  // Calculate chart points for desktop header background
  const chartPoints = priceChange > 0 
    ? "M0,50 Q25,30 50,20 T100,10" 
    : "M0,50 Q25,70 50,80 T100,90";

  const fallbackInitial = communityName ? communityName[0].toUpperCase() : '?';

  // Prepare share details for the community
  const shareUrl = window.location.href; // Or construct a canonical URL if needed
  const shareTitle = `${communityName} Community | dapps.co`;
  const shareText = `Check out the ${communityName} community on dapps.co! ${community?.description ? ' - ' + community.description : ''}`;

  if (isMobile) {
    // Mobile Header (Sticky)
    return (
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-3 mb-3 border-b pt-4">
        <div className="flex items-center gap-3 mb-2 px-4"> {/* Added padding */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={communityImage} alt={communityName} />
            <AvatarFallback>{fallbackInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{communityName}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background/80 text-xs flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {communityMembersCount}
              </Badge>
              {priceChange > 0 ? (
                <Badge className="bg-green-500/10 text-green-600 text-xs">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {priceChange.toFixed(1)}%
                </Badge>
              ) : (
                <Badge className="bg-red-500/10 text-red-600 text-xs">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  {Math.abs(priceChange).toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
          {hasShares ? (
            <div className="flex gap-2">
              <Button 
                size="sm"
                variant="default"
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex-shrink-0"
                onClick={handleBuyAction}
              >
                Buy
              </Button>
              <Button 
                size="sm"
                variant="outline"
                className="shadow-sm flex-shrink-0"
                onClick={handleSellAction}
              >
                Sell
              </Button>
            </div>
          ) : (
            <Button 
              size="sm"
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex-shrink-0"
              onClick={handleBuyAction}
            >
              Join
            </Button>
          )}
           {/* Share Button using GenericShareDialog */}
           <GenericShareDialog
             shareUrl={shareUrl}
             shareTitle={shareTitle}
             shareText={shareText}
             dialogTitle={`Share ${communityName} Community`}
           >
             <Button variant="ghost" size="icon" className="ml-1 flex-shrink-0">
               <Share2 className="h-4 w-4" />
             </Button>
          </GenericShareDialog>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2 px-4"> {/* Added padding */}
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Share Price</div>
            <div className="font-semibold text-sm flex items-center">
              ${buyPriceUsd?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-xs text-muted-foreground">Liquidity</div>
            <div className="font-semibold text-sm flex items-center">
              ${marketCapUsd >= 1000000 
                ? (marketCapUsd / 1000000).toFixed(1) + 'M' 
                : marketCapUsd?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Desktop Header (Sidebar Card)
    return (
      <div className="sticky top-4 space-y-4">
        <Card className="overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <path 
                d={chartPoints + " V100 H0 Z"} 
                fill={priceChange > 0 ? "#10B981" : "#EF4444"} 
              />
            </svg>
          </div>
          
          <div className="relative">
            <div 
              className="h-32 w-full bg-cover bg-center" 
              style={{ backgroundImage: `url(${bannerUrl || communityImage || 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2532&auto=format&fit=crop'})` }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent"></div>
            
            <Avatar className="absolute bottom-0 left-4 transform translate-y-1/2 h-16 w-16 border-4 border-background">
              <AvatarImage src={communityImage} alt={communityName} />
              <AvatarFallback>{fallbackInitial}</AvatarFallback>
            </Avatar>
          </div>
          
          <CardHeader className="pt-10 pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{communityName}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {communityMembersCount} members
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                  {priceChange > 0 ? (
                    <Badge className="bg-green-500/10 text-green-600">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      {priceChange.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      {Math.abs(priceChange).toFixed(1)}%
                    </Badge>
                  )}
                   {/* Share Button using GenericShareDialog */}
                   <GenericShareDialog
                    shareUrl={shareUrl}
                    shareTitle={shareTitle}
                    shareText={shareText}
                    dialogTitle={`Share ${communityName} Community`}
                  >
                    <Button variant="ghost" size="icon" className="ml-1 flex-shrink-0">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </GenericShareDialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per Share</span>
                <div className="text-right">
                  <div className="font-semibold text-[15px]">${buyPriceUsd?.toFixed(2) || '0.00'}</div>
                  <div className="text-xs text-muted-foreground">{buyPriceEth?.toFixed(6) || '0.000000'} ETH</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Liquidity</span>
                <div className="text-right">
                  <div className="font-semibold text-[15px]">${marketCapUsd?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</div>
                  <div className="text-xs text-muted-foreground">{marketCapEth?.toFixed(2) || '0.00'} ETH</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="pt-1">
                <div className="text-sm font-medium mb-2">Your Holdings</div>
                {hasShares ? (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Shares Owned</span>
                      <span className="font-medium">{userShares?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Value</span>
                      <div className="text-right">
                        <div className="font-semibold">${userShareValueUsd?.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {userShareValueEth?.toFixed(6)} ETH
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    You don't own any shares yet
                  </div>
                )}
              </div>
              
              <div className="bg-primary/5 rounded-lg p-3 mb-2 border border-primary/20 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-primary">Reward Pool</span>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ${(availableRewards * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {availableRewards.toFixed(5) || '0.00000'} ETH
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-0">
            {hasShares ? (
              <>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg" 
                    onClick={handleBuyAction}
                  >
                      Buy Shares
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleSellAction}
                  >
                    Sell
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg" 
                onClick={handleBuyAction}
              >
                Join Community
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Note: Desktop Tabs moved to CommunityTabs component */}
      </div>
    );
  }
};

export default CommunityHeader; 