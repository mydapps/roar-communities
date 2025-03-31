import React, { useState, useEffect, useCallback } from 'react';
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
import { useCommunityPosts, CommunityPost } from '@/hooks/useCommunityPosts';
import { toggleRoar } from '@/utils/api';

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
  const [activeTab, setActiveTab] = useState("posts");
  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy");
  const [localPosts, setLocalPosts] = useState<Partial<CommunityPost>[]>([]);
  
  console.log("CommunityPage rendering, id:", id, "activeTab:", activeTab);
  
  const { data: communityData, loading: communityLoading, error: communityError } = useCommunityData(id);
  
  console.log("Community data:", communityData);
  if (communityData?.community?.rewards) {
    console.log("Community rewards:", communityData.community.rewards);
    console.log("Available rewards:", communityData.community.rewards.available_rewards);
  }
  
  const { members, loading: membersLoading, hasMore: hasMoreMembers, loadMore: loadMoreMembers } = useCommunityMembers(id);
  
  const { posts, loading: postsLoading, hasMore: hasMorePosts, loadMore: loadMorePosts, loadingElementRef } = useCommunityPosts(id);
  
  const allPosts = [...localPosts, ...posts];
  
  const ethToUsd = communityData?.community?.prices?.buy_price_usd && communityData?.community?.prices?.buy_price 
    ? communityData.community.prices.buy_price_usd / communityData.community.prices.buy_price
    : 2500;
  
  const [buyAmount, setBuyAmount] = useState<number>(1);
  
  useEffect(() => {
    setLocalPosts([]);
  }, [id]);
  
  const handlePostCreated = (newPost: Partial<CommunityPost>) => {
    console.log("New post created:", newPost);
    setLocalPosts(prev => [newPost, ...prev]);
    toast.success("Post created successfully!");
  };
  
  const priceChange = communityData?.community ? 
    ((communityData.community.prices.buy_price - 0.002) / 0.002) * 100 : 
    12.5;
  
  const chartPoints = priceChange > 0 
    ? "M0,50 Q25,30 50,20 T100,10" 
    : "M0,50 Q25,70 50,80 T100,90";
  
  const handleBuyAction = () => {
    setTradeAction("buy");
    setTradeSheetOpen(true);
  };
  
  const handleSellAction = () => {
    setTradeAction("sell");
    setTradeSheetOpen(true);
  };
  
  const handleRoar = async (postCode: string) => {
    if (!postCode) {
      console.error("Cannot roar post: missing postCode");
      toast.error("Unable to update post. Missing identifier.");
      return;
    }
    
    try {
      const success = await toggleRoar(postCode);
      if (!success) {
        toast.error("Failed to update post. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling roar:", error);
      toast.error("Error updating post. Please try again.");
    }
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
  
  const hasShares = user && user.shares > 0;
  
  const availableRewards = community?.rewards?.available_rewards || 0;
  console.log("Rendered with available rewards:", availableRewards);
  const hasLastDistributed = community?.rewards?.last_distributed && community.rewards.last_distributed !== null;
  
  return (
    <div className="flex flex-col md:flex-row gap-4 animate-fade-in max-w-full overflow-x-hidden pt-4 md:pt-0">
      <div className="flex-1 order-2 md:order-1">
        {isMobile && (
          <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-3 mb-3 border-b pt-4">
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
              {isMobile && (
                hasShares ? (
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex-shrink-0"
                      onClick={() => {
                        setTradeAction("buy");
                        setTradeSheetOpen(true);
                      }}
                    >
                      Buy
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="shadow-sm flex-shrink-0"
                      onClick={() => {
                        setTradeAction("sell");
                        setTradeSheetOpen(true);
                      }}
                    >
                      Sell
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm"
                    variant="default"
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex-shrink-0"
                    onClick={() => {
                      setTradeAction("buy");
                      setTradeSheetOpen(true);
                    }}
                  >
                    Join
                  </Button>
                )
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Share Price</div>
                <div className="font-semibold text-sm flex items-center">
                  ${community?.prices?.buy_price_usd?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Market Cap</div>
                <div className="font-semibold text-sm flex items-center">
                  ${community?.market_cap?.usd >= 1000000 
                    ? (community.market_cap.usd / 1000000).toFixed(1) + 'M' 
                    : community?.market_cap?.usd?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Card className="mb-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 mt-6 md:mt-8">
          <CardContent className={`pt-6 ${isMobile ? 'mt-12' : ''}`}>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What's on your mind?
            </h2>
            <CreatePostCard 
              onPostCreated={handlePostCreated}
              communityName={community?.name || id || ''}
            />
          </CardContent>
        </Card>
        
        {isMobile && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6 mt-8">
            <TabsList className="w-full grid grid-cols-4 bg-muted/50">
              <TabsTrigger value="posts" className="data-[state=active]:bg-background">
                <MessageCircle className="h-4 w-4 mr-1" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-background">
                <Users className="h-4 w-4 mr-1" />
                Members
              </TabsTrigger>
              <TabsTrigger value="rewards" className="data-[state=active]:bg-background">
                <DollarSign className="h-4 w-4 mr-1" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="about" className="data-[state=active]:bg-background">
                <Info className="h-4 w-4 mr-1" />
                About
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="animate-fade-in mt-0">
              <div className="space-y-6">
                {postsLoading && allPosts.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allPosts.length > 0 ? (
                  <>
                    {allPosts.map((post, index) => (
                      <Post 
                        key={`post-${post.code || index}-${index}`}
                        username={post.handle || ''}
                        community={post.community || ''}
                        timeAgo={post.timeAgo || ''}
                        content={post.body || ''}
                        roarCount={post.upvotes || 0}
                        commentCount={post.reply_count || 0}
                        shareCount={post.engagement || 0}
                        images={post.multiple_images ? post.images || [] : (post.image ? [post.image_url || ''] : [])}
                        video={undefined}
                        postCode={post.code || ''}
                        avatar={post.avatar || ''}
                        roared={post.roar === 1}
                        onRoar={() => post.code ? handleRoar(post.code) : null}
                        isMirror={post.is_mirror === 1}
                        ipfs={post.code || ''}
                        isLoggedIn={!!localStorage.getItem('dapps_user_key')}
                        hideComments={false}
                      />
                    ))}
                    
                    <div 
                      ref={loadingElementRef}
                      className="flex justify-center py-8 my-4"
                      id="infinite-scroll-marker"
                    >
                      {postsLoading && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      )}
                      
                      {!postsLoading && !hasMorePosts && posts.length > 0 && (
                        <p className="text-sm text-muted-foreground">You've reached the end</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">No posts in this community yet. Be the first to post!</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="members" className="animate-fade-in mt-0">
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
            
            <TabsContent value="rewards" className="animate-fade-in mt-0">
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
                              {availableRewards.toFixed(5) || '0.00000'} ETH
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${(availableRewards * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                        <li>{community?.fees?.reward_fees || 2}% of all buy/sell transactions go to the reward pool</li>
                        <li>Rewards are distributed on the last day of each month</li>
                        <li>60% goes to the top 3 most roared posts</li>
                        <li>40% is split among the next 7 top posts</li>
                        <li>You must hold at least 5 shares to be eligible for rewards</li>
                      </ul>
                    </div>
                    
                    {hasLastDistributed && (
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
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="about" className="animate-fade-in mt-0">
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
                          <span>{community?.shares?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Fee Structure</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin Fee</span>
                          <span>{community?.fees?.admin_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reward Pool</span>
                          <span>{community?.fees?.reward_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee</span>
                          <span>{community?.fees?.platform_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Share Price</span>
                          <span>{community?.prices?.buy_price?.toFixed(6) || 0} ETH</span>
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
        )}
        
        {!isMobile && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full lg:w-auto flex justify-start mb-6 pb-px bg-transparent p-0 overflow-x-auto flex-nowrap h-auto border-b rounded-none">
              <TabsTrigger value="posts" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                <MessageCircle className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                <DollarSign className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="about" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                <Info className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="animate-fade-in mt-0">
              <div className="space-y-6">
                {postsLoading && allPosts.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allPosts.length > 0 ? (
                  <>
                    {allPosts.map((post, index) => (
                      <Post 
                        key={`post-${post.code || index}-${index}`}
                        username={post.handle || ''}
                        community={post.community || ''}
                        timeAgo={post.timeAgo || ''}
                        content={post.body || ''}
                        roarCount={post.upvotes || 0}
                        commentCount={post.reply_count || 0}
                        shareCount={post.engagement || 0}
                        images={post.multiple_images ? post.images || [] : (post.image ? [post.image_url || ''] : [])}
                        video={undefined}
                        postCode={post.code || ''}
                        avatar={post.avatar || ''}
                        roared={post.roar === 1}
                        onRoar={() => post.code ? handleRoar(post.code) : null}
                        isMirror={post.is_mirror === 1}
                        ipfs={post.code || ''}
                        isLoggedIn={!!localStorage.getItem('dapps_user_key')}
                        hideComments={false}
                      />
                    ))}
                    
                    <div 
                      ref={loadingElementRef}
                      className="flex justify-center py-8"
                    >
                      {postsLoading && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      )}
                      
                      {!postsLoading && !hasMorePosts && posts.length > 0 && (
                        <p className="text-sm text-muted-foreground">You've reached the end</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">No posts in this community yet. Be the first to post!</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="members" className="animate-fade-in mt-0">
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
            
            <TabsContent value="rewards" className="animate-fade-in mt-0">
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
                              {availableRewards.toFixed(5) || '0.00000'} ETH
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${(availableRewards * ethToUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                        <li>{community?.fees?.reward_fees || 2}% of all buy/sell transactions go to the reward pool</li>
                        <li>Rewards are distributed on the last day of each month</li>
                        <li>60% goes to the top 3 most roared posts</li>
                        <li>40% is split among the next 7 top posts</li>
                        <li>You must hold at least 5 shares to be eligible for rewards</li>
                      </ul>
                    </div>
                    
                    {hasLastDistributed && (
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
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="about" className="animate-fade-in mt-0">
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
                          <span>{community?.shares?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Fee Structure</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin Fee</span>
                          <span>{community?.fees?.admin_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reward Pool</span>
                          <span>{community?.fees?.reward_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee</span>
                          <span>{community?.fees?.platform_fees || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Share Price</span>
                          <span>{community?.prices?.buy_price?.toFixed(6) || 0} ETH</span>
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
        )}
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
                      <div className="font-semibold text-[15px]">${community?.prices?.buy_price_usd?.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-muted-foreground">{community?.prices?.buy_price?.toFixed(6) || '0.000000'} ETH</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Cap</span>
                    <div className="text-right">
                      <div className="font-semibold text-[15px]">${community?.market_cap?.usd?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</div>
                      <div className="text-xs text-muted-foreground">{community?.market_cap?.eth?.toFixed(2) || '0.00'} ETH</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="pt-1">
                    <div className="text-sm font-medium mb-2">Your Holdings</div>
                    {hasShares ? (
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Shares Owned</span>
                          <span className="font-medium">{user?.shares?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Value</span>
                          <div className="text-right">
                            <div className="font-semibold">${user?.share_value?.usd?.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {user?.share_value?.eth?.toFixed(6)} ETH
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
            
            <Card className="mt-4 border rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-medium text-lg">Community Navigation</h3>
              </div>
              <div className="p-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full p-0 flex flex-col gap-1 bg-transparent">
                    <TabsTrigger value="posts" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/10">
                      <MessageCircle className="h-4 w-4 mr-3" />
                      Posts
                    </TabsTrigger>
                    <TabsTrigger value="members" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/10">
                      <Users className="h-4 w-4 mr-3" />
                      Members
                    </TabsTrigger>
                    <TabsTrigger value="rewards" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/10">
                      <DollarSign className="h-4 w-4 mr-3" />
                      Rewards
                    </TabsTrigger>
                    <TabsTrigger value="about" className="w-full justify-start px-4 py-2 data-[state=active]:bg-primary/10">
                      <Info className="h-4 w-4 mr-3" />
                      About
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      <TradeSheet
        open={tradeSheetOpen}
        onOpenChange={setTradeSheetOpen}
        community={{
          name: community?.name || id || '',
          currentPrice: community?.prices?.buy_price || 0.001
        }}
        action={tradeAction}
        userEthBalance="0.536"
      />
    </div>
  );
};

export default CommunityPage;
