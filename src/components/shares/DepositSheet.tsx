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
import { Copy, Check, QrCode, Loader2, Wallet } from 'lucide-react';
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

interface DepositSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEmbedded?: boolean;
}

export const DepositSheet = ({
  open,
  onOpenChange,
  isEmbedded = false,
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
