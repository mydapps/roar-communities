
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  DollarSign, 
  Info,
  Clock
} from 'lucide-react';
import { Post } from '@/components/feed/Post';
import { MembersList } from '@/components/community/MembersList';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
    posts: [
      {
        id: 1,
        username: "alice.eth",
        timeAgo: "2h",
        content: "Just deployed my first smart contract on Ethereum. The gas fees were surprisingly reasonable!",
        roarCount: 24,
        commentCount: 5,
        shareCount: 2
      },
      {
        id: 2,
        username: "bob.lens",
        timeAgo: "5h",
        content: "Anyone trying out the new DEX? The UI is clean and the liquidity seems good so far. I'm impressed with the low slippage.",
        roarCount: 42,
        commentCount: 12,
        shareCount: 7
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

  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="px-2 py-1 font-normal">
                <Clock className="h-3 w-3 mr-1" />
                Created {communityData.createdAt}
              </Badge>
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
            <h1 className="text-3xl font-bold mb-2">{communityData.name}</h1>
            <p className="text-muted-foreground max-w-2xl mb-3">{communityData.description}</p>
            <div className="flex flex-wrap gap-2">
              {communityData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <Card className="w-full md:w-72 animate-scale-in">
            <CardHeader className="pb-2">
              <CardTitle>Share Details</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per Share</span>
                  <span className="font-medium">{communityData.pricePerShare.toFixed(3)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Shares</span>
                  <span className="font-medium">{communityData.totalShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="font-medium">{communityData.members.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Reward Pool</span>
                  <span className="font-medium">{communityData.rewardPool.toFixed(2)} ETH</span>
                </div>
                <Progress value={Math.min(communityData.rewardPool * 10, 100)} className="h-2" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">Buy Shares</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buy Shares in {communityData.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Shares</label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={buyAmount} 
                        onChange={(e) => setBuyAmount(parseInt(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estimated Cost</label>
                      <div className="text-lg font-bold">{estimatedCost.toFixed(3)} ETH</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Includes 1.5% admin fee and 2% reward pool contribution
                      </p>
                    </div>
                    <Button className="w-full">Confirm Purchase</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">Sell Shares</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sell Shares from {communityData.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Shares to Sell</label>
                      <Input type="number" min="1" placeholder="Enter amount" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estimated Receive</label>
                      <div className="text-lg font-bold">0.000 ETH</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        After 1.5% admin fee and 2% reward pool contribution
                      </p>
                    </div>
                    <Button className="w-full">Confirm Sale</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
        
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start mb-6 max-w-md">
            <TabsTrigger value="posts">
              <MessageCircle className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <DollarSign className="h-4 w-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="about">
              <Info className="h-4 w-4 mr-2" />
              About
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-6 animate-fade-in">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea 
                      className="w-full rounded-lg border border-border p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[100px]" 
                      placeholder={`Share your thoughts with the ${communityData.name} community...`}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button>Post</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              {communityData.posts.map((post) => (
                <Card key={post.id} className="border border-border/40 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${post.username}`} />
                          <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{post.username}</span>
                            <span className="text-muted-foreground text-sm mx-1">·</span>
                            <span className="text-muted-foreground text-sm">{post.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm mt-2">{post.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between py-3">
                    <Button variant="ghost" size="sm">
                      <LionIcon />
                      <span className="ml-1">{post.roarCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span>{post.commentCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span>Upvote</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Community Members</CardTitle>
                <CardDescription>
                  {communityData.members} members have purchased shares in this community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communityData.members_list.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${member.username}`} />
                          <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.username}</div>
                          <div className="text-sm text-muted-foreground">Joined {member.joinedAt}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{member.shares} shares</div>
                        <div className="text-sm text-muted-foreground">
                          {(member.shares * communityData.pricePerShare).toFixed(3)} ETH
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Reward Pool</span>
                      <span className="font-bold">{communityData.rewardPool.toFixed(2)} ETH</span>
                    </div>
                    <Progress value={Math.min(communityData.rewardPool * 10, 100)} className="h-3" />
                  </div>
                  
                  <div className="bg-muted/40 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">How Rewards Work</h3>
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
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">
                            1
                          </div>
                          <div>
                            <div className="font-medium">alice.eth</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">"The future of layer 2 solutions is here..."</div>
                          </div>
                        </div>
                        <div className="font-bold">0.45 ETH</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
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
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center text-primary font-bold">
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
    </div>
  );
};

export default CommunityPage;
