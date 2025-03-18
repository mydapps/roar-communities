
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  Search, 
  TrendingUp, 
  Users, 
  ArrowUp, 
  ArrowDown,
  Plus,
  Filter
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

const CommunitiesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
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
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="newest">Newest</TabsTrigger>
          <TabsTrigger value="highest-reward">Highest Reward</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CommunityCard 
              name="Ethereum Devs"
              description="A community for Ethereum developers to share knowledge and collaborate."
              members={1423}
              pricePerShare={0.023}
              priceChange={12.5}
              rewardPool={2.45}
              tags={["Development", "Ethereum", "Smart Contracts"]}
            />
            <CommunityCard 
              name="DeFi Explorers"
              description="Exploring the world of decentralized finance protocols and strategies."
              members={2891}
              pricePerShare={0.034}
              priceChange={-3.2}
              rewardPool={4.12}
              tags={["DeFi", "Finance", "Yield"]}
            />
            <CommunityCard 
              name="NFT Creators"
              description="For artists and collectors in the NFT space to showcase work and discuss trends."
              members={943}
              pricePerShare={0.017}
              priceChange={5.7}
              rewardPool={1.65}
              tags={["Art", "NFTs", "Collectibles"]}
            />
            <CommunityCard 
              name="DAOs United"
              description="Discussion around governance models and decentralized autonomous organizations."
              members={512}
              pricePerShare={0.009}
              priceChange={22.1}
              rewardPool={0.87}
              tags={["Governance", "DAOs", "Voting"]}
            />
            <CommunityCard 
              name="Layer 2 Solutions"
              description="Focused on scaling solutions for Ethereum and other blockchains."
              members={734}
              pricePerShare={0.015}
              priceChange={8.3}
              rewardPool={1.23}
              tags={["Scaling", "Layer 2", "Optimism"]}
            />
            <CommunityCard 
              name="Web3 Gaming Guild"
              description="For gamers exploring play-to-earn and blockchain-based gaming ecosystems."
              members={1689}
              pricePerShare={0.028}
              priceChange={-1.4}
              rewardPool={3.01}
              tags={["Gaming", "Play-to-Earn", "Metaverse"]}
            />
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="text-center p-8 text-muted-foreground">
            Loading trending communities...
          </div>
        </TabsContent>

        <TabsContent value="newest">
          <div className="text-center p-8 text-muted-foreground">
            Loading newest communities...
          </div>
        </TabsContent>

        <TabsContent value="highest-reward">
          <div className="text-center p-8 text-muted-foreground">
            Loading communities with highest rewards...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface CommunityCardProps {
  name: string;
  description: string;
  members: number;
  pricePerShare: number;
  priceChange: number;
  rewardPool: number;
  tags: string[];
}

const CommunityCard = ({ 
  name, 
  description, 
  members, 
  pricePerShare, 
  priceChange, 
  rewardPool, 
  tags 
}: CommunityCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 animate-scale-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Link 
            to={`/community/${name.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-lg font-bold hover:text-primary transition-colors"
          >
            {name}
          </Link>
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
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Members</div>
            <div className="flex items-center mt-1">
              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="font-medium">{members.toLocaleString()}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Price Per Share</div>
            <div className="font-medium mt-1">{pricePerShare.toFixed(3)} ETH</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Reward Pool</span>
            <span className="font-medium">{rewardPool.toFixed(2)} ETH</span>
          </div>
          <Progress value={Math.min(rewardPool * 10, 100)} className="h-2" />
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/40 flex justify-between pt-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/community/${name.toLowerCase().replace(/\s+/g, '-')}`}>
            View Details
          </Link>
        </Button>
        <Button size="sm">Buy Shares</Button>
      </CardFooter>
    </Card>
  );
};

export default CommunitiesPage;
