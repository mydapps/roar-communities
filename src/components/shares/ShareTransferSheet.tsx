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
import { Check, ChevronsUpDown, Send, Loader2 } from 'lucide-react';
import { CommunityPortfolioItem, transferShares, searchUsers } from '@/utils/communityApi';
import confetti from 'canvas-confetti';

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
  const isMobile = useIsMobile();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formSchema = z.object({
    recipient: z.string().min(1, 'Recipient is required').refine(
      (value) => isEthereumAddress(value) || isUserHandle(value) || selectedUser !== null,
      { 
        message: 'Invalid Ethereum address or username',
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

    // Only search if the input looks like a username (not an ETH address)
    if (watchedRecipient && !isEthereumAddress(watchedRecipient) && watchedRecipient.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await searchUsers(watchedRecipient);
          if (result.success && result.users) {
            setUserSuggestions(result.users.items);
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
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [watchedRecipient]);

  const selectUser = (user: UserSuggestion) => {
    setSelectedUser(user);
    form.setValue('recipient', user.handle);
    setOpenSuggestions(false);
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setPreviewOpen(true);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleConfirmTransaction = async () => {
    if (!community) return;
    
    setIsLoading(true);
    
    try {
      const formValues = form.getValues();
      const result = await transferShares(
        community.community, 
        formValues.amount, 
        formValues.recipient
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
            description: `You've transferred ${formValues.amount} shares of ${community.community} to ${formValues.recipient}`
          });
          
          // Call success callback if provided
          if (onTransferSuccess) {
            onTransferSuccess();
          }
        }, 2000);
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
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransferForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="recipient"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Recipient</FormLabel>
              <Popover open={openSuggestions && userSuggestions.length > 0} onOpenChange={setOpenSuggestions}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <div className="flex items-center relative">
                      <Input 
                        placeholder="0x... or username" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (selectedUser) {
                            setSelectedUser(null);
                          }
                        }}
                        className="flex-1 pr-10" 
                      />
                      {userSuggestions.length > 0 && (
                        <ChevronsUpDown className="h-4 w-4 absolute right-3 text-muted-foreground" />
                      )}
                    </div>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-full" align="start">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No results found</CommandEmpty>
                      <CommandGroup heading="Users">
                        {userSuggestions.map((user) => (
                          <CommandItem 
                            key={user.id} 
                            value={user.handle}
                            onSelect={() => selectUser(user)}
                            className="flex items-center gap-2 py-2"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar_url} alt={user.handle} />
                              <AvatarFallback>{user.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>@{user.handle}</span>
                            {selectedUser?.id === user.id && (
                              <Check className="h-4 w-4 ml-auto" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
              {selectedUser && (
                <div className="mt-2 p-2 bg-primary/10 rounded-md flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.handle} />
                    <AvatarFallback>{selectedUser.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">@{selectedUser.handle}</span>
                </div>
              )}
            </FormItem>
          )}
        />

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
              <div className="text-xs text-muted-foreground mt-1">
                Available: {community?.shares.toFixed(2) || 0} shares
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between items-center pt-4">
          <div>
            <div className="text-sm font-medium">Fee</div>
            <div className="text-sm text-muted-foreground">~0.0003 ETH</div>
          </div>
          <Button type="submit">Review Transfer</Button>
        </div>
      </form>
    </Form>
  );

  const renderPreviewContent = () => {
    const formValues = form.getValues();
    const displayRecipient = isEthereumAddress(formValues.recipient) 
      ? `${formValues.recipient.substring(0, 6)}...${formValues.recipient.substring(formValues.recipient.length - 4)}`
      : `@${formValues.recipient}`;
      
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Sending</span>
          <span className="font-medium">
            {formValues.amount} {community?.community} Shares
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">To</span>
          <div className="flex items-center gap-2">
            {selectedUser && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.handle} />
                <AvatarFallback>{selectedUser.handle.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <span className="font-medium">{displayRecipient}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Network Fee</span>
          <span className="font-medium">~0.0003 ETH</span>
        </div>
        
        <div className="flex justify-between items-center py-2 font-medium">
          <span>Total</span>
          <span>
            {formValues.amount} Shares + ~0.0003 ETH
          </span>
        </div>
      </div>
    );
  };

  const renderSuccessContent = () => {
    const formValues = form.getValues();
    const displayRecipient = isEthereumAddress(formValues.recipient) 
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

  // For mobile, use Drawer components
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>
              {showSuccess 
                ? "Transfer Successful" 
                : (previewOpen 
                  ? "Confirm Transfer" 
                  : `Transfer ${community?.community} Shares`)}
            </DrawerTitle>
            <DrawerDescription>
              {showSuccess 
                ? "Your shares have been transferred successfully"
                : (previewOpen 
                  ? "Review the details before confirming" 
                  : `Send your ${community?.community} shares to another user or wallet`)}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-8">
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
        </DrawerContent>
      </Drawer>
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