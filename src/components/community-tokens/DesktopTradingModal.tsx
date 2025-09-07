import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Wallet, ToggleLeft, ToggleRight, Loader2, AlertCircle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Countdown Timer Component
interface CountdownTimerProps {
  startTime: string;
  durationMinutes: number;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ startTime, durationMinutes, className }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const end = start + (durationMinutes * 60 * 1000);
      const now = new Date().getTime();
      const remaining = end - now;

      if (remaining <= 0) {
        setTimeLeft('Incubation Ended');
        return;
      }

      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Clock className="w-3 h-3" />
      <span>Incubation ends in: {timeLeft}</span>
    </div>
  );
};

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
  flatSaleStartTime?: string;
}

interface DesktopTradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  mode: 'buy' | 'sell';
  userEthBalance?: string;
  onTradeComplete?: () => void;
}

const DesktopTradingModal: React.FC<DesktopTradingModalProps> = ({
  isOpen,
  onClose,
  token,
  mode,
  userEthBalance,
  onTradeComplete
}) => {
  const [amount, setAmount] = useState('');
  const [isEthMode, setIsEthMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ethToUsd, setEthToUsd] = useState(3000);
  const [isLoadingEthPrice, setIsLoadingEthPrice] = useState(false);

  // Get real user balances
  const ethBalance = parseFloat(userEthBalance || "0");
  const userTokenBalance = token?.userHoldings || 0;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setIsEthMode(false);
      setShowSuccess(false);
      setIsProcessing(false);
      setIsLoadingQuote(false);
      setQuote(null);
      setError(null);
    }
  }, [isOpen]);

  // Fetch ETH price when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadEthPrice = async () => {
        setIsLoadingEthPrice(true);
        try {
          const response = await fetchEthPrice();
          if (response.success && response.price) {
            setEthToUsd(response.price);
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

  // Get quote when amount changes
  const getQuote = useCallback(async (inputAmount: string) => {
    if (!token || !inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      return;
    }

    setIsLoadingQuote(true);
    setError(null);

    try {
      const amountNum = parseFloat(inputAmount);
      // Convert USD to ETH if not in ETH mode
      const ethAmount = isEthMode ? amountNum : amountNum / ethToUsd;
      const isGraduated = token.graduated || token.status === 'graduated';

      if (mode === 'buy') {
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
              minimumReceived: response.data.quote.minimumTokensOut,
              currentPrice: response.data.quote.currentPrice
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
              minimumReceived: response.data.quote.minimumEthOut,
              currentPrice: response.data.quote.currentPrice
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
      console.error('Error getting quote:', error);
      setError('Failed to get quote');
    } finally {
      setIsLoadingQuote(false);
    }
  }, [token, mode]);

  // Debounced quote fetching
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getQuote(amount);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [amount, getQuote]);

  const handleAmountChange = (value: string) => {
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      
      // Check balance for sell mode
      if (mode === 'sell' && value && parseFloat(value) > 0) {
        const userTokenBalance = token.userHoldings || 0;
        if (parseFloat(value) > userTokenBalance) {
          setError(`Insufficient balance. You only have ${userTokenBalance.toLocaleString()} ${token.symbol || token.ticker}`);
          return;
        } else {
          setError(null);
        }
      }
    }
  };

  const handlePresetAmount = (value: string) => {
    if (mode === 'sell') {
      // Calculate percentage of token balance
      const percentage = parseFloat(value) / 100;
      const tokenAmount = (userTokenBalance * percentage).toString();
      setAmount(tokenAmount);
    } else {
      setAmount(value);
    }
  };

  const handleMaxBalance = () => {
    if (mode === 'sell') {
      // Use token balance for sell mode
      setAmount(userTokenBalance.toString());
    } else {
      // Use ETH balance for buy mode
      const maxAmount = isEthMode 
        ? ethBalance.toString()
        : (ethBalance * ethToUsd).toString();
      setAmount(maxAmount);
    }
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
      console.error(`Error ${mode}ing tokens:`, error);
      const errorMessage = `Failed to ${mode} tokens`;
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

  const canTrade = numericAmount > 0 && 
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
            
            {/* Right Side Modal */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-[400px] bg-background border-l border-border z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {token.image || token.avatar ? (
                      <img 
                        src={token.image || token.avatar} 
                        alt={token.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) nextElement.style.display = 'flex';
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
                <div className="px-6 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-b border-orange-200/50">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-orange-700 dark:text-orange-400">
                      🔥 INCUBATION PHASE - Flat Rate Sale at Lowest Cost!
                    </span>
                  </div>
                  <p className="text-xs text-center text-orange-600 dark:text-orange-400 mt-1">
                    Fixed rate: 1 ETH = 100M tokens • Get in before AMM launch!
                  </p>
                  {token.flatSaleStartTime && (
                    <div className="mt-2 text-center">
                      <CountdownTimer 
                        startTime={token.flatSaleStartTime} 
                        durationMinutes={30}
                        className="text-xs font-mono text-orange-700 dark:text-orange-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-6 space-y-6">
                {/* Balance Display */}
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Your Balance</span>
                    </div>
                    <button
                      onClick={handleMaxBalance}
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

                {/* Amount Input */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="mb-3">
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {mode === 'buy' ? 'Amount to Buy' : 'Amount to Sell'}
                      </label>
                    </div>
                    <div className="relative p-1 rounded-3xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10">
                      <div className="relative bg-background rounded-2xl p-2">
                      <Input
                        type="text"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="text-4xl font-bold text-center border-0 bg-gradient-to-r from-muted/30 to-muted/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:outline-none h-20 rounded-2xl shadow-inner backdrop-blur-sm transition-all duration-200 hover:from-muted/40 hover:to-muted/20 focus:from-primary/5 focus:to-primary/10 focus:shadow-lg"
                      />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                          <span className="text-lg font-semibold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                            {mode === 'sell' 
                              ? token.symbol || token.ticker
                              : isEthMode ? 'ETH' : 'USD'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-lg text-muted-foreground mt-3">
                      {mode === 'sell' 
                        ? `${displayAmount} ${token.symbol || token.ticker} tokens`
                        : isEthMode 
                          ? `${displayAmount} ETH ≈ $${usdValue}`
                          : `$${displayAmount} ≈ ${ethValue} ETH`
                      }
                    </div>
                  </div>

                  {/* Currency Toggle - Only show for buy mode */}
                  {mode === 'buy' && (
                    <div className="flex items-center justify-center gap-3">
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
                    <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
                      {isLoadingQuote ? (
                        <div className="flex items-center justify-center gap-2 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Getting quote...</span>
                        </div>
                      ) : quote ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {mode === 'buy' ? 'You will receive:' : 'You will get:'}
                            </span>
                            <span className="font-semibold">
                              {mode === 'buy' 
                                ? `${parseFloat(quote.tokenAmount).toLocaleString()} ${token.symbol || token.ticker}`
                                : `${parseFloat(quote.ethAmount).toFixed(6)} ETH`
                              }
                            </span>
                          </div>
                          
                          {quote.type === 'flat_sale' && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Fixed Rate:</span>
                              <span>1 ETH = 100M {token.symbol || token.ticker}</span>
                            </div>
                          )}
                          
                        </div>
                      ) : error ? (
                        <div className="flex items-center justify-center gap-2 py-2 text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Unable to get quote</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Preset Amounts */}
                  <div className="grid grid-cols-4 gap-2">
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
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleTrade}
                  disabled={!canTrade || isProcessing}
                  className={cn(
                    "w-full h-12 text-lg font-semibold rounded-xl",
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Animation - Render outside modal with higher z-index */}
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

export default DesktopTradingModal;

