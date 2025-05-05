import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Check, AlertCircle, ChevronRight, ExternalLink, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { estimateWithdrawalGas, withdrawAdminFees, WithdrawalGasEstimateResponse, AdminFeesWithdrawalResponse } from '@/utils/communityApi';
import { formatNumber } from '@/utils/formatUtils';

// Helper to get explorer URL
const getExplorerUrl = (txHash: string) => `https://basescan.org/tx/${txHash}`;

interface AdminFeesWithdrawalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityName: string;
  adminFeesBalance: number;
  ethToUsd: number; // For USD conversion
  onSuccess?: () => void; // Optional callback after successful withdrawal
}

type WithdrawalStep = 'estimate' | 'confirming' | 'complete' | 'error';

export const AdminFeesWithdrawalSheet: React.FC<AdminFeesWithdrawalSheetProps> = ({
  open,
  onOpenChange,
  communityName,
  adminFeesBalance,
  ethToUsd,
  onSuccess
}) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<WithdrawalStep>('estimate');
  const [isLoading, setIsLoading] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<WithdrawalGasEstimateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [withdrawnAmount, setWithdrawnAmount] = useState<number | null>(null);

  // Estimate USD value
  const estimateUsdValue = (ethValue: number | string): string => {
    const numericValue = typeof ethValue === 'string' ? parseFloat(ethValue) : ethValue;
    return (numericValue * ethToUsd).toFixed(2);
  };

  // Fetch gas estimate when sheet opens
  useEffect(() => {
    if (open && step === 'estimate') {
      fetchGasEstimate();
    }
  }, [open, communityName]);

  // Launch confetti on success
  useEffect(() => {
    if (step === 'complete') {
      triggerSuccessAnimation();
    }
  }, [step]);

  const fetchGasEstimate = async () => {
    if (!communityName) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await estimateWithdrawalGas(communityName);
      setGasEstimate(response);
      
      if (!response.success) {
        setErrorMessage(response.message || 'Failed to estimate gas fees.');
      }
    } catch (error: any) {
      console.error('Error estimating gas fees:', error);
      setErrorMessage(error.message || 'An error occurred while estimating gas fees.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (!communityName) return;
    
    setIsLoading(true);
    setStep('confirming');
    setErrorMessage(null);
    
    try {
      const response = await withdrawAdminFees(communityName);
      
      if (response.success) {
        setTxHash(response.transactionHash || null);
        setWithdrawnAmount(response.withdrawnAmount || 0);
        setStep('complete');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(response.message || 'Failed to process withdrawal.');
        setStep('error');
      }
    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      setErrorMessage(error.message || 'An error occurred during withdrawal.');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    // Only reset to estimate step if we're not in the complete state
    if (step !== 'complete') {
      setStep('estimate');
    }
    onOpenChange(false);
  };

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
          colors: ['#4f46e5', '#8b5cf6', '#3b82f6'], // Indigo, violet, blue colors
        });
      }, 250);
    }
  };

  const renderContent = () => {
    const netAmount = adminFeesBalance - (gasEstimate?.estimatedGasCostEth || 0);
    const isProfitable = netAmount > 0;

    switch (step) {
      case 'estimate':
        if (isLoading && !gasEstimate) {
          return (
            <div className="space-y-6 text-center py-10">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h3 className="text-xl font-bold">Fetching Details...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we estimate the withdrawal details.
              </p>
            </div>
          );
        }

        if (errorMessage) {
          return (
            <div className="space-y-6 text-center py-10">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-xl font-bold">Error Fetching Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {errorMessage}
              </p>
              <Button variant="outline" onClick={handleDialogClose} className="w-full mt-6">
                Close
              </Button>
            </div>
          );
        }

        if (!isProfitable) {
          return (
            <div className="space-y-6 text-center py-10">
              <AlertCircle className="mx-auto h-12 w-12 text-orange-500" />
              <h3 className="text-xl font-bold">Withdrawal Not Advised</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The estimated gas fee is higher than your available balance. Proceeding will result in a loss.
              </p>
              <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="font-medium">{formatNumber(adminFeesBalance)} ETH (~${estimateUsdValue(adminFeesBalance)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Gas Fee</span>
                  <span className="font-medium text-red-500">{formatNumber(gasEstimate?.estimatedGasCostEth || 0)} ETH (~${estimateUsdValue(gasEstimate?.estimatedGasCostEth || 0)})</span>
                </div>
                <div className="border-t border-border/20 pt-3 mt-2 flex justify-between text-red-600">
                  <span className="font-medium">Net Amount</span>
                  <span className="font-bold">{formatNumber(netAmount)} ETH</span>
                </div>
              </div>
              <Button variant="outline" onClick={handleDialogClose} className="w-full mt-6">
                Cancel
              </Button>
            </div>
          );
        }

        // Show profitable withdrawal estimate
        return (
          <div className="space-y-6">
            <div className="text-center pb-4">
              <div className="mx-auto flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Withdrawal</h3>
              <p className="text-sm text-muted-foreground">
                Review the details below to withdraw your admin earnings to your connected wallet.
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
                  Admin Earnings
                </Badge>
              </div>

              <div className="flex flex-col space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="font-medium">{formatNumber(adminFeesBalance)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground"></span>
                  <span className="text-xs text-muted-foreground">(~${estimateUsdValue(adminFeesBalance)})</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Gas Fee</span>
                  <span className="font-medium">{formatNumber(gasEstimate?.estimatedGasCostEth || 0)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground"></span>
                  <span className="text-xs text-muted-foreground">(~${estimateUsdValue(gasEstimate?.estimatedGasCostEth || 0)})</span>
                </div>

                <div className="border-t border-primary/10 pt-3 mt-2 flex justify-between">
                  <span className="font-medium">Net Withdrawal Amount</span>
                  <span className="font-bold text-primary text-lg">{formatNumber(netAmount)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium"></span>
                  <span className="text-sm text-primary">(~${estimateUsdValue(netAmount)})</span>
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
                  onClick={handleConfirmWithdrawal}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 relative overflow-hidden font-bold text-base"
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
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
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
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold">Withdrawal Successful!</h3>
            <p className="text-sm text-muted-foreground">
              Your admin earnings have been successfully withdrawn to your wallet.
            </p>
            
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50 text-left">
              <p className="text-sm font-medium mb-2">Transaction Details:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatNumber(withdrawnAmount || 0)} ETH</span>
                </div>
                {txHash && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/20">
                    <span className="text-muted-foreground">Transaction</span>
                    <a 
                      href={getExplorerUrl(txHash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1 hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <Button onClick={handleDialogClose} className="w-full mt-4">
              Close
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6 text-center py-10">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="text-xl font-bold">Withdrawal Failed</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {errorMessage || 'An error occurred during the withdrawal process. Please try again.'}
            </p>
            <div className="flex flex-col space-y-3">
              <Button onClick={fetchGasEstimate} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleDialogClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Generate title and description based on step
  const title = step === 'estimate' ? 'Withdraw Admin Earnings' :
                step === 'confirming' ? 'Processing Withdrawal' :
                step === 'complete' ? 'Withdrawal Complete' :
                step === 'error' ? 'Withdrawal Failed' : '';
                
  const description = step === 'estimate' ? 'Review and confirm your admin earnings withdrawal.' :
                      step === 'confirming' ? 'Processing your withdrawal transaction...' :
                      step === 'complete' ? 'Your funds are on their way!' :
                      step === 'error' ? 'Something went wrong during the withdrawal.' : '';

  // Render different components based on device
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
        <div className="py-4">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
}; 