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
  CommandInput,
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
import { Check, ChevronsUpDown, Send, Loader2, User, Wallet } from 'lucide-react';
import { CommunityPortfolioItem, transferShares, searchUsers } from '@/utils/communityApi';
import confetti from 'canvas-confetti';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const isEthereumAddress = (value: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
};

const isUserHandle = (value: string) => {
  return /^[a-zA-Z0-9_]{3,30}$/.test(value);
};

interface ShareTransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: CommunityPortfolioItem | null;
  onTransferSuccess?: () => void;
}

interface UserSuggestion {
  id: number;
  handle: string;
  avatar_url: string;
}

type TransferMethod = 'username' | 'wallet';

export const ShareTransferSheet = ({
  open,
  onOpenChange,
  community,
  onTransferSuccess
}: ShareTransferSheetProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [transferMethod, setTransferMethod] = useState<TransferMethod>('username');
  const isMobile = useIsMobile();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        return floatValue <= (community?.shares || 0);
      },
      { message: 'Amount exceeds available shares' }
    )
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: '',
      amount: '1',
    }
  });

  const watchedRecipient = form.watch('recipient');

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if in username mode and not already a valid ETH address
    if (transferMethod === 'username' && watchedRecipient && watchedRecipient.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await searchUsers(watchedRecipient);
          if (result.success && result.users) {
            setUserSuggestions(result.users.items);
            if (result.users.items.length > 0) {
              setOpenSuggestions(true);
            }
          } else {
            setUserSuggestions([]);
          }
        } catch (error) {
          console.error('Error searching users:', error);
          setUserSuggestions([]);
        }
      }, 300);
    } else {
      setUserSuggestions([]);
      setOpenSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [watchedRecipient, transferMethod]);

  // When transfer method changes, reset recipient field and selection
  useEffect(() => {
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

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (form.formState.isValid) {
      setPreviewOpen(true);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleConfirmTransaction = async () => {
    if (!community) return;
    
    setIsLoading(true);
    
    try {
      const formValues = form.getValues();
      
      // Format the recipient correctly for the API
      let toAddress = formValues.recipient;
      
      // For username transfers, prepend "user:" only if it's not already a wallet address
      // Also ensure username is lowercase
      if (transferMethod === 'username' && !isEthereumAddress(toAddress)) {
        toAddress = `user:${toAddress.toLowerCase()}`;
      }
      
      // For wallet addresses, keep the original case
      // Ethereum addresses are case-insensitive for validation but checksums use mixed case
      
      // Get community name and convert to lowercase
      const communityNameLower = community.community.toLowerCase();
      
      console.log(`Transferring ${formValues.amount} shares of ${communityNameLower} to ${toAddress}`);
      
      const result = await transferShares(
        communityNameLower, // Use lowercase community name
        formValues.amount, 
        toAddress // Use the correctly formatted address
      );
      
      if (result.success) {
        setPreviewOpen(false);
        setShowSuccess(true);
        triggerConfetti();
        
        // Show success for 2 seconds then close
        setTimeout(() => {
          setShowSuccess(false);
          onOpenChange(false);
          
          // Reset form
          form.reset();
          setSelectedUser(null);
          
          // Show toast
          toast.success("Transfer successful!", {
            description: `You've transferred ${formValues.amount} shares of ${community.community} to ${
              transferMethod === 'wallet' 
              ? `${formValues.recipient.substring(0, 6)}...${formValues.recipient.substring(formValues.recipient.length - 4)}`
              : `@${formValues.recipient}`
            }`
          });
          
          // Call success callback if provided
          if (onTransferSuccess) {
            onTransferSuccess();
          }
        }, 2500);
      } else {
        setPreviewOpen(false);
        toast.error("Transfer failed", {
          description: result.message || "An error occurred during the transfer"
        });
      }
    } catch (error) {
      console.error('Error confirming transfer:', error);
      toast.error("Transfer failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      setPreviewOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransferForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="username" value={transferMethod} onValueChange={(v) => setTransferMethod(v as TransferMethod)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Username
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Address
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="username" className="mt-0">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Username</FormLabel>
                  <div className="relative">
                    <Popover open={openSuggestions && userSuggestions.length > 0} onOpenChange={setOpenSuggestions}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <div className="flex items-center relative">
                            <Input 
                              placeholder="Enter username" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (selectedUser) {
                                  setSelectedUser(null);
                                }
                              }}
                              className="flex-1 pl-8 pr-10" 
                            />
                            <User className="h-4 w-4 absolute left-3 text-muted-foreground" />
                            {userSuggestions.length > 0 && (
                              <ChevronsUpDown className="h-4 w-4 absolute right-3 text-muted-foreground" />
                            )}
                          </div>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-full" align="start">
                        <Command>
                          <CommandList>
                            <CommandEmpty>No matching users found</CommandEmpty>
                            <CommandGroup heading="Matching Users">
                              {userSuggestions.map((user) => (
                                <CommandItem 
                                  key={user.id} 
                                  value={user.handle}
                                  onSelect={() => selectUser(user)}
                                  className="flex items-center gap-2 py-3 cursor-pointer"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar_url} alt={user.handle} />
                                    <AvatarFallback>{user.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium">@{user.handle}</span>
                                    <span className="text-xs text-muted-foreground">User #{user.id}</span>
                                  </div>
                                  {selectedUser?.id === user.id && (
                                    <Check className="h-4 w-4 ml-auto text-green-500" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                  {selectedUser && (
                    <div className="mt-2 p-3 bg-primary/10 rounded-md flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.handle} />
                        <AvatarFallback>{selectedUser.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">@{selectedUser.handle}</span>
                        <span className="text-xs text-muted-foreground">Selected recipient</span>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="wallet" className="mt-0">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ethereum Address</FormLabel>
                  <FormControl>
                    <div className="flex items-center relative">
                      <Input 
                        placeholder="0x..." 
                        {...field}
                        className="flex-1 pl-8" 
                      />
                      <Wallet className="h-4 w-4 absolute left-3 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (Shares)</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    max={community?.shares.toString()}
                    {...field}
                    className="flex-1" 
                  />
                </div>
              </FormControl>
              <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                <span>Available: {community?.shares.toFixed(2) || 0} shares</span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-xs text-primary"
                  onClick={() => form.setValue('amount', community?.shares.toString() || '0')}
                >
                  Max
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between items-center pt-4">
          <div>
            <div className="text-sm font-medium">Network Fee</div>
            <div className="text-sm text-muted-foreground">~0.0003 ETH</div>
          </div>
          <Button 
            type="submit" 
            className="px-6"
            disabled={!form.formState.isValid}
          >
            Review Transfer
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderPreviewContent = () => {
    const formValues = form.getValues();
    const displayRecipient = transferMethod === 'wallet'
      ? `${formValues.recipient.substring(0, 6)}...${formValues.recipient.substring(formValues.recipient.length - 4)}`
      : `@${formValues.recipient}`;
      
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-primary/5 p-4 border mb-4">
          <div className="text-center mb-3">
            <div className="font-medium text-sm text-muted-foreground">You're about to transfer</div>
            <div className="text-2xl font-bold mt-1">{formValues.amount} Shares</div>
            <div className="text-sm text-muted-foreground">{community?.community}</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-muted-foreground">Sending</span>
            <span className="font-medium">
              {formValues.amount} {community?.community} Shares
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
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-medium">~0.0003 ETH</span>
          </div>
          
          <div className="flex justify-between items-center py-3 font-medium">
            <span>Total</span>
            <span>
              {formValues.amount} Shares + ~0.0003 ETH
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessContent = () => {
    const formValues = form.getValues();
    const displayRecipient = transferMethod === 'wallet'
      ? `${formValues.recipient.substring(0, 6)}...${formValues.recipient.substring(formValues.recipient.length - 4)}`
      : `@${formValues.recipient}`;

    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="rounded-full bg-green-500/20 p-6 w-24 h-24 flex items-center justify-center mb-6">
          <Send className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Transfer Successful!</h2>
        <p className="text-muted-foreground mb-6">
          You've sent {formValues.amount} shares of {community?.community} to {displayRecipient}
        </p>
      </div>
    );
  };

  // For mobile, use Drawer component with adjusted height and scrollable content
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>Send Shares</DrawerTitle>
              <DrawerDescription>
                Send shares to another user or wallet
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              {previewOpen ? renderPreviewContent() : (showSuccess ? renderSuccessContent() : renderTransferForm())}
            </div>
            
            <DrawerFooter className="pt-2 sticky bottom-0 bg-background border-t">
              {previewOpen ? (
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    onClick={handleConfirmTransaction} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      'Confirm Transfer'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setPreviewOpen(false)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Go Back
                  </Button>
                </div>
              ) : (
                !showSuccess && (
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                )
              )}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // For desktop, use Sheet components
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {showSuccess 
              ? "Transfer Successful" 
              : (previewOpen 
                ? "Confirm Transfer" 
                : `Transfer ${community?.community} Shares`)}
          </SheetTitle>
          <SheetDescription>
            {showSuccess 
              ? "Your shares have been transferred successfully"
              : (previewOpen 
                ? "Review the details before confirming" 
                : `Send your ${community?.community} shares to another user or wallet`)}
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          {showSuccess 
            ? renderSuccessContent()
            : (previewOpen 
              ? (
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
                      onClick={() => setPreviewOpen(false)}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  </div>
                </>
              ) 
              : renderTransferForm())}
        </div>
        
        <SheetFooter className="pt-2">
          {!previewOpen && !showSuccess && (
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