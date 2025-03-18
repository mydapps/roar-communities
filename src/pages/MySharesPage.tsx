
import React, { useState } from 'react';
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
  Wallet,
  Copy,
  RefreshCw,
  SendHorizontal
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
import { PortfolioSummary } from '@/components/shares/PortfolioSummary';
import { DepositSheet } from '@/components/shares/DepositSheet';
import { SendSheet } from '@/components/shares/SendSheet';
import { TradeSheet } from '@/components/shares/TradeSheet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
const ethToUsd = 3521.89; // Mock ETH/USD exchange rate
const totalValueUsd = totalValue * ethToUsd;

const MySharesPage = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell' | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const { toast } = useToast();

  const handleTradeClick = (community: any, action: 'buy' | 'sell') => {
    setSelectedCommunity(community);
    setTradeAction(action);
    setTradeOpen(true);
  };

  const handleRefresh = () => {
    toast({
      title: "Refreshing",
      description: "Fetching latest portfolio data...",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PortfolioSummary 
        ethValue={totalValue.toFixed(4)} 
        usdValue={(totalValueUsd).toFixed(2)}
        onDepositClick={() => setDepositOpen(true)}
        onSendClick={() => setSendOpen(true)}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Communities</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
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
              <div className="overflow-x-auto">
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
                      <TableRow key={community.name} className={cn(
                        "transition-colors hover:bg-accent/30"
                      )}>
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
                            <Button size="sm" variant="outline" onClick={() => handleTradeClick(community, 'buy')}>Buy</Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" 
                              onClick={() => handleTradeClick(community, 'sell')}>Sell</Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedCommunity(community);
                              setSendOpen(true);
                            }}>
                              <SendHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="cards">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolioData.map((community) => (
                  <CommunityShareCard 
                    key={community.name}
                    community={community}
                    onBuyClick={() => handleTradeClick(community, 'buy')}
                    onSellClick={() => handleTradeClick(community, 'sell')}
                    onSendClick={() => {
                      setSelectedCommunity(community);
                      setSendOpen(true);
                    }}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DepositSheet 
        open={depositOpen}
        onOpenChange={setDepositOpen}
      />

      <SendSheet 
        open={sendOpen}
        onOpenChange={setSendOpen}
        community={selectedCommunity}
        isEthSend={!selectedCommunity}
      />

      <TradeSheet 
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        community={selectedCommunity}
        action={tradeAction}
      />
    </div>
  );
};

interface CommunityShareCardProps {
  community: {
    name: string;
    shares: number;
    value: number;
    avgBuyPrice: number;
    currentPrice: number;
    change: number;
  };
  onBuyClick: () => void;
  onSellClick: () => void;
  onSendClick: () => void;
}

const CommunityShareCard = ({ 
  community,
  onBuyClick,
  onSellClick,
  onSendClick
}: CommunityShareCardProps) => {
  const { name, shares, value, avgBuyPrice, currentPrice, change } = community;
  
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
          <Button variant="outline" className="flex-1" onClick={onBuyClick}>Buy More</Button>
          <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700" onClick={onSellClick}>Sell</Button>
          <Button variant="outline" className="flex-grow-0" onClick={onSendClick}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MySharesPage;
