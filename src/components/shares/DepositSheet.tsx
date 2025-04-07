import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Copy, Check, QrCode, Loader2, Droplet, Clock, Wallet } from 'lucide-react';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger
} from '@/components/ui/drawer';
import { createAuthHeaders } from '@/utils/apiBase';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// New component for claiming testnet ETH
export const ClaimFaucetButton = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastClaimed, setLastClaimed] = useState<null | number>(null);
  const [timeLeft, setTimeLeft] = useState<null | number>(null);
  
  // Function to check if user has claimed recently
  useEffect(() => {
    const lastClaimedTime = localStorage.getItem('dapps_last_faucet_claim');
    if (lastClaimedTime) {
      const lastTime = parseInt(lastClaimedTime);
      setLastClaimed(lastTime);
      
      // Calculate time left for next claim
      const calculateTimeLeft = () => {
        const now = Date.now();
        const nextClaimTime = lastTime + 24 * 60 * 60 * 1000; // 24 hours in ms
        const diff = nextClaimTime - now;
        
        if (diff <= 0) {
          setTimeLeft(0);
          setLastClaimed(null);
          localStorage.removeItem('dapps_last_faucet_claim');
        } else {
          setTimeLeft(diff);
        }
      };
      
      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      
      return () => clearInterval(timer);
    }
  }, []);
  
  const handleClaimETH = async () => {
    setIsClaiming(true);
    
    try {
      const headers = createAuthHeaders(false);
      // Get user key directly from localStorage to ensure it's included
      const userKey = localStorage.getItem('dapps_user_key');
      
      if (!userKey) {
        throw new Error("Authentication required. Please log in.");
      }
      
      const response = await fetch("https://api.dapps.co/claim_deposit_faucet", {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'x-user-key': userKey
        }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Faucet claim error:', errorData);
        
        if (response.status === 401) {
          throw new Error("Authentication required. Please refresh and try again.");
        }
        
        if (response.status === 429) {
          // Handle rate limiting - likely due to claiming too frequently
          const now = Date.now();
          localStorage.setItem('dapps_last_faucet_claim', now.toString());
          setLastClaimed(now);
          throw new Error("You can only claim once every 24 hours.");
        }
        
        throw new Error("Failed to claim testnet ETH.");
      }
      
      try {
        const data = await response.json();
        if (data.success) {
          toast.success(data.message || "Successfully claimed testnet ETH!");
        } else {
          // If the API returns success: false but still returns
          if (data.message && data.message.includes("Last claimed")) {
            const hoursAgoMatch = data.message.match(/Last claimed (\d+) hours ago/);
            if (hoursAgoMatch && hoursAgoMatch[1]) {
              const hoursAgo = parseInt(hoursAgoMatch[1]);
              const lastClaimTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
              localStorage.setItem('dapps_last_faucet_claim', lastClaimTime.toString());
              setLastClaimed(lastClaimTime);
            }
            throw new Error(data.message);
          } else {
            throw new Error(data.message || "Failed to claim testnet ETH");
          }
        }
        
        // Save claim time to localStorage
        const now = Date.now();
        localStorage.setItem('dapps_last_faucet_claim', now.toString());
        setLastClaimed(now);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // If we can't parse the response but the HTTP status was success, show a generic success message
        if (response.ok) {
          toast.success("Request successful! Your ETH should arrive shortly.");
          const now = Date.now();
          localStorage.setItem('dapps_last_faucet_claim', now.toString());
          setLastClaimed(now);
          if (onSuccess) onSuccess();
        } else {
          throw new Error("Failed to process server response");
        }
      }
    } catch (error) {
      console.error('Error claiming testnet ETH:', error);
      toast.error(error instanceof Error ? error.message : "Failed to claim testnet ETH. Please try again later.");
    } finally {
      setIsClaiming(false);
    }
  };
  
  // Format time left for display
  const formatTimeLeft = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };
  
  // Calculate progress percentage for cooldown
  const getProgress = () => {
    if (!lastClaimed || !timeLeft) return 100;
    const totalTime = 24 * 60 * 60 * 1000; // 24 hours
    const elapsed = totalTime - timeLeft;
    return Math.min(100, Math.floor((elapsed / totalTime) * 100));
  };
  
  return (
    <div className="relative w-full mt-3 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
              <Droplet className="h-3 w-3 mr-1 text-blue-500" />
              Testnet
            </Badge>
            <h3 className="font-medium">Free Testnet ETH</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {timeLeft && timeLeft > 0 ? "Next claim available in:" : "Claim free testnet ETH for testing"}
          </p>
          
          {timeLeft && timeLeft > 0 && (
            <div className="w-full mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatTimeLeft(timeLeft)}
                </span>
                <span className="text-muted-foreground">{getProgress()}%</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
            </div>
          )}
        </div>
        
        <Button
          onClick={handleClaimETH}
          disabled={isClaiming || (timeLeft !== null && timeLeft > 0)}
          className={cn(
            "whitespace-nowrap min-w-[120px]",
            timeLeft === null || timeLeft === 0 ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white" : ""
          )}
        >
          {isClaiming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Claiming...
            </>
          ) : timeLeft && timeLeft > 0 ? (
            "Cooldown Active"
          ) : (
            "Claim Free ETH"
          )}
        </Button>
      </div>
    </div>
  );
};

