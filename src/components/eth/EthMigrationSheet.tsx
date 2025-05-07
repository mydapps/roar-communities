import React, { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, ArrowRight, CheckCircle, AlertCircle, Info, X, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

// Assuming formatNumber is available, e.g., from '@/utils/formatUtils'
// If not, a simple implementation is needed here or imported.
const formatNumber = (value: string | number | undefined, decimals: number = 6): string => {
  if (value === undefined || value === null) return Number(0).toFixed(decimals);
  const num = parseFloat(String(value));
  if (isNaN(num)) return Number(0).toFixed(decimals);
  return num.toFixed(decimals);
};

interface EthMigrationCheckData {
  success: boolean;
  ethereumBalance: string;
  baseBalance: string;
  address: string;
  canMigrate: boolean;
  migrationAmount?: string;
  estimatedGasFee?: string;
  reason?: string | null;
  chainId?: number;
  message?: string;
}

interface EstimateMigrationFeeResponse {
  success: boolean;
  address?: string;
  estimatedGasFee?: string;
  totalCost?: string;
  amountToMigrate?: string;
  currentBalance?: string;
  hasSufficientBalance?: boolean;
  gasPrice?: string;
  gasLimit?: string;
  message?: string;
  details?: {
    balance?: string;
    estimatedGasFee?: string;
    requiredBalance?: string;
  };
}

interface MigrateToBaseResponse {
  success: boolean;
  message?: string;
  transactionHash?: string;
  amount?: string;
  fromAddress?: string;
  toAddress?: string;
  blockNumber?: number;
  etherscanUrl?: string;
  basescanUrl?: string;
  estimatedTimeToComplete?: string;
  migrationId?: number;
  details?: {
    balance?: string;
    estimatedGasFee?: string;
    requiredBalance?: string;
  };
}

interface EthMigrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMigrationData: EthMigrationCheckData | null;
  onMigrationSuccess: () => void;
}

