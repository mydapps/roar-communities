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
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
    fetchEthPrice();
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
    <div className="container max-w-4xl px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-3/4">
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your ETH balance and transactions
          </p>
        </div>
        <div className="md:w-1/4 flex justify-start md:justify-end items-start">
        <Button
          variant="outline"
          size="sm"
            className="gap-2"
          onClick={fetchWalletBalance}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
            Refresh
        </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle>Overview</CardTitle>
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
                      ≈ ${formatCurrency(parseFloat(ethBalance) * ethPrice)}
                      {isPriceLoading && (
                        <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-muted-foreground/50" />
                      )}
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
                  <History className="h-4 w-4" />
                  <AlertTitle>Recent Activity</AlertTitle>
                  <AlertDescription>
                    Transaction history functionality is coming soon. You will be able to view all your deposit, withdrawal and transfer records here.
                  </AlertDescription>
                </Alert>
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
                    ≈ ${formatCurrency(parseFloat(ethBalance) * ethPrice)}
                    {isPriceLoading && (
                      <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-muted-foreground/50" />
                    )}
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