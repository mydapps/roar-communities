import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, SendHorizontal, Loader2, History, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PortfolioSummaryProps {
  ethValue: string;
  usdValue: string;
  ethBalance: string;
  isLoadingBalance?: boolean;
  onDepositClick: () => void;
  onSendClick: () => void;
  onWalletInfoClick?: () => void;
}

export const PortfolioSummary = ({
  ethValue,
  usdValue,
  ethBalance,
  isLoadingBalance = false,
  onDepositClick,
  onSendClick,
  onWalletInfoClick
}: PortfolioSummaryProps) => {
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [isPriceLoading, setIsPriceLoading] = useState<boolean>(true);

  // Fetch ETH price on component mount
  useEffect(() => {
    fetchEthPrice();
  }, []);
  
  // Function to fetch ETH price from API
  const fetchEthPrice = async () => {
    try {
      setIsPriceLoading(true);
      const response = await fetch('/api/eth_price');
      const data = await response.json();
      
      if (data.success) {
        setEthPrice(data.price);
      } else {
        console.error('Failed to fetch ETH price:', data);
        // Fallback to a reasonable default price if API fails
        setEthPrice(1800);
      }
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      // Fallback to a reasonable default price if API fails
      setEthPrice(1800);
    } finally {
      setIsPriceLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className="animate-scale-in bg-background/95 backdrop-blur-sm relative">
      <CardContent className="p-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                asChild 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-muted-foreground hover:text-primary hover:bg-accent"
              >
                <Link to="/transactions">
                  <History className="h-5 w-5" />
                  <span className="sr-only">Transaction History</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Transaction History</p>
            </TooltipContent>
          </Tooltip>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-primary">Your ETH Balance</h2>
            {onWalletInfoClick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onWalletInfoClick}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>About your wallet</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {isLoadingBalance && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-1 mb-6">
          <div className="flex items-baseline">
            <div className={cn(
              "text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent transition-opacity",
              isLoadingBalance && "opacity-70"
            )}>
              {ethBalance} ETH
            </div>
            {isLoadingBalance && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-primary/70" />
            )}
          </div>
          <div className={cn(
            "text-lg text-muted-foreground transition-opacity",
            isLoadingBalance && "opacity-70"
          )}>
            ${(parseFloat(ethBalance) * ethPrice).toFixed(2)} USD
            {isPriceLoading && (
              <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-muted-foreground/50" />
            )}
          </div>
        </div>
        
          <div className="flex space-x-4 mt-6">
          <Button 
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90" 
            onClick={onDepositClick}
            disabled={isLoadingBalance}
          >
            <Wallet className="h-5 w-5" />
            Deposit ETH
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2 border-2 hover:bg-primary/5"
            onClick={onSendClick}
            disabled={isLoadingBalance}
          >
            <SendHorizontal className="h-5 w-5" />
            Send ETH
          </Button>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
