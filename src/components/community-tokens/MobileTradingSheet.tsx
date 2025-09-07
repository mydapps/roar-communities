import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Wallet, ToggleLeft, ToggleRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileKeyboard from '@/components/ui/mobile-keyboard';
import TradeSuccessAnimation from '@/components/ui/trade-success-animation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  // Flat sale APIs
  getQuoteBuy, 
  buyToken, 
  getQuoteSell, 
  sellToken,
  // Post-graduation swap APIs
  quoteEthToToken,
  quoteTokenToEth,
  swapEthToToken,
  swapTokenToEth
} from '@/utils/communityTokensApi';
import { fetchEthPrice } from '@/utils/apiBase';

interface Token {
  id: number | string;
  name: string;
  symbol: string;
  image?: string;
  avatar?: string;
  status?: 'incubation' | 'graduated';
  graduated?: boolean;
  price?: number;
  currentPrice?: number;
  userHoldings?: number;
}

interface MobileTradingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  mode: 'buy' | 'sell';
  onTradeComplete?: () => void;
  userEthBalance?: string;
}

const MobileTradingSheet: React.FC<MobileTradingSheetProps> = ({
  isOpen,
  onClose,
  token,
  mode,
  onTradeComplete,
  userEthBalance
}) => {
  const [amount, setAmount] = useState('');
  const [isEthMode, setIsEthMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingEthPrice, setIsLoadingEthPrice] = useState(false);

  const [ethToUsd, setEthToUsd] = useState(3000);
  
  // Get real user balances
  const ethBalance = parseFloat(userEthBalance || "0");
  const userTokenBalance = token?.userHoldings || 0;

  // Fetch ETH price when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadEthPrice = async () => {
        try {
          setIsLoadingEthPrice(true);
          const priceData = await fetchEthPrice();
          if (priceData.success && priceData.data) {
            setEthToUsd(priceData.data.price);
          }
        } catch (error) {
          console.error('Failed to fetch ETH price:', error);
        } finally {
          setIsLoadingEthPrice(false);
        }
      };
      loadEthPrice();
    }
  }, [isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setIsEthMode(false);
      setShowSuccess(false);
      setIsProcessing(false);
      setQuote(null);
      setError(null);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyPress = (key: string) => {
    if (amount.length >= 10) return; // Prevent too long numbers
    
    if (key === '.' && amount.includes('.')) return; // Prevent multiple dots
    
    const newAmount = amount + key;
    setAmount(newAmount);
    
    // Check balance for sell mode
    if (mode === 'sell' && newAmount && parseFloat(newAmount) > 0) {
      const userTokenBalance = token?.userHoldings || 0;
      if (parseFloat(newAmount) > userTokenBalance) {
        setError(`Insufficient balance. You only have ${userTokenBalance.toLocaleString()} ${token.symbol || token.ticker}`);
        return;
      } else {
        setError(null);
      }
    }
    
    handleAmountChange(newAmount);
  };

  const handleBackspace = () => {
    const newAmount = amount.slice(0, -1);
    setAmount(newAmount);
    
    // Check balance for sell mode
    if (mode === 'sell' && newAmount && parseFloat(newAmount) > 0) {
      const userTokenBalance = token?.userHoldings || 0;
      if (parseFloat(newAmount) > userTokenBalance) {
        setError(`Insufficient balance. You only have ${userTokenBalance.toLocaleString()} ${token.symbol || token.ticker}`);
        return;
      } else {
        setError(null);
      }
    }
    
    handleAmountChange(newAmount);
  };

  const handleAmountChange = useCallback(async (value: string) => {
    if (!value || parseFloat(value) <= 0) {
      setQuote(null);
      setError(null);
      return;
    }

    try {
      setIsLoadingQuote(true);
      setError(null);
      
      const amountNum = parseFloat(value);
      const isGraduated = token.graduated || token.status === 'graduated';
      
      if (mode === 'buy') {
        // Convert USD to ETH if not in ETH mode
        const ethAmount = isEthMode ? amountNum : amountNum / ethToUsd;
        
        if (isGraduated) {
          // Use post-graduation swap API
          const response = await quoteEthToToken({
            ticker: token.symbol || token.ticker,
            ethAmount: ethAmount
          });
          
          if (response.success && response.data) {
            setQuote({
              type: 'swap',
              ethAmount: response.data.quote.ethAmountIn,
              tokenAmount: response.data.quote.estimatedTokensOut,
              priceImpact: response.data.quote.priceImpact,
              minimumTokensOut: response.data.quote.minimumTokensOut
            });
          } else {
            setError(response.error || 'Failed to get quote');
          }
        } else {
          // Use flat sale API
          const response = await getQuoteBuy({
            ticker: token.symbol || token.ticker,
            ethAmount: ethAmount
          });
          
          if (response.success && response.data) {
            setQuote({
              type: 'flat_sale',
              ethAmount: response.data.quote.ethAmount,
              tokenAmount: response.data.quote.tokensNet,
              feeTokens: response.data.quote.feeTokens,
              rate: response.data.quote.rate,
              feePercentage: response.data.quote.feePercentage
            });
          } else {
            setError(response.error || 'Failed to get quote');
          }
        }
      } else {
        // Sell mode
        if (isGraduated) {
          // Use post-graduation swap API
          const response = await quoteTokenToEth({
            ticker: token.symbol || token.ticker,
            tokenAmount: amountNum
          });
          
          if (response.success && response.data) {
            setQuote({
              type: 'swap',
              tokenAmount: response.data.quote.tokenAmountIn,
              ethAmount: response.data.quote.estimatedEthOut,
              priceImpact: response.data.quote.priceImpact,
              minimumEthOut: response.data.quote.minimumEthOut
            });
          } else {
            setError(response.error || 'Failed to get quote');
          }
        } else {
          // Use flat sale sell API
          const response = await getQuoteSell({
            ticker: token.symbol || token.ticker,
            tokenAmount: amountNum
          });
          
          if (response.success && response.data) {
            setQuote({
              type: 'flat_sale',
              tokenAmount: response.data.quote.tokenAmount,
              ethAmount: response.data.quote.ethNet,
              feeEth: response.data.quote.feeEth,
              rate: response.data.quote.rate,
              feePercentage: response.data.quote.feePercentage
            });
          } else {
            setError(response.error || 'Failed to get quote');
          }
        }
      }
    } catch (error) {
      console.error('Quote error:', error);
      setError('Failed to get quote');
    } finally {
      setIsLoadingQuote(false);
    }
  }, [token, mode, isEthMode, ethToUsd]);

  const handlePresetAmount = (value: string) => {
    let newAmount: string;
    if (mode === 'sell') {
      // Calculate percentage of token balance
      const percentage = parseFloat(value) / 100;
      newAmount = (userTokenBalance * percentage).toString();
    } else {
      newAmount = value;
    }
    setAmount(newAmount);
    handleAmountChange(newAmount);
  };

  const handleTrade = async () => {
    if (!token || !amount || parseFloat(amount) <= 0 || !quote) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);
    
    // Validate minimum amount for buy mode
    if (mode === 'buy') {
      const ethAmount = isEthMode ? amountNum : amountNum / ethToUsd;
      const minEthAmount = 0.0001;
      
      if (ethAmount < minEthAmount) {
        const minUsdAmount = (minEthAmount * ethToUsd).toFixed(2);
        const errorMessage = isEthMode 
          ? `Minimum purchase amount is ${minEthAmount} ETH`
          : `Minimum purchase amount is $${minUsdAmount} (${minEthAmount} ETH)`;
        toast.error(errorMessage);
        return;
      }
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Convert USD to ETH if not in ETH mode (for buy mode only)
      const ethAmount = (mode === 'buy' && !isEthMode) ? amountNum / ethToUsd : amountNum;
      const isGraduated = token.graduated || token.status === 'graduated';
      let response;

      if (mode === 'buy') {
        if (isGraduated) {
          // Use post-graduation swap API
          response = await swapEthToToken({
            ticker: token.symbol || token.ticker,
            ethAmount: ethAmount,
            slippageTolerance: 5 // 5% slippage tolerance
          });
        } else {
          // Use flat sale API
          response = await buyToken({
            ticker: token.symbol || token.ticker,
            ethAmount: ethAmount
          });
        }
      } else {
        // Sell mode
        if (isGraduated) {
          // Use post-graduation swap API
          response = await swapTokenToEth({
            ticker: token.symbol || token.ticker,
            tokenAmount: amountNum,
            slippageTolerance: 5 // 5% slippage tolerance
          });
        } else {
          // Use flat sale sell API
          response = await sellToken({
            ticker: token.symbol || token.ticker,
            tokenAmount: amountNum
          });
        }
      }

      if (response.success) {
        setShowSuccess(true);
        toast.success(`${mode === 'buy' ? 'Purchase' : 'Sale'} completed successfully!`);
        
        // Call onTradeComplete to refresh balances
        if (onTradeComplete) {
          onTradeComplete();
        }
        
        // Auto close after success animation
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 3000);
      } else {
        setError(response.error || `Failed to ${mode} tokens`);
        toast.error(response.error || `Failed to ${mode} tokens`);
      }
    } catch (error) {
      console.error('Trade error:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} tokens`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    onClose();
  };

  if (!token) return null;

  const presetAmounts = mode === 'sell' 
    ? ['25', '50', '75', '100'] // Percentage options for sell mode
    : isEthMode 
      ? ['0.001', '0.01', '0.1', '1']
      : ['1', '5', '20', '100'];

  const displayAmount = amount || '0';
  const numericAmount = parseFloat(displayAmount);
  const usdValue = isEthMode 
    ? (numericAmount * ethToUsd).toFixed(2)
    : displayAmount;
  const ethValue = isEthMode 
    ? displayAmount
    : (numericAmount / ethToUsd).toFixed(6);

  const canTrade = numericAmount > 0 && quote && !error && !isLoadingQuote &&
    (mode === 'buy' || (mode === 'sell' && token.userHoldings && numericAmount <= token.userHoldings));

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 h-[100vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-muted rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {token.image || token.avatar ? (
                      <img 
                        src={token.image || token.avatar} 
                        alt={token.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="text-lg font-semibold" style={{ display: token.image || token.avatar ? 'none' : 'flex' }}>
                      {token.name?.charAt(0) || '🪙'}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">
                      {mode === 'buy' ? 'Buy' : 'Sell'} {token.symbol || token.ticker}
                    </h2>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Flat Sale Message for Incubation */}
              {(token.status === 'incubation' && token.graduated !== true) && (
                <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-b border-orange-200/50">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-orange-700 dark:text-orange-400">
                      🔥 INCUBATION PHASE - Flat Rate Sale at Lowest Cost!
                    </span>
                  </div>
                  <p className="text-xs text-center text-orange-600 dark:text-orange-400 mt-1">
                    Fixed rate: 1 ETH = 100M tokens • Get in before AMM launch!
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 flex flex-col min-h-0">

                {/* Balance Display */}
                <div className="px-6 py-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Your Balance</span>
                    </div>
                    <button
                      onClick={() => {
                        if (mode === 'sell') {
                          setAmount(userTokenBalance.toString());
                        } else {
                          const maxAmount = isEthMode 
                            ? ethBalance.toString()
                            : (ethBalance * ethToUsd).toString();
                          setAmount(maxAmount);
                        }
                      }}
                      className="text-right hover:bg-muted/50 rounded-lg p-2 transition-colors"
                    >
                      <div className="font-semibold">
                        {mode === 'sell' 
                          ? `${userTokenBalance.toLocaleString()} ${token.symbol || token.ticker}`
                          : isEthMode 
                            ? `${ethBalance.toFixed(4)} ETH`
                            : `$${(ethBalance * ethToUsd).toFixed(2)}`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mode === 'sell' 
                          ? `Available to sell`
                          : isEthMode 
                            ? `≈ $${(ethBalance * ethToUsd).toFixed(2)}`
                            : `≈ ${ethBalance.toFixed(4)} ETH`
                        }
                      </div>
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto">
                  {/* Amount Display */}
                  <div className="px-6 py-6 text-center">
                    <div className="mb-4">
                      <div className="text-4xl font-bold mb-2">
                        {mode === 'sell' 
                          ? `${displayAmount} ${token.symbol || token.ticker}`
                          : isEthMode ? `${displayAmount} ETH` : `$${displayAmount}`
                        }
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {mode === 'sell' 
                          ? `${parseFloat(displayAmount || '0') > 0 ? 'Tokens to sell' : 'Enter amount to sell'}`
                          : isEthMode ? `≈ $${usdValue}` : `≈ ${ethValue} ETH`
                        }
                      </div>
                    </div>

                    {/* Currency Toggle - Only show for buy mode */}
                    {mode === 'buy' && (
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className={cn("text-sm", !isEthMode ? "font-semibold" : "text-muted-foreground")}>
                          USD
                        </span>
                        <button
                          onClick={() => setIsEthMode(!isEthMode)}
                          className="p-1"
                        >
                          {isEthMode ? (
                            <ToggleRight className="w-8 h-8 text-primary" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                          )}
                        </button>
                        <span className={cn("text-sm", isEthMode ? "font-semibold" : "text-muted-foreground")}>
                          ETH
                        </span>
                      </div>
                    )}

                    {/* Quote Display */}
                    {amount && parseFloat(amount) > 0 && (
                      <div className="bg-muted/20 rounded-lg p-3 mb-4 border border-border/50">
                        {isLoadingQuote ? (
                          <div className="flex items-center justify-center gap-2 py-1">
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Getting quote...</span>
                          </div>
                        ) : quote ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {mode === 'buy' ? 'You will receive:' : 'You will get:'}
                              </span>
                              <span className="font-semibold text-sm">
                                {mode === 'buy' 
                                  ? `${parseFloat(quote.tokenAmount).toLocaleString()} ${token.symbol || token.ticker}`
                                  : `${parseFloat(quote.ethAmount).toFixed(6)} ETH`
                                }
                              </span>
                            </div>
                            
                            {quote.type === 'flat_sale' && (
                              <div className="flex items-center justify-center text-xs text-muted-foreground">
                                <span>Fixed Rate: 1 ETH = 100M {token.symbol || token.ticker}</span>
                              </div>
                            )}
                            
                          </div>
                        ) : error ? (
                          <div className="flex items-center justify-center gap-2 py-1 text-red-500">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs">Unable to get quote</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Preset Amounts */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {presetAmounts.map((preset) => (
                        <Button
                          key={preset}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetAmount(preset)}
                          className="h-10 text-sm font-medium"
                        >
                          {mode === 'sell' 
                            ? `${preset}%`
                            : isEthMode 
                              ? `${preset} ETH` 
                              : `$${preset}`
                          }
                        </Button>
                      ))}
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="px-2 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                        </div>
                      </div>
                    )}

                    {/* Confirm Button */}
                    <div className="px-2 pb-4">
                      <Button
                        onClick={handleTrade}
                        disabled={!canTrade || isProcessing}
                        className={cn(
                          "w-full h-12 text-lg font-semibold rounded-2xl",
                          mode === 'buy'
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700",
                          "text-white"
                        )}
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {mode === 'buy' ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <TrendingDown className="w-5 h-5" />
                            )}
                            {mode === 'buy' ? 'Buy' : 'Sell'} {token.symbol || token.ticker}
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Custom Keyboard */}
                <MobileKeyboard
                  onKeyPress={handleKeyPress}
                  onBackspace={handleBackspace}
                  className="mt-auto"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <TradeSuccessAnimation
        isVisible={showSuccess}
        onComplete={handleSuccessComplete}
        amount={mode === 'buy' 
          ? isEthMode 
            ? `${displayAmount} ETH`
            : `$${displayAmount}`
          : `${displayAmount} ${token.symbol || token.ticker}`
        }
        tokenSymbol={token.symbol || token.ticker}
        tokenAvatar={token.image}
        action={mode}
      />
    </>
  );
};

export default MobileTradingSheet;