interface DepositSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEmbedded?: boolean;
  onFaucetSuccess?: () => void;
}

export const DepositSheet = ({
  open,
  onOpenChange,
  isEmbedded = false,
  onFaucetSuccess
}: DepositSheetProps) => {
  const [depositMethod, setDepositMethod] = useState<'base' | 'ethereum'>('base');
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  // Fetch wallet address from API
  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (open) {
        setIsLoading(true);
        try {
          const headers = createAuthHeaders(false);
          const response = await fetch("https://api.dapps.co/get_wallet_address", {
            method: 'GET',
            headers: headers
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.success && data.wallet) {
            setWalletAddress(data.wallet);
            if (data.qr_code) {
              setQrCodeData(data.qr_code);
            }
          } else {
            // Fallback to a default address if API fails
            setWalletAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
            console.error('Failed to fetch wallet address');
          }
        } catch (error) {
          console.error('Error fetching wallet address:', error);
          // Fallback
          setWalletAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchWalletAddress();
  }, [open]);

  // Mock deposit code (this can be replaced with an API call too if needed)
  const depositCode = '429871';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
    
    toast.success("Address copied", {
      description: "Wallet address copied to clipboard"
    });
  };

  const renderDepositContent = () => (
    <div className="py-4">
      <Tabs defaultValue="base" onValueChange={(value) => setDepositMethod(value as 'base' | 'ethereum')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="base">Base Chain</TabsTrigger>
          <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
        </TabsList>
        
        <TabsContent value="base" className="mt-2">
          <div className="space-y-5">
            <ClaimFaucetButton onSuccess={onFaucetSuccess} />
          
            <div className="flex justify-center my-6">
              <div className="border rounded-xl p-4 bg-white dark:bg-muted/30 shadow-sm">
                {isLoading ? (
                  <div className="h-48 w-48 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : qrCodeData ? (
                  <img src={qrCodeData} alt="Wallet QR Code" className="h-48 w-48 object-contain" />
                ) : (
                  <QrCode className="h-48 w-48 text-primary/80" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Your wallet address
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-muted p-3 rounded-lg flex-1 text-xs sm:text-sm font-mono overflow-hidden text-ellipsis">
                  {isLoading ? (
                    <div className="h-5 animate-pulse bg-muted-foreground/20 rounded w-full" />
                  ) : (
                    walletAddress
                  )}
                </div>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={handleCopy}
                  className={cn(
                    "transition-all duration-300 ease-in-out rounded-lg",
                    copied ? "bg-green-500 text-white" : ""
                  )}
                  disabled={isLoading}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="text-blue-500 text-base">•</span> 
                Send ETH to this address from any Base-enabled wallet
              </p>
              <p className="flex items-center gap-2 mt-2">
                <span className="text-blue-500 text-base">•</span> 
                Deposits typically confirm within 30 seconds
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ethereum" className="mt-2">
          <div className="space-y-5">
            <div className="flex justify-center my-6">
              <div className="flex flex-col items-center bg-white dark:bg-muted/30 p-6 rounded-xl border shadow-sm">
                <div className="text-center space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Your deposit code</h3>
                  <div className="text-3xl font-mono font-bold tracking-wider py-2 px-6 bg-muted/30 rounded-lg">
                    {depositCode.split('').map((digit, i) => (
                      <span key={i} className="mx-1">{digit}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border p-5 space-y-4">
              <h3 className="font-medium">How to Deposit</h3>
              <div className="text-sm">
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Go to <a href="https://deposit.dapps.co" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline hover:text-primary transition-colors">deposit.dapps.co</a> in your browser</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Enter your 6-digit code shown above</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Complete the deposit process on the website</span>
                  </li>
                </ol>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Deposits from Ethereum typically take 10-15 minutes to confirm.</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
  
  // If embedded in another component, just return the content
  if (isEmbedded) {
    return renderDepositContent();
  }

  // For mobile, use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Deposit ETH</DrawerTitle>
            <DrawerDescription>
              Add ETH to your wallet to participate in communities
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4">
            {renderDepositContent()}
          </div>
          
          <DrawerFooter className="pt-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // For desktop, use Sheet from right
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle>Deposit ETH</SheetTitle>
          <SheetDescription>
            Add ETH to your wallet to participate in communities
          </SheetDescription>
        </SheetHeader>
        
        <div className="pr-2">
          {renderDepositContent()}
        </div>
        
        <SheetFooter className="pt-2">
          <SheetClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
