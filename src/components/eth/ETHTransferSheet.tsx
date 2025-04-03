import React, { useState, useEffect, useRef } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter
} from '@/components/ui/drawer';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, ExternalLink, Loader2, RefreshCw, User, Wallet, Sparkles } from 'lucide-react';
import { 
  getETHWithdrawalGasEstimate, 
  withdrawETH, 
  searchUsers, 
  ETHGasEstimateResponse 
} from '@/utils/communityApi';
import confetti from 'canvas-confetti';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const isEthereumAddress = (value: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
};

const isUserHandle = (value: string) => {
  return /^[a-zA-Z0-9_]{3,30}$/.test(value);
};

interface ETHTransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: string;
  onTransferSuccess?: () => void;
}

interface UserSuggestion {
  id: number;
  handle: string;
  avatar_url: string;
}

type TransferMethod = 'username' | 'wallet';
type TransferStep = 'input' | 'estimation' | 'preview' | 'processing' | 'success';

export const ETHTransferSheet = ({
  open,
  onOpenChange,
  currentBalance = "0",
  onTransferSuccess
}: ETHTransferSheetProps) => {
  const [transferStep, setTransferStep] = useState<TransferStep>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<ETHGasEstimateResponse | null>(null);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [transferMethod, setTransferMethod] = useState<TransferMethod>('username');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Format the currentBalance to display 6 decimal places
  const displayBalance = parseFloat(currentBalance).toFixed(6);

  const formSchema = z.object({
    recipient: z.string().min(1, 'Recipient is required').refine(
      (value) => {
        // For wallet transfers, must be a valid ETH address
        if (transferMethod === 'wallet') {
          return isEthereumAddress(value);
        }
        // For username transfers, either a valid handle or a selected user is required
        return isUserHandle(value) || selectedUser !== null;
      },
      { 
        message: transferMethod === 'wallet' 
          ? 'Enter a valid Ethereum address' 
          : 'Enter a valid username'
      }
    ),
    amount: z.string().refine(
      (value) => {
        const floatValue = parseFloat(value);
        return !isNaN(floatValue) && floatValue > 0;
      },
      { message: 'Amount must be greater than 0' }
    ).refine(
      (value) => {
        const floatValue = parseFloat(value);
        // Check if the amount is less than or equal to the current balance
        // Use a small buffer (0.0001) to account for gas fees
        return floatValue <= (parseFloat(currentBalance) - 0.0001);
      },
      { message: 'Amount exceeds available balance' }
    )
  });

  type TransferFormValues = z.infer<typeof formSchema>;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: '',
      amount: '',
    }
  });

  const watchedRecipient = form.watch('recipient');
  const watchedAmount = form.watch('amount');

  // Reset the flow when the modal is closed
  useEffect(() => {
    if (!open) {
      setTransferStep('input');
      setGasEstimate(null);
      form.reset();
      setSelectedUser(null);
      // Reset to username tab as default
      setTransferMethod('username');
    }
  }, [open, form]);

  // Reference for detecting clicks outside the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle user search for username transfers
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if in username mode and has at least 2 characters
    if (transferMethod === 'username' && watchedRecipient && watchedRecipient.length >= 2) {
      // Show loading state immediately
      setOpenSuggestions(true);
      setIsSearching(true);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          console.log(`Searching for users with query: ${watchedRecipient}`);
          const result = await searchUsers(watchedRecipient);
          console.log('User search result:', result);
          
          if (result.success && result.users && result.users.items.length > 0) {
            setUserSuggestions(result.users.items);
            setOpenSuggestions(true); // Ensure dropdown stays open
          } else {
            setUserSuggestions([]);
            // Keep it open to show "No users found"
            setOpenSuggestions(watchedRecipient.length >= 2);
          }
        } catch (error) {
          console.error('Error searching users:', error);
          setUserSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setUserSuggestions([]);
      setOpenSuggestions(false);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [watchedRecipient, transferMethod]);

  // When transfer method changes, reset recipient field and selection
  useEffect(() => {
    console.log(`Transfer method changed to: ${transferMethod}`);
    form.setValue('recipient', '');
    form.clearErrors('recipient');
    setSelectedUser(null);
  }, [transferMethod, form]);

  const selectUser = (user: UserSuggestion) => {
    setSelectedUser(user);
    form.setValue('recipient', user.handle);
    form.clearErrors('recipient');
    setOpenSuggestions(false);
  };

  const onSubmit = async (data: TransferFormValues) => {
    console.log('Form submitted with:', { ...data, transferMethod });
    setIsLoading(true);
    
    try {
      const formValues = form.getValues();
      setTransferStep('estimation');
      
      // Clean recipient for wallet addresses (remove spaces, etc)
      if (transferMethod === 'wallet') {
        form.setValue('recipient', formValues.recipient.trim());
      }
      
      // Estimate gas fee for the transaction
      const recipient = formValues.recipient;
      const amount = formValues.amount;
      const isAddress = transferMethod === 'wallet';
      
      console.log('Estimating gas for transfer:', {
        recipient,
        amount,
        isAddress,
        transferMethod
      });
      
      try {
        const gasEstimate = await getETHWithdrawalGasEstimate(
          amount, 
          recipient,
          isAddress
        );
        console.log('Gas estimate result:', gasEstimate);
        
        if (gasEstimate.success) {
          setGasEstimate(gasEstimate);
          setTransferStep('preview');
        } else {
          toast.error("Failed to estimate gas", {
            description: gasEstimate.message || "An error occurred while estimating gas"
          });
        }
      } catch (error) {
        console.error('Error estimating gas:', error);
        toast.error("Failed to estimate gas", {
          description: error instanceof Error ? error.message : "An unexpected error occurred"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh the gas estimate
  const refreshGasEstimate = async () => {
    if (form.formState.isValid) {
      const values = form.getValues();
      const isAddress = transferMethod === 'wallet';
      
      try {
        setIsLoading(true);
        const estimate = await getETHWithdrawalGasEstimate(
          values.amount, 
          values.recipient,
          isAddress
        );
        
        if (estimate.success) {
          setGasEstimate(estimate);
          toast.success("Gas estimate updated");
        } else {
          toast.error("Failed to update gas estimate", {
            description: estimate.message
          });
        }
      } catch (error) {
        console.error('Error refreshing gas estimate:', error);
        toast.error("Failed to update gas estimate", {
          description: error instanceof Error ? error.message : "An unexpected error occurred"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Trigger confetti animation on successful transfer
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#87CEEB']
    });
  };

  const handleConfirmTransaction = async () => {
    setTransferStep('processing');
    setIsLoading(true);
    
    try {
      const values = form.getValues();
      const isAddress = transferMethod === 'wallet';
      
      console.log('Starting ETH transfer with:', {
        transferMethod,
        isAddress,
        amount: values.amount,
        recipient: values.recipient
      });
      
      const result = await withdrawETH(
        values.amount, 
        values.recipient,
        isAddress
      );
      
      console.log('ETH transfer result:', result);
      
      if (result.success && result.transaction) {
        setTransactionHash(result.transaction.hash);
        setTransferStep('success');
        triggerConfetti();
        
        // Show success for 3 seconds then close
        setTimeout(() => {
          onOpenChange(false);
          
          // Reset form
          form.reset();
          setSelectedUser(null);
          setTransferStep('input');
          
          // Show toast
          toast.success("ETH transferred successfully!", {
            description: `You've sent ${values.amount} ETH to ${
              transferMethod === 'wallet' 
              ? `${values.recipient.substring(0, 6)}...${values.recipient.substring(values.recipient.length - 4)}`
              : `@${values.recipient}`
            }`
          });
          
          // Call success callback if provided
          if (onTransferSuccess) {
            onTransferSuccess();
          }
        }, 3000);
      } else {
        setTransferStep('preview'); // Go back to preview on error
        toast.error("Transfer failed", {
          description: result.message || "An error occurred during the transfer"
        });
      }
    } catch (error) {
      console.error('Error confirming transfer:', error);
      toast.error("Transfer failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      setTransferStep('preview'); // Go back to preview on error
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransferForm = () => (
    <div className="space-y-6 py-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base">Send To</FormLabel>
                    <Tabs 
                      value={transferMethod}
                      onValueChange={(value) => {
                        setTransferMethod(value as 'username' | 'wallet');
                        console.log('Tab changed to:', value);
                      }}
                      className="h-8"
                    >
                      <TabsList className="grid w-[180px] grid-cols-2">
                        <TabsTrigger value="username">Username</TabsTrigger>
                        <TabsTrigger value="wallet">Wallet</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  <div className="relative">
                    <FormControl>
                      {transferMethod === 'username' ? (
                        <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <span className="text-muted-foreground">@</span>
                          <input
                            {...field}
                            placeholder="username"
                            className="flex-1 border-0 bg-transparent outline-none focus:outline-none focus:ring-0 px-1 placeholder:text-muted-foreground"
                            onFocus={() => {
                              if (field.value.length >= 2) {
                                setOpenSuggestions(true);
                              }
                            }}
                            onBlur={(e) => {
                              // Don't close if clicking on dropdown options
                              if (!dropdownRef.current?.contains(e.relatedTarget)) {
                                // Add a delay to allow clicks on dropdown options to register
                                setTimeout(() => {
                                  if (!document.activeElement || document.activeElement === document.body) {
                                    setOpenSuggestions(false);
                                  }
                                }, 200);
                              }
                            }}
                          />
                          {selectedUser && (
                            <Avatar className="h-6 w-6 ml-1">
                              <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.handle} />
                              <AvatarFallback>{selectedUser.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ) : (
                        <Input 
                          {...field} 
                          placeholder="0x..." 
                          className="font-mono"
                        />
                      )}
                    </FormControl>
                    
                    {/* User suggestion dropdown for username mode - using a simpler dropdown approach */}
                    {transferMethod === 'username' && openSuggestions && (
                      <div className="relative z-50" ref={dropdownRef}>
                        <div className="absolute top-1 left-0 right-0 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                          <div className="max-h-[200px] overflow-y-auto py-1">
                            {isSearching ? (
                              <div className="flex items-center justify-center py-4 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Searching...</span>
                              </div>
                            ) : (
                              <>
                                {userSuggestions.length === 0 ? (
                                  <div className="py-3 px-4 text-center text-muted-foreground">
                                    <p>No users found</p>
                                    <p className="text-xs mt-1">Try a different username</p>
                                  </div>
                                ) : (
                                  <div className="py-1">
                                    {userSuggestions.map((user) => (
                                      <div
                                        key={user.id}
                                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50"
                                        onClick={() => {
                                          form.setValue('recipient', user.handle);
                                          setSelectedUser(user);
                                          setOpenSuggestions(false);
                                          console.log('Selected user:', user);
                                        }}
                                      >
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={user.avatar_url} alt={user.handle} />
                                          <AvatarFallback>{user.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span>@{user.handle}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base">Amount</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Balance: {displayBalance} ETH
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.000001"
                          min="0.000001"
                          max={currentBalance}
                          placeholder="0.00" 
                          className="pr-16"
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        className="h-10"
                        onClick={() => form.setValue('amount', currentBalance)}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : "Continue"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  const renderEstimationContent = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center">
        <h3 className="text-lg font-medium">Estimating Gas Fees</h3>
        <p className="text-muted-foreground mt-1">
          Please wait while we calculate the gas required for your transfer
        </p>
      </div>
      <div className="w-full max-w-xs space-y-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  );

  const renderPreviewContent = () => {
    const formValues = form.getValues();
    const displayRecipient = transferMethod === 'wallet'
      ? `${formValues.recipient.substring(0, 6)}...${formValues.recipient.substring(formValues.recipient.length - 4)}`
      : `@${formValues.recipient}`;
    
    // Format numbers for display
    const amountValue = parseFloat(formValues.amount);
    const gasValue = gasEstimate?.estimatedGasFee ? parseFloat(gasEstimate.estimatedGasFee) : 0;
    const totalValue = amountValue + gasValue;
    
    console.log('Rendering preview with:', { 
      transferMethod, 
      recipient: formValues.recipient,
      displayRecipient,
      amountValue,
      gasValue
    });
    
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-primary/5 p-4 border mb-4">
          <div className="text-center mb-3">
            <div className="font-medium text-sm text-muted-foreground">You're about to send</div>
            <div className="text-2xl font-bold mt-1">{amountValue.toFixed(6)} ETH</div>
            <div className="text-sm text-muted-foreground mt-1">≈ ${(amountValue * 3000).toFixed(2)} USD</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-muted-foreground">Sending</span>
            <span className="font-medium">
              {amountValue.toFixed(6)} ETH
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-muted-foreground">To</span>
            <div className="flex items-center gap-2">
              {selectedUser && transferMethod === 'username' && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.handle} />
                  <AvatarFallback>{selectedUser.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              {transferMethod === 'wallet' && <Wallet className="h-4 w-4" />}
              <span className="font-medium">{displayRecipient}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Network Fee</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={refreshGasEstimate}
                disabled={isLoading}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <span className="font-medium">{gasValue.toFixed(9)} ETH</span>
          </div>
          
          <div className="flex justify-between items-center py-3 font-medium">
            <span>Total</span>
            <span>
              {totalValue.toFixed(6)} ETH
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground mt-3">
            <div className="flex justify-between">
              <span>Current Balance:</span>
              <span>{displayBalance} ETH</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Remaining After Transfer:</span>
              <span>{(parseFloat(currentBalance) - totalValue).toFixed(6)} ETH</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProcessingContent = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center">
        <h3 className="text-lg font-medium">Processing Transfer</h3>
        <p className="text-muted-foreground mt-1">
          Please wait while your transaction is being processed
        </p>
      </div>
    </div>
  );

  const renderSuccessContent = () => {
    const formValues = form.getValues();
    const displayRecipient = transferMethod === 'wallet'
      ? `${formValues.recipient.substring(0, 6)}...${formValues.recipient.substring(formValues.recipient.length - 4)}`
      : `@${formValues.recipient}`;

    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <div className="rounded-full bg-green-500/20 p-6 w-24 h-24 flex items-center justify-center mb-6">
          <Sparkles className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Transfer Successful!</h2>
        <p className="text-muted-foreground mb-6">
          You've sent {formValues.amount} ETH to {displayRecipient}
        </p>
        
        {transactionHash && (
          <a 
            href={`https://etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline text-sm"
          >
            View on Etherscan
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  };

  // Helper function to determine the title and description based on the current step
  const getHeaderContent = () => {
    switch (transferStep) {
      case 'estimation':
        return {
          title: "Estimating Gas",
          description: "Calculating the network fee for your transfer"
        };
      case 'preview':
        return {
          title: "Confirm Transfer",
          description: "Review the details before sending your ETH"
        };
      case 'processing':
        return {
          title: "Processing",
          description: "Your transfer is being processed"
        };
      case 'success':
        return {
          title: "Transfer Complete",
          description: "Your ETH has been sent successfully"
        };
      default:
        return {
          title: "Transfer ETH",
          description: "Send your ETH to another user or wallet"
        };
    }
  };

  const { title, description } = getHeaderContent();

  // For mobile, use Drawer components
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-8">
            {transferStep === 'input' && renderTransferForm()}
            {transferStep === 'estimation' && renderEstimationContent()}
            {transferStep === 'preview' && (
              <>
                {renderPreviewContent()}
                <div className="mt-8 space-y-4">
                  <Button 
                    className="w-full py-3"
                    variant="default"
                    onClick={handleConfirmTransaction}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : "Confirm Transfer"}
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    onClick={() => setTransferStep('input')}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
              </>
            )}
            {transferStep === 'processing' && renderProcessingContent()}
            {transferStep === 'success' && renderSuccessContent()}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // For desktop, use Sheet components
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          {transferStep === 'input' && renderTransferForm()}
          {transferStep === 'estimation' && renderEstimationContent()}
          {transferStep === 'preview' && (
            <>
              {renderPreviewContent()}
              <div className="mt-8 space-y-4">
                <Button 
                  className="w-full py-3"
                  variant="default"
                  onClick={handleConfirmTransaction}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : "Confirm Transfer"}
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => setTransferStep('input')}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>
            </>
          )}
          {transferStep === 'processing' && renderProcessingContent()}
          {transferStep === 'success' && renderSuccessContent()}
        </div>
        
        <SheetFooter className="pt-2">
          {transferStep === 'input' && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};