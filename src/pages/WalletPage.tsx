import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowUpRight, ArrowDownToLine, History, RefreshCw, Send } from 'lucide-react';
import { getWalletBalance } from '@/utils/communityApi';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ETHTransferSheet } from '@/components/eth/ETHTransferSheet';
import { formatCurrency } from '@/utils/formatting';

const WalletPage = () => {
  const [ethBalance, setEthBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      setIsRefreshing(true);
      const balanceData = await getWalletBalance();
      setEthBalance(balanceData.balance.eth);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      toast.error("Failed to load wallet balance");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchWalletBalance}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Overview</CardTitle>
              <CardDescription>Your wallet and transaction overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                    <div className="text-3xl font-bold mt-1">
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        `${parseFloat(ethBalance).toFixed(6)} ETH`
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      ≈ ${formatCurrency(parseFloat(ethBalance) * 3000)}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none gap-2"
                      onClick={() => {
                        toast.info("Feature coming soon", {
                          description: "Deposit functionality will be available soon!"
                        });
                      }}
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Deposit
                    </Button>
                    <Button 
                      className="flex-1 sm:flex-none gap-2"
                      onClick={() => setTransferSheetOpen(true)}
                    >
                      <Send className="h-4 w-4" />
                      Send ETH
                    </Button>
                  </div>
                </div>
                
                <Alert className="bg-primary/5 border-primary/20">
                  <AlertTitle className="font-medium text-primary">New ETH Transfer Feature</AlertTitle>
                  <AlertDescription>
                    You can now transfer ETH directly to other users by their username or to external wallets using their Ethereum address.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No Recent Activity</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  Your recent transactions will appear here once you start making transfers or deposits.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="shadow-sm bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send ETH
              </CardTitle>
              <CardDescription>Transfer ETH to users or wallets</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                  <div className="text-2xl font-bold mt-1">{parseFloat(ethBalance).toFixed(6)} ETH</div>
                  <div className="text-muted-foreground text-sm mt-1">
                    ≈ ${formatCurrency(parseFloat(ethBalance) * 3000)}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="default" 
                    className="w-full gap-2"
                    onClick={() => setTransferSheetOpen(true)}
                  >
                    <Send className="h-4 w-4" />
                    Transfer ETH
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Send to any username on dapps.co</li>
                    <li>Transfer to external Ethereum wallets</li>
                    <li>Low network fees using gas estimation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Helpful Resources</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary hover:underline">
                    How to transfer ETH safely
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary hover:underline">
                    Understanding gas fees
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary hover:underline">
                    Security best practices
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <ETHTransferSheet
        open={transferSheetOpen}
        onOpenChange={setTransferSheetOpen}
        currentBalance={ethBalance}
        onTransferSuccess={fetchWalletBalance}
      />
    </div>
  );
};

export default WalletPage; 