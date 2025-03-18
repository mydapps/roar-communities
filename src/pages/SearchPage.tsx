
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search as SearchIcon, Sparkles, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { Post } from '@/components/feed/Post';
import { Link } from 'react-router-dom';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample search results
  const communityResults = [
    {
      name: "Ethereum Devs",
      description: "A community for Ethereum developers to share knowledge and collaborate.",
      members: 1423,
      pricePerShare: 0.023,
      priceChange: 12.5,
    },
    {
      name: "DeFi Explorers",
      description: "Exploring the world of decentralized finance protocols and strategies.",
      members: 2891,
      pricePerShare: 0.034,
      priceChange: -3.2,
    },
    {
      name: "NFT Creators",
      description: "For artists and collectors in the NFT space to showcase work and discuss trends.",
      members: 943,
      pricePerShare: 0.017,
      priceChange: 5.7,
    },
  ];
  
  const postResults = [
    {
      username: "alice.eth",
      community: "Ethereum Devs",
      timeAgo: "2h",
      content: "Just deployed my first smart contract on Ethereum. The gas fees were surprisingly reasonable!",
      roarCount: 24,
      commentCount: 5,
      shareCount: 2
    },
    {
      username: "bob.lens",
      community: "DeFi Explorers",
      timeAgo: "5h",
      content: "Anyone trying out the new DEX? The UI is clean and the liquidity seems good so far. I'm impressed with the low slippage.",
      roarCount: 42,
      commentCount: 12,
      shareCount: 7
    },
  ];
  
  const userResults = [
    {
      username: "alice.eth",
      bio: "Ethereum developer and DeFi enthusiast",
      communities: ["Ethereum Devs", "DeFi Explorers"],
    },
    {
      username: "bob.lens",
      bio: "NFT artist and collector",
      communities: ["NFT Creators", "Art Collective"],
    },
    {
      username: "charlie.sol",
      bio: "Solana developer building the future of finance",
      communities: ["Solana Squad", "DeFi Explorers"],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities, posts, users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button>
          <SearchIcon className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
      
      {!searchQuery ? (
        <Card className="animate-fade-in">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center py-20">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Discover Communities and Content</h2>
            <p className="text-muted-foreground max-w-md">
              Search for communities, posts, or users to find exactly what you're looking for in the dapps.co ecosystem.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start mb-6 max-w-md">
            <TabsTrigger value="all">All Results</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Communities</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/communities">View All</Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communityResults.slice(0, 2).map((community, index) => (
                  <CommunityResult key={index} community={community} />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Posts</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/feed">View All</Link>
                </Button>
              </div>
              
              <div className="space-y-4">
                {postResults.slice(0, 2).map((post, index) => (
                  <Post key={index} {...post} />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Users</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userResults.slice(0, 3).map((user, index) => (
                  <UserResult key={index} user={user} />
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="communities" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Community Results</h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityResults.map((community, index) => (
                <CommunityResult key={index} community={community} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="posts" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Post Results</h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            
            <div className="space-y-4">
              {postResults.map((post, index) => (
                <Post key={index} {...post} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">User Results</h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userResults.map((user, index) => (
                <UserResult key={index} user={user} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

interface CommunityResultProps {
  community: {
    name: string;
    description: string;
    members: number;
    pricePerShare: number;
    priceChange: number;
  };
}

const CommunityResult = ({ community }: CommunityResultProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 animate-scale-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Link 
            to={`/community/${community.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-lg font-bold hover:text-primary transition-colors"
          >
            {community.name}
          </Link>
          {community.priceChange > 0 ? (
            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
              <ArrowUp className="h-3 w-3 mr-1" />
              {community.priceChange.toFixed(1)}%
            </Badge>
          ) : (
            <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
              <ArrowDown className="h-3 w-3 mr-1" />
              {Math.abs(community.priceChange).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{community.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm">{community.members.toLocaleString()} members</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{community.pricePerShare.toFixed(3)} ETH</span> per share
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface UserResultProps {
  user: {
    username: string;
    bio: string;
    communities: string[];
  };
}

const UserResult = ({ user }: UserResultProps) => {
  return (
    <Card className="hover:shadow-md transition-all duration-300 animate-scale-in">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16 mb-3">
            <AvatarImage src={`https://avatar.vercel.sh/${user.username}`} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <h3 className="font-medium text-lg">{user.username}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">{user.bio}</p>
          
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {user.communities.map((community, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {community}
              </Badge>
            ))}
          </div>
          
          <Button className="mt-4 w-full" size="sm">View Profile</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchPage;
