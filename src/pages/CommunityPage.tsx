
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreventZoom } from '@/hooks/usePreventZoom';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShareDialog } from '@/components/community/ShareDialog';
import { toast } from "sonner";
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  DollarSign, 
  Info,
  Clock,
  Share2,
  ChevronUp,
  Sparkles,
  Heart,
  Copy,
  FileText,
  BookOpen,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { TradeSheet } from '@/components/shares/TradeSheet';
import { Post } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { MembersList } from '@/components/community/MembersList';

const LionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 15C8.5 13.5 10 12 12 12C14 12 15.5 13.5 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8.5 9C8.5 9.82843 7.82843 10.5 7 10.5C6.17157 10.5 5.5 9.82843 5.5 9C5.5 8.17157 6.17157 7.5 7 7.5C7.82843 7.5 8.5 8.17157 8.5 9Z" fill="currentColor"/>
    <path d="M18.5 9C18.5 9.82843 17.8284 10.5 17 10.5C16.1716 10.5 15.5 9.82843 15.5 9C15.5 8.17157 16.1716 7.5 17 7.5C17.8284 7.5 18.5 8.17157 18.5 9Z" fill="currentColor"/>
  </svg>
);

const CommunityPage = () => {
  usePreventZoom();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);
  const [isRoared, setIsRoared] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState("posts");
  const [isMirroredPost, setIsMirroredPost] = useState<Record<number, boolean>>({});
  const [isIPFSSaved, setIsIPFSSaved] = useState<Record<number, boolean>>({});
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy");
  
  // Fetch community data from API
  const { data: communityData, loading: communityLoading, error: communityError } = useCommunityData(id);
  
  // Fetch community members with infinite scroll
  const { members, loading: membersLoading, hasMore: hasMoreMembers, loadMore: loadMoreMembers } = useCommunityMembers(id);
  
  const ethToUsd = 2500; // Default value, will be overridden if API returns price data
  
  // Default posts data while API integration is pending
  const defaultPosts = [
    {
      id: 1,
      username: "alice.eth",
      timeAgo: "2h",
      content: "Just deployed my first smart contract on Ethereum. The gas fees were surprisingly reasonable!",
      roarCount: 24,
      commentCount: 5,
      shareCount: 2,
      avatar: "https://avatar.vercel.sh/alice.eth"
    },
    {
      id: 2,
      username: "bob.lens",
      timeAgo: "5h",
      content: "Anyone trying out the new DEX? The UI is clean and the liquidity seems good so far. I'm impressed with the low slippage.",
      roarCount: 42,
      commentCount: 12,
      shareCount: 7,
      avatar: "https://avatar.vercel.sh/bob.lens"
    },
    {
      id: 3,
      username: "crypto_sarah",
      timeAgo: "1d",
      content: "I've been experimenting with layer 2 solutions like Optimism and Arbitrum. The transaction fees are a game changer for smaller transactions! Have any of you had a chance to compare their performance?",
      roarCount: 37,
      commentCount: 15,
      shareCount: 4,
      avatar: "https://avatar.vercel.sh/crypto_sarah"
    }
  ];
  
  const [posts, setPosts] = useState(defaultPosts);
  
  const [buyAmount, setBuyAmount] = useState<number>(1);
  
  const handleRoar = (postId: number) => {
    setIsRoared(prev => {
      const updatedState = { ...prev };
      if (updatedState[postId]) {
        updatedState[postId] = false;
        
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, roarCount: post.roarCount - 1 } 
            : post
        ));
      } else {
        updatedState[postId] = true;
        
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, roarCount: post.roarCount + 1 } 
            : post
        ));
      }
      return updatedState;
    });
  };
  
  const handleMirror = (postId: number) => {
    setIsMirroredPost(prev => {
      const updated = { ...prev };
      updated[postId] = !updated[postId];
      
      if (updated[postId]) {
        toast.success("Post mirrored to your profile!");
      }
      
      return updated;
    });
  };
  
  const handleSaveToIPFS = (postId: number) => {
    setIsIPFSSaved(prev => {
      const updated = { ...prev };
      updated[postId] = !updated[postId];
      
      if (updated[postId]) {
        toast.success("Post saved to IPFS permanently!");
      }
      
      return updated;
    });
  };
  
  const handlePostCreated = (newPost: any) => {
    setUserPosts([newPost, ...userPosts]);
  };
  
  // Calculate chart points based on price trend
  const priceChange = communityData?.community ? 
    ((communityData.community.prices.buy_price - 0.002) / 0.002) * 100 : 
    12.5; // Default value
    
  const chartPoints = priceChange > 0 
    ? "M0,50 Q25,30 50,20 T100,10" 
    : "M0,50 Q25,70 50,80 T100,90";
  
  // Handle buy and sell actions
  const handleBuyAction = () => {
    setTradeAction("buy");
    setTradeSheetOpen(true);
  };
  
  const handleSellAction = () => {
    setTradeAction("sell");
    setTradeSheetOpen(true);
  };
  
  if (communityLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading community data...</p>
        </div>
      </div>
    );
  }
  
  if (communityError) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <p className="text-destructive text-lg">Error loading community</p>
          <p className="mt-2 text-muted-foreground">{communityError}</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  const community = communityData?.community;
  const user = communityData?.user;
  
  // Check if user has shares in this community
  const hasShares = user && user.shares > 0;
  
  return (
    <div className="flex flex-col md:flex-row gap-4 animate-fade-in max-w-full overflow-x-hidden">
      <div className="flex-1 order-2 md:order-1">
        {isMobile && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 mb-3 border-b">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={community?.image} alt={community?.name} />
                <AvatarFallback>{community?.name ? community.name[0].toUpperCase() : id?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{community?.name || id}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-background/80 text-xs flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {community?.members_count || 0}
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
                <Button 
                  size="sm"
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex-shrink-0"
                  onClick={handleBuyAction}
                >
                  Trade
                </Button>
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
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Share Price</div>
                <div className="font-semibold text-sm flex items-center">
                  ${community?.prices.buy_price_usd.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Market Cap</div>
                <div className="font-semibold text-sm flex items-center">
                  ${community?.market_cap.usd >= 1000000 
                    ? (community.market_cap.usd / 1000000).toFixed(1) + 'M' 
                    : community?.market_cap.usd.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full max-w-full pb-2">
            <TabsList className="w-full md:w-auto justify-start mb-6 pb-px overflow-x-auto flex-nowrap border-b">
              <TabsTrigger value="posts" className="flex-shrink-0">
                <MessageCircle className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-shrink-0">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex-shrink-0">
                <DollarSign className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="about" className="flex-shrink-0">
                <Info className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
          
          <TabsContent value="posts" className="animate-fade-in">
            <Card className="mb-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  What's on your mind?
                </h2>
                <CreatePostCard onPostCreated={handlePostCreated} />
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              {userPosts.map((post, index) => (
                <Post 
                  key={`user-post-${index}`}
                  username={post.username}
                  community={post.community}
                  timeAgo={post.timeAgo}
                  content={post.content}
                  roarCount={post.roarCount}
                  commentCount={post.commentCount}
                  shareCount={post.shareCount}
                  images={post.images}
                  video={post.video}
                />
              ))}
              
              {posts.map((post) => (
                <Post 
                  key={`community-post-${post.id}`}
                  username={post.username}
                  community={community?.name || id || ''}
                  timeAgo={post.timeAgo}
                  content={post.content}
                  roarCount={post.roarCount}
                  commentCount={post.commentCount || 0}
                  shareCount={post.shareCount || 0}
                  images={[]}
                  video={undefined}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Community Members</CardTitle>
                <CardDescription>
                  {community?.members_count || 0} members have purchased shares in this community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MembersList 
                  members={members} 
                  loading={membersLoading} 
                  hasMore={hasMoreMembers} 
                  loadMore={loadMoreMembers}
                  ethToUsd={ethToUsd}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rewards" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Rewards</CardTitle>
                <CardDescription>
                  The community reward pool is distributed monthly to the top posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20 shadow-sm relative overflow-hidden animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-primary">Current Reward Pool</span>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {community?.rewards.available_rewards.toFixed(5) || '0.00'} ETH
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${((community?.rewards.available_rewards || 0) * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/40 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-primary" />
                      How Rewards Work
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                      <li>{community?.fees.reward_fees || 2}% of all buy/sell transactions go to the reward pool</li>
                      <li>Rewards are distributed on the last day of each month</li>
                      <li>60% goes to the top 3 most roared posts</li>
                      <li>40% is split among the next 7 top posts</li>
                      <li>You must hold at least 5 shares to be eligible for rewards</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Last Month's Winners</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold">
                            1
                          </div>
                          <div>
                            <div className="font-medium">alice.eth</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">"The future of layer 2 solutions is here..."</div>
                          </div>
                        </div>
                        <div className="font-bold">0.45 ETH</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">
                            2
                          </div>
                          <div>
                            <div className="font-medium">bob.lens</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">"Here's my analysis of the recent EIP..."</div>
                          </div>
                        </div>
                        <div className="font-bold">0.32 ETH</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/5 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">
                            3
                          </div>
                          <div>
                            <div className="font-medium">charlie.sol</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">"I created this tutorial for beginners..."</div>
                          </div>
                        </div>
                        <div className="font-bold">0.18 ETH</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="about" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>About {community?.name || id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Community Description</h3>
                  <p className="text-muted-foreground">{community?.description || 'No description available.'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created On</span>
                        <span>{community?.created_on ? new Date(community.created_on).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin</span>
                        <span>{community?.owner ? `${community.owner.substring(0, 6)}...${community.owner.substring(community.owner.length - 4)}` : 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Members</span>
                        <span>{community?.members_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Shares</span>
                        <span>{community?.shares.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Fee Structure</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin Fee</span>
                        <span>{community?.fees.admin_fees || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reward Pool</span>
                        <span>{community?.fees.reward_fees || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee</span>
                        <span>{community?.fees.platform_fees || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Share Price</span>
                        <span>{community?.prices.buy_price.toFixed(6) || 0} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Community Rules</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                    <li>Be respectful to all members and maintain a professional tone</li>
                    <li>No spam, excessive self-promotion, or plagiarism</li>
                    <li>Content should be relevant to {community?.name || id}</li>
                    <li>Provide evidence and sources for technical claims when possible</li>
                    <li>Abide by the community guidelines for posting and commenting</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {!isMobile && (
        <div className="w-full md:w-80 order-1 md:order-2 flex-shrink-0">
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
                  style={{ backgroundImage: `url(${community?.image || 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2532&auto=format&fit=crop'})` }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent"></div>
                
                <Avatar className="absolute bottom-0 left-4 transform translate-y-1/2 h-16 w-16 border-4 border-background">
                  <AvatarImage src={community?.image} alt={community?.name} />
                  <AvatarFallback>{community?.name ? community.name[0].toUpperCase() : id?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              
              <CardHeader className="pt-10 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{community?.name || id}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {community?.members_count || 0} members
                    </CardDescription>
                  </div>
                  
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
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per Share</span>
                    <div className="text-right">
                      <div className="font-semibold text-[15px]">${community?.prices.buy_price_usd.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-muted-foreground">{community?.prices.buy_price.toFixed(6) || '0.000000'} ETH</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Cap</span>
                    <div className="text-right">
                      <div className="font-semibold text-[15px]">${community?.market_cap.usd.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</div>
                      <div className="text-xs text-muted-foreground">{community?.market_cap.eth.toFixed(2) || '0.00'} ETH</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="pt-1">
                    <div className="text-sm font-medium mb-2">Your Holdings</div>
                    {hasShares ? (
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Shares Owned</span>
                          <span className="font-medium">{user?.shares.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Value</span>
                          <div className="text-right">
                            <div className="font-semibold">${user?.share_value.usd.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {user?.share_value.eth.toFixed(6)} ETH
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
                            ${((community?.rewards.available_rewards || 0) * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {community?.rewards.available_rewards.toFixed(5) || '0.00000'} ETH
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
                        Buy More
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
          </div>
        </div>
      )}
      
      <TradeSheet
        open={tradeSheetOpen}
        onOpenChange={setTradeSheetOpen}
        community={{
          name: community?.name || id || '',
          currentPrice: community?.prices.buy_price || 0.001
        }}
        action={tradeAction}
        userEthBalance="0.536"
      />
    </div>
  );
};

export default CommunityPage;
