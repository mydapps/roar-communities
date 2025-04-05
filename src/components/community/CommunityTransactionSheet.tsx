import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import confetti from 'canvas-confetti';
import { Badge } from '../ui/badge';
import { ethers } from 'ethers';

interface CommunityTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: 'initialize' | 'confirm' | 'complete';
  isLoading: boolean;
  communityName: string;
  communityHandle: string;
  isEncrypted: boolean;
  communityType: string;
  estimatedGasFee?: string;
  totalCost?: number;
  onConfirm: () => Promise<void>;
  onComplete?: () => void;
  txHash?: string | null;
  isAdvanced?: boolean;
  customTitle?: string;
  customDescription?: string;
}

export const CommunityTransactionSheet = ({
  open,
  onOpenChange,
  step,
  isLoading,
  communityName,
  communityHandle,
  isEncrypted,
  communityType,
  estimatedGasFee,
  totalCost,
  onConfirm,
  onComplete,
  txHash,
  isAdvanced = false,
  customTitle,
  customDescription,
}: CommunityTransactionSheetProps) => {
  const isMobile = useIsMobile();
  
  // Launch confetti when transaction is completed
  React.useEffect(() => {
    if (step === 'complete') {
      triggerSuccessAnimation();
    }
  }, [step]);

  const triggerSuccessAnimation = () => {
    if (typeof window !== 'undefined') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        
        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          particleCount: Math.floor(randomInRange(particleCount * 0.5, particleCount)),
          spread: randomInRange(50, 100),
          origin: { y: 0.6 },
          colors: ['#31bcc3', '#1d4ed8', '#7c3aed'],
        });
      }, 250);
    }
  };

  const handleDialogClose = () => {
    if (step === 'complete' && onComplete) {
      onComplete();
    }
    onOpenChange(false);
  };

  const Content = () => (
    <div className="px-4 pb-6 pt-2">
      {step === 'initialize' && (
        <div className="space-y-6">
          <div className="text-center pb-4">
            <div className="mx-auto flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-[#31bcc3]/10">
              <Sparkles className="h-8 w-8 text-[#31bcc3]" />
            </div>
            <h3 className="text-xl font-bold mb-2">{customTitle || "Transaction Approval"}</h3>
            <p className="text-sm text-muted-foreground">
              {customDescription || `You're about to create a new ${isAdvanced ? 'advanced' : communityType} community. Please review and approve the transaction details.`}
            </p>
          </div>
          
          <div className="space-y-4 bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Community Name</span>
              <span className="text-sm font-medium">{communityName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Community Handle</span>
              <span className="text-sm font-medium">dapps.co/c/{communityHandle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Privacy</span>
              <Badge variant="outline" className="text-xs">
                {isEncrypted ? 'Encrypted' : 'Public'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="outline" className="text-xs bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/30">
                {communityType.charAt(0).toUpperCase() + communityType.slice(1)}
                {isAdvanced && ' (Advanced)'}
              </Badge>
            </div>
          </div>
          
          {totalCost && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-lg">Transaction Cost</span>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  Hosted Wallet
                </Badge>
              </div>
              
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Community Creation Fee</span>
                  <span className="font-medium text-md">{totalCost} ETH</span>
                </div>
                
                {estimatedGasFee && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Gas Fee</span>
                    <span className="font-medium text-sm">{estimatedGasFee} ETH</span>
                  </div>
                )}
                
                <div className="border-t border-primary/10 pt-3 mt-1 flex justify-between">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold text-primary text-lg">{totalCost} ETH</span>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                <strong>Note:</strong> By confirming, you'll create your community and purchase its first share, establishing you as the founder. This transaction uses your hosted wallet with no additional connection needed.
              </div>
            </motion.div>
          )}
          
          <div className="flex justify-center pt-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full"
            >
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#31bcc3] to-primary text-white py-6 relative overflow-hidden font-bold text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Transaction
                    <ChevronRight className="ml-2 h-5 w-5" />
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                  </>
                )}
              </Button>
            </motion.div>
          </div>
          
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              By confirming this transaction, you're authorizing the creation of your community on the blockchain.
            </p>
          </div>
        </div>
      )}
      
      {step === 'confirm' && (
        <div className="space-y-6 text-center">
          <div className="pb-4">
            <div className="mx-auto flex items-center justify-center w-16 h-16 mb-6">
              <Loader2 className="h-8 w-8 text-[#31bcc3] animate-spin" />
            </div>
            <h3 className="text-xl font-bold mb-2">Processing Transaction</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your transaction is being processed. This should only take a moment.
            </p>
            
            <div className="space-y-2">
              <div className="flex gap-2 items-center justify-center py-2 px-3 bg-muted/50 rounded-lg mx-auto max-w-[280px]">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Transaction initiated</span>
              </div>
              <div className="flex gap-2 items-center justify-center py-2 px-3 bg-muted/50 rounded-lg mx-auto max-w-[280px]">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Transaction processing</span>
              </div>
              <div className="flex gap-2 items-center justify-center py-2 px-3 bg-muted/50 rounded-lg mx-auto max-w-[280px]">
                <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                <span className="text-xs text-muted-foreground">Community setup</span>
              </div>
            </div>
            
            <div className="mt-6 mb-3 p-4 bg-muted/30 rounded-lg border border-amber-200/20 text-center">
              <p className="text-sm text-amber-500">
                Please don't close this window until the transaction is complete
              </p>
            </div>
          </div>
        </div>
      )}
      
      {step === 'complete' && (
        <div className="space-y-6 text-center">
          <div className="pb-4">
            <div className="mx-auto flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-[#31bcc3]/10">
              <Check className="h-8 w-8 text-[#31bcc3]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Community Created!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your community has been successfully created and is now live.
            </p>
            
            {txHash && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2">Transaction Hash</p>
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50 overflow-hidden">
                  <p className="text-xs font-mono truncate">{txHash}</p>
                </div>
                <a 
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#31bcc3] hover:underline mt-2 inline-block"
                >
                  View on Etherscan
                </a>
              </div>
            )}
            
            <div className="flex justify-center pt-4">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full"
              >
                <Button
                  onClick={onComplete}
                  className="w-full bg-gradient-to-r from-[#31bcc3] to-primary text-white py-6"
                >
                  Go to Your Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return isMobile ? (
    <Drawer open={open} onOpenChange={handleDialogClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="text-center">
            {step === 'initialize' ? (customTitle || 'Review Transaction') : 
             step === 'confirm' ? 'Processing Transaction' : 
             'Community Created'}
          </DrawerTitle>
        </DrawerHeader>
        <Content />
      </DrawerContent>
    </Drawer>
  ) : (
    <Sheet open={open} onOpenChange={handleDialogClose}>
      <SheetContent className="sm:max-w-[425px] overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>
            {step === 'initialize' ? (customTitle || 'Review Transaction') : 
             step === 'confirm' ? 'Processing Transaction' : 
             'Community Created'}
          </SheetTitle>
        </SheetHeader>
        <Content />
      </SheetContent>
    </Sheet>
  );
}; 