import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
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
  MoreHorizontal
} from 'lucide-react';
import { TradeSheet } from '@/components/shares/TradeSheet';

// Custom Lion icon for the Roar button
const LionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 15C8.5 13.5 10 12 12 12C14 12 15.5 13.5 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8.5 9C8.5 9.82843 7.82843 10.5 7 10.5C6.17157 10.5 5.5 9.82843 5.5 9C5.5 8.17157 6.17157 7.5 7 7.5C7.82843 7.5 8.5 8.17157 8.5 9Z" fill="currentColor"/>
    <path d="M18.5 9C18.5 9.82843 17.8284 10.5 17 10.5C16.1716 10.5 15.5 9.82843 15.5 9C15.5 8.17157 16.1716 7.5 17 7.5C17.8284 7.5 18.5 8.17157 18.5 9Z" fill="currentColor"/>
  </svg>
);

const CommunityPage = () => {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);
  const [isRoared, setIsRoared] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState("posts");
  const [isMirroredPost, setIsMirroredPost] = useState<Record<number, boolean>>({});
  const [isIPFSSaved, setIsIPFSSaved] = useState<Record<number, boolean>>({});
  
  const [communityData, setCommunityData] = useState({
    name: id ? id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '',
    description: "A community for Ethereum developers to share knowledge, collaborate on projects, and discuss the latest advancements in Ethereum technology. Members can contribute content, participate in discussions, and earn rewards from the community pool.",
    members: 1423,
    pricePerShare: 0.023,
    priceChange: 12.5,
    totalShares: 65000,
    rewardPool: 2.45,
    adminAddress: "0x1a2b...3c4d",
    createdAt: "2023-06-15",
    tags: ["Development", "Ethereum", "Smart Contracts"],
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2532&auto=format&fit=crop",
    userShareCount: 0,
    posts: [
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
    ],
    members_list: [
      { username: "alice.eth", shares: 320, joinedAt: "3 months ago" },
      { username: "bob.lens", shares: 250, joinedAt: "2 months ago" },
      { username: "charlie.sol", shares: 180, joinedAt: "1 month ago" },
      { username: "david.avax", shares: 120, joinedAt: "3 weeks ago" },
      { username: "eve.btc", shares: 90, joinedAt: "2 weeks ago" }
    ]
  });

  const [buyAmount, setBuyAmount] = useState<number>(1);
  const estimatedCost = buyAmount * communityData.pricePerShare;
  
  // ETH to USD conversion
  const ethToUsd = 3500; // 1 ETH = $3500 USD
  const priceInUsd = communityData.pricePerShare * ethToUsd;
  const rewardPoolUsd = communityData.rewardPool * ethToUsd;
  const marketCapUsd = (communityData.totalShares * communityData.pricePerShare) * ethToUsd;
  
  const handleRoar = (postId: number) => {
    setIsRoared(prev => {
      const updatedState = { ...prev };
      if (updatedState[postId]) {
        updatedState[postId] = false;
        
        // Update roar count in posts
        setCommunityData(prev => ({
          ...prev,
          posts: prev.posts.map(post => 
            post.id === postId 
              ? { ...post, roarCount: post.roarCount - 1 } 
              : post
          )
        }));
      } else {
        updatedState[postId] = true;
        
        // Update roar count in posts
        setCommunityData(prev => ({
          ...prev,
          posts: prev.posts.map(post => 
            post.id === postId 
              ? { ...post, roarCount: post.roarCount + 1 } 
              : post
          )
        }));
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
  
  // For the interactive trading chart effect
  const chartPoints = communityData.priceChange > 0 
    ? "M0,50 Q25,30 50,20 T100,10" 
    : "M0,50 Q25,70 50,80 T100,90";

  return (
    <div className="flex flex-col md:flex-row gap-4 animate-fade-in">
      {/* Main content section */}
      <div className="flex-1 order-2 md:order-1">
        {/* Header for mobile */}
        {isMobile && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 mb-3 border-b">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={communityData.image} alt={communityData.name} />
                <AvatarFallback>{communityData.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-xl font-bold">{communityData.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-background/80 text-xs flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {communityData.members} members
                  </Badge>
                  {communityData.priceChange > 0 ? (
                    <Badge className="bg-green-500/10 text-green-600 text-xs">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      {communityData.priceChange.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600 text-xs">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      {Math.abs(communityData.priceChange).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                size="sm"
                variant="default"
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                onClick={() => setTradeSheetOpen(true)}
              >
                {communityData.userShareCount > 0 ? 'Buy More' : 'Join'}
              </Button>
            </div>
            
            {/* Market cap and share price for mobile */}
            <div className="flex items-center justify-between px-2">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Share Price</div>
                <div className="font-semibold text-base flex items-center">
                  <DollarSign className="h-3.5 w-3.5 mr-0.5 text-muted-foreground" />
                  {priceInUsd.toFixed(2)}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({communityData.pricePerShare.toFixed(3)} ETH)
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Market Cap</div>
                <div className="font-semibold text-base flex items-center">
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5 text-muted-foreground" />
                  ${marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs for content sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full md:w-auto justify-start mb-6 overflow-x-visible flex-nowrap border-b pb-px">
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
          
          <TabsContent value="posts" className="animate-fade-in">
            {/* Post creation card */}
            <Card className="mb-6 overflow-hidden border-primary/20">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea 
                      className="w-full rounded-lg border border-border p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[80px]" 
                      placeholder={`Share your thoughts with the ${communityData.name} community...`}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Posts list */}
            <div className="space-y-4">
              {communityData.posts.map((post) => (
                <Card key={post.id} className="overflow-hidden group hover:border-primary/30 transition-all duration-300">
                  <CardHeader className="py-3 px-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={post.avatar} />
                          <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{post.username}</div>
                          <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
                        </div>
                      </div>
                      
                      <ShareDialog 
                        postTitle={post.content.slice(0, 30) + (post.content.length > 30 ? '...' : '')}
                        communityName={communityData.name}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </ShareDialog>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="py-0 px-4">
                    <p>{post.content}</p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between py-3 mt-2 bg-muted/20">
                    <Button 
                      variant={isRoared[post.id] ? "roar-active" : "roar"} 
                      size="sm" 
                      onClick={() => handleRoar(post.id)}
                    >
                      <div className="relative">
                        <LionIcon />
                        {isRoared[post.id] && (
                          <span className="absolute -top-2 -right-2 inline-flex animate-roar-text opacity-0 text-amber-500">
                            +1
                          </span>
                        )}
                      </div>
                      <span className="ml-1">{post.roarCount}</span>
                      {isRoared[post.id] && (
                        <span className="absolute inset-0 rounded-full animate-roar-waves opacity-0 bg-amber-500/20"></span>
                      )}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span>{post.commentCount}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={isMirroredPost[post.id] ? "text-primary" : ""}
                      onClick={() => handleMirror(post.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>Mirror</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={isIPFSSaved[post.id] ? "text-green-500" : ""}
                      onClick={() => handleSaveToIPFS(post.id)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      <span>IPFS</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Members tab */}
          <TabsContent value="members" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Community Members</CardTitle>
                <CardDescription>
                  {communityData.members} members have purchased shares in this community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {communityData.members_list.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${member.username}`} />
                          <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.username}</div>
                          <div className="text-xs text-muted-foreground">Joined {member.joinedAt}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{member.shares} shares</div>
                        <div className="text-xs text-muted-foreground">
                          {(member.shares * communityData.pricePerShare).toFixed(3)} ETH
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Rewards tab */}
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
                          <div className="font-bold text-lg">{communityData.rewardPool.toFixed(2)} ETH</div>
                          <div className="text-sm text-muted-foreground">${rewardPoolUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
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
                      <li>2% of all buy/sell transactions go to the reward pool</li>
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
          
          {/* About tab */}
          <TabsContent value="about" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>About {communityData.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Community Description</h3>
                  <p className="text-muted-foreground">{communityData.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created On</span>
                        <span>{communityData.createdAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin</span>
                        <span>{communityData.adminAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Members</span>
                        <span>{communityData.members}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Shares</span>
                        <span>{communityData.totalShares.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Fee Structure</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin Fee</span>
                        <span>1.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reward Pool</span>
                        <span>2.0%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Share Price</span>
                        <span>{communityData.pricePerShare.toFixed(3)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price Change (24h)</span>
                        <span className={communityData.priceChange >= 0 ? "text-green-600" : "text-red-600"}>
                          {communityData.priceChange >= 0 ? "+" : ""}{communityData.priceChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Community Rules</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                    <li>Be respectful to all members and maintain a professional tone</li>
                    <li>No spam, excessive self-promotion, or plagiarism</li>
                    <li>Content should be relevant to Ethereum development</li>
                    <li>Provide evidence and sources for technical claims when possible</li>
                    <li>Abide by the community guidelines for posting and commenting</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Sidebar for community info */}
      {!isMobile && (
        <div className="w-full md:w-80 order-1 md:order-2 flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            {/* Community Card */}
            <Card className="overflow-hidden relative">
              {/* Visual price chart background */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d={chartPoints + " V100 H0 Z"} 
                    fill={communityData.priceChange > 0 ? "#10B981" : "#EF4444"} 
                  />
                </svg>
              </div>
              
              {/* Header with image */}
              <div className="relative">
                <div 
                  className="h-32 w-full bg-cover bg-center" 
                  style={{ backgroundImage: `url(${communityData.image})` }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent"></div>
                
                <Avatar className="absolute bottom-0 left-4 transform translate-y-1/2 h-16 w-16 border-4 border-background">
                  <AvatarImage src={communityData.image} alt={communityData.name} />
                  <AvatarFallback>{communityData.name[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              
              <CardHeader className="pt-10 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{communityData.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {communityData.members} members
                    </CardDescription>
                  </div>
                  
                  {communityData.priceChange > 0 ? (
                    <Badge className="bg-green-500/10 text-green-600">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      {communityData.priceChange.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      {Math.abs(communityData.priceChange).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per Share</span>
                    <div className="text-right">
                      <div className="font-semibold text-[15px]">${priceInUsd.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{communityData.pricePerShare.toFixed(3)} ETH</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Cap</span>
                    <div className="text-right">
                      <div className="font-semibold text-[15px]">${marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-xs text-muted-foreground">{(communityData.totalShares * communityData.pricePerShare).toFixed(1)} ETH</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Your Holdings section */}
                  <div className="pt-1">
                    <div className="text-sm font-medium mb-2">Your Holdings</div>
                    {communityData.userShareCount > 0 ? (
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Shares Owned</span>
                          <span className="font-medium">{communityData.userShareCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Value</span>
                          <div className="text-right">
                            <div className="font-semibold">${(communityData.userShareCount * communityData.pricePerShare * ethToUsd).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {(communityData.userShareCount * communityData.pricePerShare).toFixed(3)} ETH
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
                  
                  {/* Reward Pool */}
                  <div className="bg-primary/5 rounded-lg p-3 mb-2 border border-primary/20 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-pulse"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-primary">Reward Pool</span>
                        <div className="text-right">
                          <div className="font-bold text-lg">${rewardPoolUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          <div className="text-xs text-muted-foreground">{communityData.rewardPool.toFixed(2)} ETH</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-3 pt-0">
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg" 
                  onClick={() => setTradeSheetOpen(true)}
                >
                  {communityData.userShareCount > 0 ? 'Buy More Shares' : 'Join Community'}
                </Button>
                
                {communityData.userShareCount > 0 && (
                  <Button variant="outline" className="w-full">
                    Sell Shares
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
      
      {/* Trade Sheet */}
      <TradeSheet
        open={tradeSheetOpen}
        onOpenChange={setTradeSheetOpen}
        community={{
          name: communityData.name,
          currentPrice: communityData.pricePerShare
        }}
        action={communityData.userShareCount > 0 ? "buy" : "buy"}
        userEthBalance="0.536"
      />
    </div>
  );
};

export default CommunityPage;
