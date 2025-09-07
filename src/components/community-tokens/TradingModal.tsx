import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  Calculator,
  Wallet
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Token {
  id: number;
  name: string;
  symbol: string;
  description: string;
  avatar: string;
  status: 'incubation' | 'graduated';
  price: number;
  marketCap: number;
  holders: number;
  volume24h: number;
  priceChange24h: number;
  rewardPool: number;
  timeLeft?: number;
  tokensRemaining?: number;
  totalSupply: number;
  userHoldings?: number;
  isHot?: boolean;
  isNew?: boolean;
}

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  mode: 'buy' | 'sell';
}

type TradingStep = 'input' | 'confirm' | 'processing' | 'success' | 'error';

const TradingModal: React.FC<TradingModalProps> = ({ isOpen, onClose, token, mode }) => {
  const [step, setStep] = useState<TradingStep>('input');
  const [amount, setAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [transactionHash, setTransactionHash] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount('');
      setEthAmount('');
      setEstimatedTokens('');
      setTransactionHash('');
      setCountdown(0);
    }
  }, [isOpen]);

  // Calculate estimates
  useEffect(() => {
    if (amount && token) {
      if (mode === 'buy') {
        const ethValue = parseFloat(amount) * token.price;
        setEthAmount(ethValue.toFixed(6));
        setEstimatedTokens(amount);
      } else {
        const ethValue = parseFloat(amount) * token.price;
        setEthAmount(ethValue.toFixed(6));
      }
    }
  }, [amount, token, mode]);

  // Countdown timer for urgency
  useEffect(() => {
    if (token?.timeLeft && step === 'input') {
      setCountdown(token.timeLeft);
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [token?.timeLeft, step]);

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleTrade = async () => {
    setStep('confirm');
  };

  const confirmTrade = async () => {
    setStep('processing');
    
    // Simulate transaction processing
    setTimeout(() => {
      setTransactionHash('0x' + Math.random().toString(16).substr(2, 64));
      setStep('success');
      
      // Trigger celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Auto-close after celebration
      setTimeout(() => {
        onClose();
      }, 3000);
    }, 2000 + Math.random() * 2000);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'input': return mode === 'buy' ? `Buy ${token?.symbol}` : `Sell ${token?.symbol}`;
      case 'confirm': return 'Confirm Transaction';
      case 'processing': return 'Processing...';
      case 'success': return mode === 'buy' ? 'Purchase Successful!' : 'Sale Successful!';
      case 'error': return 'Transaction Failed';
      default: return '';
    }
  };

  if (!token) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto bg-background border shadow-xl">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{token.avatar}</div>
              <div>
                <h3 className="font-bold text-xl">{getStepTitle()}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">{token.name}</p>
                  <Badge variant="outline" className="text-xs">
                    ${token.symbol}
                  </Badge>
                  {token.status === 'incubation' && (
                    <Badge className="bg-orange-500 text-white text-xs">
                      LIVE
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Token Info */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-semibold">{token.price.toFixed(6)} ETH</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Market Cap</p>
                <p className="font-semibold">{token.marketCap.toFixed(1)} ETH</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">24h Change</p>
                <p className={`font-semibold flex items-center justify-center gap-1 ${
                  token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {token.priceChange24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(token.priceChange24h).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* User Holdings (for sell mode) */}
                {mode === 'sell' && token.userHoldings && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold">Your Holdings</span>
                      </div>
                      <span className="font-semibold">{formatNumber(token.userHoldings)} {token.symbol}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ≈ {(token.userHoldings * token.price).toFixed(4)} ETH
                    </p>
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold">
                    {mode === 'buy' ? 'Amount to Buy' : 'Amount to Sell'}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-xl font-semibold pr-20 py-6 text-center"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      {token.symbol}
                    </div>
                  </div>
                  
                  {mode === 'sell' && token.userHoldings && (
                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map(percent => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(((token.userHoldings! * percent) / 100).toString())}
                          className="flex-1 text-xs"
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transaction Summary */}
                {amount && parseFloat(amount) > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Calculator className="w-4 h-4" />
                        Transaction Summary
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {mode === 'buy' ? 'You pay' : 'You receive'}
                          </span>
                          <span className="font-semibold">{ethAmount} ETH</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {mode === 'buy' ? 'You get' : 'You sell'}
                          </span>
                          <span className="font-semibold">{amount} {token.symbol}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price per token</span>
                          <span className="font-semibold">{token.price.toFixed(6)} ETH</span>
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Slippage tolerance</span>
                          <div className="flex gap-1">
                            {['0.1', '0.5', '1.0'].map(val => (
                              <button
                                key={val}
                                onClick={() => setSlippage(val)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                  slippage === val 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {val}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={handleTrade}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className={`w-full py-6 text-lg font-semibold ${
                    mode === 'buy' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {mode === 'buy' ? (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Buy {token.symbol}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-5 h-5 mr-2" />
                      Sell {token.symbol}
                    </>
                  )}
                </Button>
                
                {/* Info Note */}
                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    {mode === 'buy' 
                      ? 'Transaction fees and gas costs will be calculated at confirmation.'
                      : 'You can sell your tokens anytime. Rewards are distributed to holders.'
                    }
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Action</span>
                    <span className="font-semibold capitalize">{mode} {token.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">{amount} {token.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {mode === 'buy' ? 'Total Cost' : 'You Receive'}
                    </span>
                    <span className="font-semibold">{ethAmount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage</span>
                    <span className="font-semibold">{slippage}%</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('input')} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={confirmTrade} className="flex-1 bg-primary">
                    Confirm Transaction
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Processing Transaction</h3>
                <p className="text-muted-foreground mb-4">
                  Please wait while your transaction is being processed...
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>This usually takes 15-30 seconds</span>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                
                <h3 className="text-2xl font-bold mb-2 text-green-600">
                  {mode === 'buy' ? 'Purchase Successful!' : 'Sale Successful!'}
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  {mode === 'buy' 
                    ? `You successfully bought ${amount} ${token.symbol}`
                    : `You successfully sold ${amount} ${token.symbol}`
                  }
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">{amount} {token.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Value</span>
                    <span className="font-semibold">{ethAmount} ETH</span>
                  </div>
                  {transactionHash && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transaction</span>
                      <span className="font-mono text-xs">{transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-sm text-green-700 dark:text-green-400">
                  {mode === 'buy' 
                    ? 'You are now part of this community! Rewards will be distributed to token holders.'
                    : 'Your tokens have been sold successfully. Thank you for being part of the community!'
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradingModal;
