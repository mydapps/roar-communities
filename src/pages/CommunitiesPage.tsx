
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Plus,
  Filter,
  User
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import CommunityCard from '@/components/communities/CommunityCard';

// Sample data for communities
const communitiesData = [
  { 
    name: "Ethereum Devs",
    description: "A community for Ethereum developers to share knowledge and collaborate.",
    members: 1423,
    pricePerShare: 0.023,
    priceChange: 12.5,
    rewardPool: 2.45,
    marketCap: 32.7,
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&h=500&fit=crop",
    isMember: true
  },
  { 
    name: "DeFi Explorers",
    description: "Exploring the world of decentralized finance protocols and strategies.",
    members: 2891,
    pricePerShare: 0.034,
    priceChange: -3.2,
    rewardPool: 4.12,
    marketCap: 98.3,
    image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=500&h=500&fit=crop",
    isMember: false
  },
  { 
    name: "NFT Creators",
    description: "For artists and collectors in the NFT space to showcase work and discuss trends.",
    members: 943,
    pricePerShare: 0.017,
    priceChange: 5.7,
    rewardPool: 1.65,
    marketCap: 16.1,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=500&fit=crop",
    isMember: true
  },
  { 
    name: "DAOs United",
    description: "Discussion around governance models and decentralized autonomous organizations.",
    members: 512,
    pricePerShare: 0.009,
    priceChange: 22.1,
    rewardPool: 0.87,
    marketCap: 4.6,
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=500&fit=crop",
    isMember: false
  },
  { 
    name: "Layer 2 Solutions",
    description: "Focused on scaling solutions for Ethereum and other blockchains.",
    members: 734,
    pricePerShare: 0.015,
    priceChange: 8.3,
    rewardPool: 1.23,
    marketCap: 11.0,
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&h=500&fit=crop",
    isMember: false
  },
  { 
    name: "Web3 Gaming Guild",
    description: "For gamers exploring play-to-earn and blockchain-based gaming ecosystems.",
    members: 1689,
    pricePerShare: 0.028,
    priceChange: -1.4,
    rewardPool: 3.01,
    marketCap: 47.3,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop",
    isMember: true
  },
];

// Filter for "My Communities" tab
const myCommunitiesData = communitiesData.filter(community => community.isMember);

const CommunitiesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter communities based on search query
  const filterCommunities = (communities) => {
    if (!searchQuery.trim()) return communities;
    const query = searchQuery.toLowerCase();
    return communities.filter(
      community => 
        community.name.toLowerCase().includes(query) || 
        community.description.toLowerCase().includes(query)
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Communities</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Community Name</label>
                <Input placeholder="E.g., DeFi Explorers" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" 
                  placeholder="What is your community about?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Share Price (ETH)</label>
                <Input type="number" placeholder="0.01" min="0.001" step="0.001" />
              </div>
              <Button className="w-full">Create Community</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto justify-start mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="my">My Communities</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="highest-reward">Highest Reward</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterCommunities(communitiesData).map((community) => (
              <CommunityCard 
                key={community.name}
                name={community.name}
                description={community.description}
                members={community.members}
                pricePerShare={community.pricePerShare}
                priceChange={community.priceChange}
                rewardPool={community.rewardPool}
                marketCap={community.marketCap}
                image={community.image}
                isMember={community.isMember}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterCommunities(myCommunitiesData).length > 0 ? (
              filterCommunities(myCommunitiesData).map((community) => (
                <CommunityCard 
                  key={community.name}
                  name={community.name}
                  description={community.description}
                  members={community.members}
                  pricePerShare={community.pricePerShare}
                  priceChange={community.priceChange}
                  rewardPool={community.rewardPool}
                  marketCap={community.marketCap}
                  image={community.image}
                  isMember={true}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No communities joined yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't joined any communities yet. Browse and join some communities to see them here.
                </p>
                <Button asChild variant="outline">
                  <Link to="/communities">Explore Communities</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterCommunities(communitiesData)
              .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
              .slice(0, 6)
              .map((community) => (
                <CommunityCard 
                  key={community.name}
                  name={community.name}
                  description={community.description}
                  members={community.members}
                  pricePerShare={community.pricePerShare}
                  priceChange={community.priceChange}
                  rewardPool={community.rewardPool}
                  marketCap={community.marketCap}
                  image={community.image}
                  isMember={community.isMember}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="newest">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* In a real app, this would be sorted by creation date */}
            {filterCommunities(communitiesData)
              .slice(0, 3)
              .map((community) => (
                <CommunityCard 
                  key={community.name}
                  name={community.name}
                  description={community.description}
                  members={community.members}
                  pricePerShare={community.pricePerShare}
                  priceChange={community.priceChange}
                  rewardPool={community.rewardPool}
                  marketCap={community.marketCap}
                  image={community.image}
                  isMember={community.isMember}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="highest-reward">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterCommunities(communitiesData)
              .sort((a, b) => b.rewardPool - a.rewardPool)
              .slice(0, 6)
              .map((community) => (
                <CommunityCard 
                  key={community.name}
                  name={community.name}
                  description={community.description}
                  members={community.members}
                  pricePerShare={community.pricePerShare}
                  priceChange={community.priceChange}
                  rewardPool={community.rewardPool}
                  marketCap={community.marketCap}
                  image={community.image}
                  isMember={community.isMember}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunitiesPage;
