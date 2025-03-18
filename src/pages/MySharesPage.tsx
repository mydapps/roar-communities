
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowUp, 
  ArrowDown,  
  Wallet,
  RefreshCw,
  SendHorizontal,
  Plus,
  Minus
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PortfolioSummary } from '@/components/shares/PortfolioSummary';
import { DepositSheet } from '@/components/shares/DepositSheet';
import { SendSheet } from '@/components/shares/SendSheet';
import { TradeSheet } from '@/components/shares/TradeSheet';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from "@/components/ui/drawer";

// Dummy data for sample portfolio
const portfolioData = [
  { 
    name: "Ethereum Devs", 
    image: "https://github.com/shadcn.png",
    shares: 120, 
    value: 2.76, 
    avgBuyPrice: 0.021, 
    currentPrice: 0.023, 
    change: 9.52 
  },
  { 
    name: "DeFi Explorers", 
    image: "https://github.com/radix-ui.png",
    shares: 85, 
    value: 2.89, 
    avgBuyPrice: 0.037, 
    currentPrice: 0.034, 
    change: -8.11 
  },
  { 
    name: "NFT Creators", 
    image: "https://avatars.githubusercontent.com/u/124599?v=4",
    shares: 200, 
    value: 3.4, 
    avgBuyPrice: 0.015, 
    currentPrice: 0.017, 
    change: 13.33 
  },
  { 
    name: "DAOs United", 
    image: "https://avatars.githubusercontent.com/u/6412038?v=4",
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

// Mock user ETH balance
const userEthBalance = "3.75";

const MySharesPage = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell' | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    <div className="space-y-6 animate-fade-in pb-20 md:pb-10">
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
            <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-full hover:bg-primary/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        userEthBalance={userEthBalance}
      />

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Community Share Details</DrawerTitle>
            <DrawerDescription>
              View detailed information about your shares
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            {selectedCommunity && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedCommunity.image} alt={selectedCommunity.name} />
                    <AvatarFallback>{selectedCommunity.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{selectedCommunity.name}</h3>
                    <p className="text-muted-foreground">
                      Current Price: {selectedCommunity.currentPrice.toFixed(3)} ETH
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Shares Owned</p>
                    <p className="text-2xl font-bold">{selectedCommunity.shares}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">{selectedCommunity.value.toFixed(2)} ETH</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button className="flex-1 gap-2" onClick={() => handleTradeClick(selectedCommunity, 'buy')}>
                    <Plus className="h-4 w-4" />
                    Buy More
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 text-red-600 hover:text-red-700" onClick={() => handleTradeClick(selectedCommunity, 'sell')}>
                    <Minus className="h-4 w-4" />
                    Sell
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

interface CommunityShareCardProps {
  community: {
    name: string;
    image: string;
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
  const { name, image, shares, value, currentPrice, change } = community;
  
  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      <div className={`h-1.5 w-full ${change >= 0 ? "bg-green-500" : "bg-red-500"}`} />
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src={image} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold">{name}</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={change >= 0 ? "text-green-600" : "text-red-600"}>
                {change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {change >= 0 ? "+" : ""}{change.toFixed(2)}%
              </Badge>
              <span className="text-xs text-muted-foreground">{currentPrice.toFixed(3)} ETH</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-4 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">Shares Owned</div>
            <div className="font-medium text-lg">{shares}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="font-medium text-lg">{value.toFixed(2)} ETH</div>
          </div>
        </div>
        
        <div className="flex justify-between space-x-2 mt-4">
          <Button variant="outline" className="flex-1 hover:bg-green-500/10" onClick={onBuyClick}>
            <Plus className="h-4 w-4 mr-1" />
            Buy
          </Button>
          <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-500/10" onClick={onSellClick}>
            <Minus className="h-4 w-4 mr-1" />
            Sell
          </Button>
          <Button variant="outline" className="flex-grow-0 aspect-square p-2" onClick={onSendClick}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MySharesPage;