export const EthMigrationSheet: React.FC<EthMigrationSheetProps> = ({
  open,
  onOpenChange,
  initialMigrationData,
  onMigrationSuccess,
}) => {
  const isMobile = useIsMobile();

  const [step, setStep] = useState<'details' | 'confirming' | 'success' | 'error'>('details');
  const [feeEstimate, setFeeEstimate] = useState<EstimateMigrationFeeResponse | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrateToBaseResponse | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  const fetchFeeEstimate = useCallback(async () => {
    if (!initialMigrationData?.address || !initialMigrationData?.canMigrate) {
      setFeeError("Missing initial data to estimate fees.");
      return;
    }
    setIsLoadingFee(true);
    setFeeError(null);
    setFeeEstimate(null);

    try {
      const response = await fetch(`/api/estimate_migration_fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: initialMigrationData.address })
      });
      const data: EstimateMigrationFeeResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Network error estimating fees.');
      }

      if (data.success) {
        setFeeEstimate(data);
        if (!data.hasSufficientBalance) {
            setFeeError(data.message || "Insufficient balance for migration after gas fees.");
        }
      } else {
        let errorMsg = data.message || 'Failed to estimate migration fees.';
        if (data.details) {
            errorMsg = `${errorMsg} Balance: ${data.details?.balance} ETH, Required: ${data.details?.requiredBalance} ETH`;
        }
        setFeeError(errorMsg);
      }
    } catch (err: any) {
      console.error("Estimate migration fee error:", err);
      setFeeError(err.message || 'An unexpected error occurred while estimating fees.');
    } finally {
      setIsLoadingFee(false);
    }
  }, [initialMigrationData]);

  useEffect(() => {
    if (open && initialMigrationData?.canMigrate && step === 'details' && !feeEstimate && !isLoadingFee && !feeError) {
      fetchFeeEstimate();
    }
    if (!open) {
      setStep('details');
      setFeeEstimate(null);
      setIsLoadingFee(false);
      setFeeError(null);
      setIsMigrating(false);
      setMigrationResult(null);
      setMigrationError(null);
    }
  }, [open, initialMigrationData, step, feeEstimate, isLoadingFee, feeError, fetchFeeEstimate]);

  const handleConfirmMigration = async () => {
    if (!feeEstimate?.hasSufficientBalance || !initialMigrationData?.address || !feeEstimate?.amountToMigrate) {
        const errText = "Cannot proceed: Insufficient balance, missing data, or no amount to migrate.";
        setMigrationError(errText);
        toast.error(errText);
        setStep('error');
        return;
    }
    setIsMigrating(true);
    setMigrationError(null);
    setMigrationResult(null);
    setStep('confirming');

    try {
      const response = await fetch(`/api/migrate_to_base`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: initialMigrationData.address, amount: feeEstimate.amountToMigrate })
      });
      const data: MigrateToBaseResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Network error during migration.');
      }

      if (data.success) {
        setMigrationResult(data);
        setStep('success');
        toast.success(data.message || 'Migration initiated successfully!');
        onMigrationSuccess();
      } else {
        let errorMsg = data.message || 'Migration failed.';
        if (data.details) {
            errorMsg = `${errorMsg} Balance: ${data.details?.balance} ETH, Required: ${data.details?.requiredBalance} ETH`;
        }
        setMigrationError(errorMsg);
        setStep('error');
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error("Migrate to base error:", err);
      const errorText = err.message || 'An unexpected error occurred during migration.';
      setMigrationError(errorText);
      setStep('error');
      toast.error(errorText);
    } finally {
      setIsMigrating(false);
    }
  };
  
  const renderContent = () => {
    if (!initialMigrationData && open) {
      return (
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p>Loading migration data...</p>
        </div>
      );
    }

    if (isLoadingFee && step === 'details') {
      return (
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p>Estimating migration fees...</p>
        </div>
      );
    }

    if (step === 'details' || (step === 'error' && !migrationResult && feeError && !isMigrating)) {
      return (
        <div className="p-4 space-y-4">
          {initialMigrationData && (
            <div className="text-sm text-muted-foreground">
              You have <span className="font-semibold text-foreground">{initialMigrationData.ethereumBalance} ETH</span> on the Ethereum network.
              This process will help you transfer it to the Base network.
            </div>
          )}
          
          {feeError && (!feeEstimate || !feeEstimate.hasSufficientBalance) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fee Estimation Problem</AlertTitle>
              <AlertDescription>{feeError}</AlertDescription>
            </Alert>
          )}

          {feeEstimate && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg">Migration Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm pb-4">
                <div className="flex justify-between"><span>Amount to Migrate:</span> <span className="font-semibold">{formatNumber(feeEstimate.amountToMigrate)} ETH</span></div>
                <div className="flex justify-between"><span>Estimated Gas Fee (ETH):</span> <span className="font-semibold">{formatNumber(feeEstimate.estimatedGasFee)} ETH</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base"><span>Total Cost (ETH):</span> <span className="font-semibold">{formatNumber(feeEstimate.totalCost)} ETH</span></div>
                {feeEstimate.gasPrice && <div className="flex justify-between text-xs text-muted-foreground pt-1"><span>Est. Gas Price:</span> <span>{feeEstimate.gasPrice}</span></div>}
                {feeEstimate.gasLimit && <div className="flex justify-between text-xs text-muted-foreground"><span>Est. Gas Limit:</span> <span>{feeEstimate.gasLimit}</span></div>}
              </CardContent>
            </Card>
          )}
          
          {feeEstimate && !feeEstimate.hasSufficientBalance && step === 'details' && (
             <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5 text-yellow-700">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-700">Potentially Insufficient Balance</AlertTitle>
                <AlertDescription className="text-yellow-700/90">
                    The amount to migrate might be adjusted based on available balance after fees. 
                    Current Ethereum balance: {feeEstimate.currentBalance} ETH.
                    {feeEstimate.message && ` (${feeEstimate.message})`}
                </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleConfirmMigration} 
            disabled={isLoadingFee || isMigrating || !feeEstimate?.hasSufficientBalance || (!!feeError && !feeEstimate?.hasSufficientBalance) }
            className="w-full py-3 mt-2"
            size="lg"
          >
            {isMigrating || isLoadingFee ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ArrowRight className="h-5 w-5 mr-2" />}
            {isLoadingFee ? 'Estimating...' : isMigrating ? 'Processing...' : 'Proceed with Migration'}
          </Button>
        </div>
      );
    }

    if (step === 'confirming') {
        return (
          <div className="p-6 text-center flex flex-col items-center justify-center min-h-[250px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
            <p className="text-lg font-semibold">Initiating Migration...</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait. Do not close this window.</p>
          </div>
        );
    }
    
    if (step === 'success' && migrationResult) {
      return (
        <div className="p-4 space-y-4 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Migration Initiated!</h3>
          <p className="text-muted-foreground">
            {migrationResult.message || 'Your ETH transfer to Base has started.'}
          </p>
          <Card className="text-left text-sm bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between"><span>Amount:</span> <span className="font-semibold">{formatNumber(migrationResult.amount)} ETH</span></div>
              {migrationResult.transactionHash && 
                <div className="flex justify-between items-center"><span>Tx Hash:</span> 
                    <a href={migrationResult.etherscanUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        <Badge variant="outline" className="cursor-pointer hover:border-primary/70">
                            {migrationResult.transactionHash.substring(0,10)}...{migrationResult.transactionHash.substring(migrationResult.transactionHash.length - 8)}
                            <ExternalLink className="h-3 w-3 ml-1.5" />
                        </Badge>
                    </a>
                </div>
              }
              {migrationResult.estimatedTimeToComplete && <div className="flex justify-between"><span>Est. Time:</span> <span className="font-semibold">{migrationResult.estimatedTimeToComplete}</span></div>}
              {migrationResult.etherscanUrl && <a href={migrationResult.etherscanUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block text-center pt-2 text-xs">View on Etherscan <ExternalLink className="inline h-3 w-3 ml-0.5"/></a>}
              {migrationResult.basescanUrl && <a href={migrationResult.basescanUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block text-center text-xs">View on Basescan (when complete) <ExternalLink className="inline h-3 w-3 ml-0.5"/></a>}
            </CardContent>
          </Card>
          <DrawerClose asChild><Button className="w-full" size="lg">Done</Button></DrawerClose>
        </div>
      );
    }
    
    if (step === 'error' && (migrationError || (feeError && !isMigrating))) {
       return (
        <div className="p-4 space-y-4 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Migration Problem</h3>
          <p className="text-destructive/90">
            {migrationError || feeError || 'An unexpected error occurred.'}
          </p>
          {(migrationResult?.details || feeEstimate?.details) && (
            <Alert variant="destructive" className="text-left text-xs">
                <AlertTitle className="text-sm">Error Details</AlertTitle>
                <AlertDescription>
                {migrationError && migrationResult?.details && `Required: ${migrationResult.details.requiredBalance}, Balance: ${migrationResult.details.balance}`}
                {feeError && feeEstimate?.details && `Required: ${feeEstimate.details.requiredBalance}, Balance: ${feeEstimate.details.balance}`}
                </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2 pt-2">
            <DrawerClose asChild><Button variant="outline" className="w-full" size="lg">Close</Button></DrawerClose>
            <Button onClick={() => { setStep('details'); setFeeError(null); setMigrationError(null); fetchFeeEstimate(); }} className="w-full" size="lg">Try Again</Button>
          </div>
        </div>
      );
    }
    return null; 
  };
  
  const title =
    step === 'success' ? "Migration Successful" :
    step === 'error' ? "Migration Problem" :
    step === 'confirming' ? "Confirming Migration" :
    "Transfer ETH to Base";
  
  const description =
    step === 'success' ? migrationResult?.message || "Your funds are on the way to Base." :
    step === 'error' ? "There was an issue with your migration. Please review the details." :
    step === 'confirming' ? "Please wait while we process your request to move ETH.":
    "Review details and confirm to move your ETH from Ethereum to Base network.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="pb-2">
          <DrawerHeader className="text-left pt-4 pb-2">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 max-h-[70vh] overflow-y-auto">
            {renderContent()}
          </div>
          {step !== 'success' && step !== 'error' && step !== 'confirming' && (
            <DrawerFooter className="pt-2">
                <DrawerClose asChild><Button variant="outline" size="lg">Cancel</Button></DrawerClose>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader className="pt-2 pb-2">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex-grow overflow-y-auto py-2 pr-2 mr-[-6px]"> 
          {renderContent()}
        </div>
        {step !== 'success' && step !== 'error' && step !== 'confirming' && (
             <SheetFooter className="pt-4 pr-6 border-t">
                <SheetClose asChild><Button variant="outline" size="lg">Cancel</Button></SheetClose>
            </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}; 