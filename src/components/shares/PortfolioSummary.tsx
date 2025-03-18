
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, SendHorizontal } from 'lucide-react';

interface PortfolioSummaryProps {
  ethValue: string;
  usdValue: string;
  ethBalance: string;
  onDepositClick: () => void;
  onSendClick: () => void;
}

export const PortfolioSummary = ({
  ethValue,
  usdValue,
  ethBalance,
  onDepositClick,
  onSendClick
}: PortfolioSummaryProps) => {
  return (
    <Card className="animate-scale-in bg-background/95 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-primary">Your ETH Balance</h2>
        </div>
        
        <div className="flex flex-col space-y-1 mb-6">
          <div className="flex items-baseline">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {ethBalance} ETH
            </div>
          </div>
          <div className="text-lg text-muted-foreground">
            ${(parseFloat(ethBalance) * 3521.89).toFixed(2)} USD
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Button 
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90" 
            onClick={onDepositClick}
          >
            <Wallet className="h-5 w-5" />
            Deposit ETH
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2 border-2 hover:bg-primary/5"
            onClick={onSendClick}
          >
            <SendHorizontal className="h-5 w-5" />
            Send ETH
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
