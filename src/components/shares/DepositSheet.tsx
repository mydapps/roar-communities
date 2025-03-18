
import React, { useState } from 'react';
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
import { Copy, Check, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter
} from '@/components/ui/drawer';

interface DepositSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEmbedded?: boolean;
}

export const DepositSheet = ({
  open,
  onOpenChange,
  isEmbedded = false
}: DepositSheetProps) => {
  const [depositMethod, setDepositMethod] = useState<'base' | 'ethereum'>('base');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Mock wallet address
  const walletAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  // Mock deposit code
  const depositCode = '429871';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
    
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard"
    });
  };

  const renderDepositContent = () => (
    <div className="py-6">
      <Tabs defaultValue="base" onValueChange={(value) => setDepositMethod(value as 'base' | 'ethereum')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="base">Base Chain</TabsTrigger>
          <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
        </TabsList>
        
        <TabsContent value="base" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="border border-border p-4 rounded-md bg-muted/30">
                <QrCode className="h-40 w-40" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Your wallet address</div>
              <div className="flex items-center space-x-2">
                <div className="bg-muted p-3 rounded-md flex-1 text-xs sm:text-sm overflow-hidden text-ellipsis">
                  {walletAddress}
                </div>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={handleCopy}
                  className={cn(
                    "transition-all duration-300 ease-in-out",
                    copied && "bg-green-500 text-white"
                  )}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Send ETH to this address from any Base-enabled wallet.</p>
              <p className="mt-2">Deposits typically confirm within 30 seconds.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ethereum" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-mono font-bold tracking-wider bg-muted/50 py-2 px-6 rounded-md">
                    {depositCode.split('').map((digit, i) => (
                      <span key={i} className="mx-1">{digit}</span>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">Your deposit code</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to <span className="font-semibold">deposit.dapps.co</span></li>
                  <li>Enter your 6-digit code shown above</li>
                  <li>Complete the deposit process</li>
                </ol>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Deposits from Ethereum typically take 10-15 minutes to confirm.</p>
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
        <DrawerContent className="max-h-[85vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Deposit ETH</DrawerTitle>
            <DrawerDescription>
              Add ETH to your wallet to participate in communities
            </DrawerDescription>
          </DrawerHeader>
          
          {renderDepositContent()}
          
          <DrawerFooter>
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
        <SheetHeader>
          <SheetTitle>Deposit ETH</SheetTitle>
          <SheetDescription>
            Add ETH to your wallet to participate in communities
          </SheetDescription>
        </SheetHeader>
        
        {renderDepositContent()}
        
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
