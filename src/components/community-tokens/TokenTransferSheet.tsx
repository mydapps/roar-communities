import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  SendHorizontal, 
  User, 
  Wallet, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Copy,
  ExternalLink,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { transferTokens, UserHolding } from '@/utils/communityTokensApi';
import { searchUsers, SearchUserItem } from '@/utils/searchApi';
import confetti from 'canvas-confetti';

interface TokenTransferSheetProps {
  isOpen: boolean;
  onClose: () => void;
  token: UserHolding;
  onTransferComplete?: () => void;
}

export function TokenTransferSheet({ 
  isOpen, 
  onClose, 
  token,
  onTransferComplete 
}: TokenTransferSheetProps) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientType, setRecipientType] = useState<'handle' | 'address'>('handle');
  const [isLoading, setIsLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    success: boolean;
    transactionHash?: string;
    message?: string;
  } | null>(null);

  // User search state
  const [userSuggestions, setUserSuggestions] = useState<SearchUserItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(-1);
  const [selectedUser, setSelectedUser] = useState<SearchUserItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Add body class when modal is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.classList.add('trading-modal-open');
    } else {
      document.body.classList.remove('trading-modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('trading-modal-open');
    };
  }, [isOpen, isMobile]);

  const handleClose = () => {
    setAmount('');
    setRecipient('');
    setRecipientType('handle');
    setTransferResult(null);
    setUserSuggestions([]);
    setShowSuggestions(false);
    setSelectedUserIndex(-1);
    setSelectedUser(null);
    onClose();
  };

  // Debounced user search
  const debouncedSearchUsers = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setUserSuggestions([]);
        setShowSuggestions(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await searchUsers(query, 1, 8); // Limit to 8 suggestions
        if (response.success && response.users?.items) {
          setUserSuggestions(response.users.items);
          setShowSuggestions(true);
        } else {
          setUserSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setUserSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Handle recipient input change
  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    setSelectedUserIndex(-1);
    
    if (recipientType === 'handle') {
      debouncedSearchUsers(value);
    }
  };

  // Handle user selection from dropdown
  const handleUserSelect = (user: SearchUserItem) => {
    setSelectedUser(user);
    setRecipient(user.handle);
    setShowSuggestions(false);
    setUserSuggestions([]);
    setSelectedUserIndex(-1);
  };

  // Handle removing selected user
  const handleRemoveUser = () => {
    setSelectedUser(null);
    setRecipient('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || userSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedUserIndex(prev => 
          prev < userSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedUserIndex(prev => 
          prev > 0 ? prev - 1 : userSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedUserIndex >= 0 && selectedUserIndex < userSuggestions.length) {
          handleUserSelect(userSuggestions[selectedUserIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedUserIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedUserIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simple debounce utility
  function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  const handleMaxClick = () => {
    setAmount(token.balance.toString());
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!amount || parseFloat(amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }
    
    if (parseFloat(amount) > token.balance) {
      errors.push('Amount exceeds available balance');
    }
    
    if (!recipient.trim()) {
      errors.push('Recipient is required');
    }
    
    if (recipientType === 'handle' && !recipient.match(/^[a-zA-Z0-9_]+$/)) {
      errors.push('Handle must contain only letters, numbers, and underscores');
    }
    
    if (recipientType === 'address' && !recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Invalid wallet address format');
    }
    
    return errors;
  };

  const handleTransfer = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await transferTokens({
        ticker: token.ticker,
        amount: parseFloat(amount),
        recipient: recipient.trim(),
        recipientType
      });

      if (result.success) {
        setTransferResult({
          success: true,
          transactionHash: result.data?.transactionHash,
          message: result.message
        });
        
        // Celebration animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        toast.success(`Successfully sent ${amount} ${token.ticker} tokens!`);
        
        // Call refresh callback
        onTransferComplete?.();
      } else {
        setTransferResult({
          success: false,
          message: result.error || 'Transfer failed'
        });
        toast.error(result.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferResult({
        success: false,
        message: 'Network error occurred'
      });
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const openTransaction = (hash: string) => {
    window.open(`https://basescan.org/tx/${hash}`, '_blank');
  };

  if (transferResult?.success) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Transfer Successful!
            </SheetTitle>
            <SheetDescription>
              Your tokens have been sent successfully
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Success Summary */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="text-center space-y-2">
                <div className="text-2xl">🎉</div>
                <div className="font-semibold text-green-800 dark:text-green-200">
                  {amount} {token.ticker} sent!
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  To: {recipientType === 'handle' ? `@${recipient}` : recipient}
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            {transferResult.transactionHash && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Transaction Hash</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-xs font-mono truncate">
                    {transferResult.transactionHash}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transferResult.transactionHash!)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openTransaction(transferResult.transactionHash!)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side={isMobile ? "bottom" : "right"} className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SendHorizontal className="w-5 h-5" />
            Send {token.ticker} Tokens
          </SheetTitle>
          <SheetDescription>
            Transfer your {token.givenName || token.name} tokens to another user or wallet
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Token Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {token.image ? (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={token.image} alt={token.givenName || token.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {token.ticker.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {token.ticker.slice(0, 2)}
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold">{token.givenName || token.name}</div>
                <div className="text-sm text-muted-foreground">
                  Balance: {token.balance.toLocaleString()} {token.ticker}
                </div>
              </div>
              <Badge variant={token.graduated ? "default" : "secondary"}>
                {token.graduated ? "Graduated" : "Incubation"}
              </Badge>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Send</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 px-2 text-xs"
                onClick={handleMaxClick}
              >
                MAX
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Available: {token.balance.toLocaleString()} {token.ticker}
            </div>
          </div>

          {/* Recipient Type */}
          <div className="space-y-2">
            <Label>Send To</Label>
            <Select value={recipientType} onValueChange={(value: 'handle' | 'address') => setRecipientType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="handle">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dapps User
                  </div>
                </SelectItem>
                <SelectItem value="address">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Wallet Address
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Input */}
          <div className="space-y-2">
            <Label htmlFor="recipient">
              {recipientType === 'handle' ? 'Dapps User' : 'Wallet Address'}
            </Label>
            
            {recipientType === 'handle' ? (
              <div className="space-y-3">
                {/* Selected User Card */}
                {selectedUser ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.handle} />
                      <AvatarFallback className="text-sm">
                        {selectedUser.handle.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">@{selectedUser.handle}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        @{selectedUser.handle}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveUser}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  /* Custom User Search Input with Dropdown */
                  <div className="relative">
                    <div className="relative">
                      <Input
                        ref={inputRef}
                        id="recipient"
                        placeholder="Search for a user..."
                        value={recipient}
                        onChange={(e) => handleRecipientChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {isSearching && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                
                {/* User Suggestions Dropdown */}
                {showSuggestions && userSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
                  >
                    {userSuggestions.map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted ${
                          index === selectedUserIndex ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleUserSelect(user)}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url} alt={user.handle} />
                          <AvatarFallback className="text-xs">
                            {user.handle.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">@{user.handle}</div>
                                                <div className="text-xs text-muted-foreground truncate">
                        @{user.handle}
                      </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground rotate-270" />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No results message */}
                {showSuggestions && userSuggestions.length === 0 && !isSearching && recipient.length >= 2 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg p-3"
                  >
                    <div className="text-sm text-muted-foreground text-center">
                      No users found for "{recipient}"
                    </div>
                  </div>
                )}
                  </div>
                )}
              </div>
            ) : (
              /* Regular Input for Wallet Address */
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
              />
            )}
            <div className="text-xs text-muted-foreground">
              {recipientType === 'handle' 
                ? 'Enter the username without the @ symbol'
                : 'Enter a valid Ethereum wallet address'
              }
            </div>
          </div>

          <Separator />

          {/* Transfer Summary */}
          {amount && recipient && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sending:</span>
                  <span className="font-medium">{amount} {token.ticker}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">
                    {recipientType === 'handle' ? `@${recipient}` : recipient}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee:</span>
                  <span className="font-medium">~$0.10</span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Token transfers are irreversible. Please double-check the recipient details before proceeding.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleTransfer} 
              disabled={isLoading || !amount || !recipient}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4 mr-2" />
                  Send Tokens
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


