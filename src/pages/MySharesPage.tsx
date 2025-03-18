
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  RefreshCw
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Dummy data for sample portfolio
const portfolioData = [
  { 
    name: "Ethereum Devs", 
    shares: 120, 
    value: 2.76, 
    avgBuyPrice: 0.021, 
    currentPrice: 0.023, 
    change: 9.52 
  },
  { 
    name: "DeFi Explorers", 
    shares: 85, 
    value: 2.89, 
    avgBuyPrice: 0.037, 
    currentPrice: 0.034, 
    change: -8.11 
  },
  { 
    name: "NFT Creators", 
    shares: 200, 
    value: 3.4, 
    avgBuyPrice: 0.015, 
    currentPrice: 0.017, 
    change: 13.33 
  },
  { 
    name: "DAOs United", 
    shares: 50, 
    value: 0.45, 
    avgBuyPrice: 0.008, 
    currentPrice: 0.009, 
    change: 12.5 
  },
];

// Calculate total portfolio value
const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

const MySharesPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Portfolio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PortfolioCard 
          title="Total Value" 
          value={`${totalValue.toFixed(2)} ETH`}
          icon={<PieChart className="h-5 w-5" />}
          description="Combined value of all your community shares"
          className="animate-scale-in"
        />
        <PortfolioCard 
          title="24h Change" 
          value="+0.32 ETH"
          percentage="+3.8%"
          isPositive={true}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Change in portfolio value over last 24 hours"
          className="animate-scale-in [animation-delay:100ms]"
        />
        <PortfolioCard 
          title="Rewards Earned" 
          value="1.45 ETH"
          icon={<DollarSign className="h-5 w-5" />}
          description="Total rewards earned from communities"
          className="animate-scale-in [animation-delay:200ms]"
        />
      </div>
      
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Communities</span>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your shares across different communities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="w-full justify-start mb-6 max-w-md">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="cards">Card View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Value (ETH)</TableHead>
                    <TableHead className="text-right">Avg. Buy Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioData.map((community) => (
                    <TableRow key={community.name}>
                      <TableCell className="font-medium">{community.name}</TableCell>
                      <TableCell className="text-right">{community.shares}</TableCell>
                      <TableCell className="text-right">{community.value.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{community.avgBuyPrice.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{community.currentPrice.toFixed(3)}</TableCell>
                      <TableCell className="text-right">
                        <span className={community.change >= 0 ? "text-green-600" : "text-red-600"}>
                          {community.change >= 0 ? "+" : ""}{community.change.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline">Buy</Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">Sell</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="cards">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolioData.map((community) => (
                  <CommunityShareCard 
                    key={community.name}
                    name={community.name}
                    shares={community.shares}
                    value={community.value}
                    avgBuyPrice={community.avgBuyPrice}
                    currentPrice={community.currentPrice}
                    change={community.change}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface PortfolioCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  percentage?: string;
  isPositive?: boolean;
  className?: string;
}

const PortfolioCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  percentage, 
  isPositive = true,
  className
}: PortfolioCardProps) => {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            {icon}
          </div>
          {percentage && (
            <Badge className={isPositive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
              {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {percentage}
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

interface CommunityShareCardProps {
  name: string;
  shares: number;
  value: number;
  avgBuyPrice: number;
  currentPrice: number;
  change: number;
}

const CommunityShareCard = ({ 
  name, 
  shares, 
  value, 
  avgBuyPrice, 
  currentPrice, 
  change 
}: CommunityShareCardProps) => {
  return (
    <Card className="hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>{name}</span>
          <Badge className={change >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
            {change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-y-4 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Shares Owned</div>
            <div className="font-medium">{shares}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="font-medium">{value.toFixed(2)} ETH</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Avg Buy Price</div>
            <div className="font-medium">{avgBuyPrice.toFixed(3)} ETH</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Current Price</div>
            <div className="font-medium">{currentPrice.toFixed(3)} ETH</div>
          </div>
        </div>
        
        <div className="flex justify-between space-x-2 mt-4">
          <Button variant="outline" className="flex-1">Buy More</Button>
          <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">Sell</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MySharesPage;
