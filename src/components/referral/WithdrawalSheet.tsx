import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle, ChevronRight, Sparkles, ExternalLink, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import confetti from 'canvas-confetti';
import { Badge } from '@/components/ui/badge'; // Adjusted import path
import { formatNumber } from '@/utils/formatUtils'; // Assuming a utility for formatting numbers exists or create one
import { ReferralGasEstimateResponse } from '@/utils/apiBase'; // Import the type

// Helper to get explorer URL (Replace with your actual explorer URL structure if different)
const getExplorerUrl = (txHash: string) => `https://etherscan.io/tx/${txHash}`;

interface WithdrawalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: 'estimate' | 'confirming' | 'complete' | 'error'; // Define steps for withdrawal
  isLoading: boolean; // General loading state (e.g., during API calls)
  withdrawalData: ReferralGasEstimateResponse | null; // Data from gas estimate API
  errorData?: { message?: string; details?: string }; // Error details
  txHash?: string | null; // Transaction hash on success
  onConfirm: () => Promise<void>; // Function to call when user confirms
  onClose?: () => void; // Optional callback when sheet closes
  estimateUsdValue: (ethValue: number | string) => string; // Function to estimate USD value, accept string
}

export const WithdrawalSheet = ({
  open,
  onOpenChange,
  step,
  isLoading,
  withdrawalData,
  errorData,
  txHash,
  onConfirm,
  onClose,
  estimateUsdValue,
}: WithdrawalSheetProps) => {
  const isMobile = useIsMobile();

  // Launch confetti when transaction is completed
  React.useEffect(() => {
    if (step === 'complete') {
      triggerSuccessAnimation();
    }
  }, [step]);

  const triggerSuccessAnimation = () => {
    // (Confetti logic copied from CommunityTransactionSheet - keep as is)
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
          colors: ['#31bcc3', '#10b981', '#f59e0b'], // Adjusted colors slightly
        });
      }, 250);
    }
  };

  const handleDialogClose = () => {
    if (onClose) {
      onClose();
    }
    onOpenChange(false);
  };

  const renderContent = () => {
    switch (step) {
      case 'estimate':
        if (isLoading && !withdrawalData) { // Show loading indicator only when fetching initially
          return (
             <div className="space-y-6 text-center py-10">
               <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#31bcc3]" />
               <h3 className="text-xl font-bold">Fetching Details...</h3>
               <p className="text-sm text-muted-foreground">
                 Please wait while we estimate the withdrawal details.
               </p>
             </div>
           );
        }

        if (!withdrawalData?.success || !withdrawalData.available_earnings || !withdrawalData.gas_cost_eth || !withdrawalData.net_amount) {
          // Show error state if data fetch failed or data is incomplete after loading
           return (
             <div className="space-y-6 text-center py-10">
               <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
               <h3 className="text-xl font-bold">Error Fetching Details</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 {withdrawalData?.message || 'Could not retrieve withdrawal information. Please try again later.'}
               </p>
                <Button variant="outline" onClick={handleDialogClose} className="w-full mt-6">
                  Close
                </Button>
             </div>
           );
        }

        // Check if withdrawal is profitable
        if (!withdrawalData.is_profitable) {
           return (
             <div className="space-y-6 text-center py-10">
               <AlertCircle className="mx-auto h-12 w-12 text-orange-500" />
               <h3 className="text-xl font-bold">Withdrawal Not Advised</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 The estimated gas fee is higher than your available earnings. Proceeding will result in a loss.
               </p>
               <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border/50 text-sm">
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Available Earnings</span>
                     <span className="font-medium">{formatNumber(withdrawalData.available_earnings)} ETH (~${estimateUsdValue(withdrawalData.available_earnings)})</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-muted-foreground">Estimated Gas Fee</span>
                     <span className="font-medium text-red-500">{formatNumber(withdrawalData.gas_cost_eth)} ETH (~${estimateUsdValue(withdrawalData.gas_cost_eth)})</span>
                  </div>
                   <div className="border-t border-border/20 pt-3 mt-2 flex justify-between text-red-600">
                     <span className="font-medium">Net Amount</span>
                     <span className="font-bold">{formatNumber(withdrawalData.net_amount)} ETH</span>
                   </div>
               </div>
                <Button variant="outline" onClick={handleDialogClose} className="w-full mt-6">
                  Cancel
                </Button>
             </div>
           );
        }

        // Profitable withdrawal estimate view
        return (
          <div className="space-y-6">
            <div className="text-center pb-4">
              <div className="mx-auto flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-[#31bcc3]/10">
                <Sparkles className="h-8 w-8 text-[#31bcc3]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Withdrawal</h3>
              <p className="text-sm text-muted-foreground">
                Review the details below to withdraw your referral earnings to your connected wallet.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-lg">Withdrawal Summary</span>
                 <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                   Referral Earnings
                 </Badge>
              </div>

              <div className="flex flex-col space-y-3 text-sm">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Available Earnings</span>
                   <span className="font-medium">{formatNumber(withdrawalData.available_earnings)} ETH</span>
                 </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground"></span>
                    <span className="text-xs text-muted-foreground">(~${estimateUsdValue(withdrawalData.available_earnings)})</span>
                  </div>

                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Estimated Gas Fee</span>
                   <span className="font-medium">{formatNumber(withdrawalData.gas_cost_eth)} ETH</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground"></span>
                    <span className="text-xs text-muted-foreground">(~${estimateUsdValue(withdrawalData.gas_cost_eth)})</span>
                  </div>

                 <div className="border-t border-primary/10 pt-3 mt-2 flex justify-between">
                   <span className="font-medium">Net Withdrawal Amount</span>
                   <span className="font-bold text-primary text-lg">{formatNumber(withdrawalData.net_amount)} ETH</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="font-medium"></span>
                    <span className="text-sm text-primary">(~${estimateUsdValue(withdrawalData.net_amount)})</span>
                  </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                <strong>Note:</strong> Gas fees are estimates and can fluctuate. The final withdrawn amount may vary slightly. Funds will be sent to your connected wallet address.
              </div>
            </motion.div>

             <div className="flex flex-col space-y-3 pt-4">
                <motion.div
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="w-full"
                 >
                  <Button
                    onClick={onConfirm} // Use the passed-in onConfirm directly
                    disabled={isLoading} // Disable button when parent indicates loading
                    className="w-full bg-gradient-to-r from-[#31bcc3] to-primary text-white py-4 relative overflow-hidden font-bold text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        Confirm & Withdraw
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
                 <Button variant="ghost" onClick={handleDialogClose} className="w-full text-muted-foreground">
                   Cancel
                 </Button>
             </div>
          </div>
        );

      case 'confirming':
        return (
          <div className="space-y-6 text-center py-10">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#31bcc3]" />
            <h3 className="text-xl font-bold">Processing Withdrawal...</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while your withdrawal is being processed on the blockchain. This may take a few moments. Do not close this window.
            </p>
             <div className="mt-4 text-xs text-muted-foreground">
               Submitting transaction...
             </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center py-10">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="mx-auto flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-green-100"
            >
              <Check className="h-8 w-8 text-green-600" />
            </motion.div>
            <h3 className="text-xl font-bold">Withdrawal Successful!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your referral earnings have been successfully withdrawn to your wallet.
            </p>

             {/* Use withdrawalData from props if available, it might contain the final amount */} 
             {withdrawalData?.net_amount && (
                <p className="text-lg font-medium">
                   Amount: {formatNumber(withdrawalData.net_amount)} ETH
                   <span className="text-sm text-muted-foreground"> (~${estimateUsdValue(withdrawalData.net_amount)})</span>
                </p>
             )}

            {txHash && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getExplorerUrl(txHash), '_blank')}
                className="mt-4"
              >
                View on Explorer
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
             <Button onClick={handleDialogClose} className="w-full mt-6 bg-gradient-to-r from-[#31bcc3] to-primary text-white">
               Done
             </Button>
          </div>
        );

       case 'error':
         return (
           <div className="space-y-6 text-center py-10">
             <motion.div
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ type: 'spring', stiffness: 300, damping: 15 }}
               className="mx-auto flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100"
             >
               <AlertCircle className="h-8 w-8 text-red-600" />
             </motion.div>
             <h3 className="text-xl font-bold">Withdrawal Failed</h3>
             <p className="text-sm text-red-600 mb-4">
               {errorData?.message || 'An unexpected error occurred.'}
             </p>
             {errorData?.details && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                   {errorData.details}
                </p>
             )}
              <Button variant="outline" onClick={handleDialogClose} className="w-full mt-6">
                Close
              </Button>
           </div>
         );

      default:
        return null;
    }
  };

  const title = step === 'complete' ? 'Withdrawal Successful' : step === 'error' ? 'Withdrawal Failed' : 'Withdraw Referral Earnings';
  const description = step === 'estimate' ? 'Review and confirm your earnings withdrawal.' :
                      step === 'confirming' ? 'Processing your transaction...' :
                      step === 'complete' ? 'Your funds are on their way!' :
                      step === 'error' ? 'Something went wrong during the withdrawal.' : '';

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleDialogClose}>
        <DrawerContent>
           <DrawerHeader className="text-left">
             <DrawerTitle>{title}</DrawerTitle>
             <DrawerDescription>{description}</DrawerDescription>
           </DrawerHeader>
           <div className="px-4 pb-6 pt-2">
             {renderContent()}
           </div>
           {/* <DrawerFooter className="pt-2">
             Optional footer buttons if needed outside content
           </DrawerFooter> */}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleDialogClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
         <div className="px-4 pb-6 pt-2">
           {renderContent()}
         </div>
         {/* Optional SheetFooter if needed */}
      </SheetContent>
    </Sheet>
  );
}; 