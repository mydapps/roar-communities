import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, SendHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioSummaryProps {
  ethValue: string;
  usdValue: string;
  ethBalance: string;
  isLoadingBalance?: boolean;
  onDepositClick: () => void;
  onSendClick: () => void;
}

export const PortfolioSummary = ({
  ethValue,
  usdValue,
  ethBalance,
  isLoadingBalance = false,
  onDepositClick,
  onSendClick
}: PortfolioSummaryProps) => {
  return (
    <Card className="animate-scale-in bg-background/95 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Your ETH Balance</h2>
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
            ${(parseFloat(ethBalance) * 3521.89).toFixed(2)} USD
          </div>
        </div>
        
        <div className="flex space-x-4">
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
  );
};
