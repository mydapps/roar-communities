
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, SendHorizontal } from 'lucide-react';

interface PortfolioSummaryProps {
  ethValue: string;
  usdValue: string;
  onDepositClick: () => void;
  onSendClick: () => void;
}

export const PortfolioSummary = ({
  ethValue,
  usdValue,
  onDepositClick,
  onSendClick
}: PortfolioSummaryProps) => {
  return (
    <Card className="animate-scale-in">
      <CardContent className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">My Portfolio</h1>
          <p className="text-muted-foreground text-sm">Manage your communities and shares</p>
        </div>
        
        <div className="flex flex-col space-y-1 mb-6">
          <div className="text-3xl font-bold">{ethValue} ETH</div>
          <div className="text-lg text-muted-foreground">${usdValue} USD</div>
        </div>
        
        <div className="flex space-x-4">
          <Button 
            className="flex-1 gap-2" 
            onClick={onDepositClick}
          >
            <Wallet className="h-5 w-5" />
            Deposit ETH
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
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
