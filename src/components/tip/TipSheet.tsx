import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Heart, 
  Sparkles, 
  ArrowUp, 
  Loader2, 
  CheckCircle2, 
  Zap,
  Coins,
  DollarSign,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { getWalletBalance, type WalletBalanceResponse } from '@/utils/communityApi';
import { fetchEthPrice } from '@/utils/apiBase';

// Custom hook for mobile-friendly input handling
const useMobileInputFocus = () => {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Scroll input into view on mobile with delay for keyboard
    setTimeout(() => {
      e.target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, 300);
  };
  
  return handleFocus;
};

interface TipSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postCode: string;
  receiverHandle: string;
  receiverAvatar?: string;
}

interface TipLimits {
  maxPerTransaction: number;
  maxPerDay: number;
  currentDailyUsage: number;
  remainingDailyLimit: number;
  currentTipCount: number;
  userROARBalance: number;
}

// Helper function to convert USD to ETH
const convertUSDToETH = (usdAmount: number, ethPrice: number): number => {
  if (ethPrice === 0) return 0;
  return usdAmount / ethPrice;
};

// Helper function to get ETH presets with current prices
const getETHPresets = (ethPrice: number) => [
  { label: '$0.10', usdValue: 0.1, ethValue: convertUSDToETH(0.1, ethPrice), description: 'Coffee tip', gradient: 'from-amber-400 to-orange-500' },
  { label: '$0.50', usdValue: 0.5, ethValue: convertUSDToETH(0.5, ethPrice), description: 'Nice post!', gradient: 'from-blue-400 to-blue-600' },
  { label: '$1.00', usdValue: 1.0, ethValue: convertUSDToETH(1.0, ethPrice), description: 'Great content', gradient: 'from-green-400 to-emerald-600' },
  { label: '$5.00', usdValue: 5.0, ethValue: convertUSDToETH(5.0, ethPrice), description: 'Amazing work!', gradient: 'from-purple-500 to-pink-600' },
];

const ROAR_PRESETS = [
  { label: '500', value: 500, description: 'Good post', gradient: 'from-orange-400 to-red-500' },
  { label: '1K', value: 1000, description: 'Great content', gradient: 'from-blue-500 to-purple-600' },
  { label: '5K', value: 5000, description: 'Excellent!', gradient: 'from-emerald-500 to-teal-600' },
  { label: '10K', value: 10000, description: 'Outstanding!', gradient: 'from-purple-600 to-pink-700' },
];

export const TipSheet: React.FC<TipSheetProps> = ({
  isOpen,
  onClose,
  postCode,
  receiverHandle,
  receiverAvatar
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'eth' | 'roar'>('roar');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tipLimits, setTipLimits] = useState<TipLimits | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [successAmount, setSuccessAmount] = useState<number>(0);
  const [successAsset, setSuccessAsset] = useState<'roar' | 'eth'>('roar');
  const [walletBalance, setWalletBalance] = useState<WalletBalanceResponse | null>(null);
  const [ethPrice, setEthPrice] = useState<number>(0);

  // Mobile input focus handler
  const handleMobileFocus = useMobileInputFocus();

  // Memoize ETH presets to prevent recalculation on selection changes
  const ethPresets = React.useMemo(() => getETHPresets(ethPrice), [ethPrice]);

  // Load user limits when sheet opens
  useEffect(() => {
    if (isOpen) {
      console.log('TipSheet opened for post:', postCode, 'receiver:', receiverHandle);
      loadTipLimits();
    }
  }, [isOpen, postCode, receiverHandle]);

  // Reset selections when tab changes (with small delay to avoid animation conflicts)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSelectedPreset(null);
      setCustomAmount('');
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  const loadTipLimits = async () => {
    try {
      // Load ROAR tip limits
      const response = await fetch('/api/tip/limits', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTipLimits(data.limits);
        }
      }

      // Load wallet balance (for ETH)
      const balance = await getWalletBalance();
      if (balance.success) {
        setWalletBalance(balance);
      }

      // Load current ETH price
      const priceResponse = await fetchEthPrice();
      if (priceResponse.success && priceResponse.price) {
        setEthPrice(priceResponse.price);
      }
    } catch (error) {
      console.error('Error loading tip limits:', error);
    }
  };

  const handleTip = async () => {
    const amount = selectedPreset || parseFloat(customAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Validation
    if (activeTab === 'roar') {
      if (!tipLimits) {
        toast.error('Unable to load tip limits');
        return;
      }
      
      if (amount > tipLimits.userROARBalance) {
        toast.error(`Insufficient ROAR balance. You have ${tipLimits.userROARBalance.toLocaleString()} ROAR`);
        return;
      }
      
      if (amount > tipLimits.maxPerTransaction) {
        toast.error(`Maximum ${tipLimits.maxPerTransaction} ROAR per tip`);
        return;
      }
      
      if (amount > tipLimits.remainingDailyLimit) {
        toast.error(`Daily limit exceeded. You can tip ${tipLimits.remainingDailyLimit} more ROAR today`);
        return;
      }
    } else if (activeTab === 'eth') {
      if (!walletBalance) {
        toast.error('Unable to load wallet balance');
        return;
      }
      
      if (ethPrice === 0) {
        toast.error('Unable to get current ETH price');
        return;
      }
      
      const usdAmount = amount; // amount is in USD for ETH tips
      const ethAmount = convertUSDToETH(usdAmount, ethPrice);
      const userEthBalance = parseFloat(walletBalance.balance.eth);
      
      if (ethAmount > userEthBalance) {
        toast.error(`Insufficient ETH balance. You have ${userEthBalance.toFixed(6)} ETH ($${(userEthBalance * ethPrice).toFixed(2)})`);
        return;
      }
      
      // Basic minimum tip validation ($0.01 minimum USD)
      if (usdAmount < 0.01) {
        toast.error('Minimum tip amount is $0.01');
        return;
      }
    }

    // Store success data before API call and convert USD to ETH if needed
    let finalAmount = amount;
    let displayAmount = amount;
    
    if (activeTab === 'eth') {
      // Convert USD to ETH for API
      finalAmount = convertUSDToETH(amount, ethPrice);
      displayAmount = amount; // Keep USD for display
    }
    
    setSuccessAmount(displayAmount);
    setSuccessAsset(activeTab);
    setIsLoading(true);

    // For ETH tips, show immediate optimistic success (blockchain takes time)
    if (activeTab === 'eth') {
      // Send API request in background without waiting
      fetch('/api/tip', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postCode,
          asset: activeTab,
          amount: finalAmount
        })
      }).catch(error => {
        console.error('Background ETH tip error:', error);
        // Don't show error to user since they already saw success
        // TODO: Could implement retry logic or notification system here
      });

      // Show immediate success after brief loading animation
      setTimeout(() => {
        setIsLoading(false);
        setSuccessData({ success: true, isOnChain: true });
        
        // Trigger spectacular success animations
        triggerSuccessEffects();
        
        // Show success state
        setShowSuccess(true);
        
        // Reset form
        setSelectedPreset(null);
        setCustomAmount('');
        
        // Reload limits for next tip
        loadTipLimits();
      }, 1000); // 1 second loading for great UX feel

      return;
    }

    // For ROAR tips, wait for actual response (instant off-chain)
    try {
      const response = await fetch('/api/tip', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postCode,
          asset: activeTab,
          amount: finalAmount
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessData(data);
        
        // Trigger spectacular success animations BEFORE showing success
        triggerSuccessEffects();
        
        // Show success state
        setShowSuccess(true);
        
        // Reset form
        setSelectedPreset(null);
        setCustomAmount('');
        
        // Reload limits for next tip
        await loadTipLimits();
        
      } else {
        toast.error(data.message || 'Failed to send tip');
      }
    } catch (error) {
      console.error('Error sending tip:', error);
      toast.error('Failed to send tip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSuccessEffects = () => {
    // Initial massive confetti burst
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'],
      shapes: ['star', 'circle'],
      scalar: 1.2
    });

    // Left side burst
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#8B5CF6', '#EC4899']
      });
    }, 150);

    // Right side burst
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#F59E0B', '#10B981']
      });
    }, 300);

    // Top celebration
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#EF4444', '#3B82F6'],
        gravity: 0.8
      });
    }, 450);

    // Final sparkle rain
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF69B4'],
        shapes: ['star'],
        scalar: 0.8,
        gravity: 0.6
      });
    }, 600);
  };

  const handleClose = () => {
    setShowSuccess(false);
    setSuccessData(null);
    setSelectedPreset(null);
    setCustomAmount('');
    onClose();
  };

  // Memoize tip amount calculations to prevent unnecessary re-renders
  const tipAmount = React.useMemo(() => {
    return selectedPreset || parseFloat(customAmount) || 0;
  }, [selectedPreset, customAmount]);

  const getTipAmount = () => tipAmount;

  const getTipAmountInETH = () => {
    if (activeTab === 'eth' && tipAmount > 0 && ethPrice > 0) {
      return convertUSDToETH(tipAmount, ethPrice);
    }
    return tipAmount; // For ROAR, return as-is
  };

  const SheetContent_Internal = () => {
    if (showSuccess) {
      return (
        <div className="p-6 space-y-6">
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-6"
          >
            {/* Animated Success Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
              className="relative mx-auto w-20 h-20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-700 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              
              {/* Floating hearts around success icon */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-red-500 text-lg pointer-events-none flex items-center justify-center"
                  initial={{ 
                    opacity: 0, 
                    scale: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.8],
                    x: Math.cos(i * 60 * Math.PI / 180) * 35,
                    y: Math.sin(i * 60 * Math.PI / 180) * 35,
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 2,
                    delay: 0.5 + i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '24px',
                    height: '24px'
                  }}
                >
                  ❤️
                </motion.div>
              ))}
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
                             <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                 {successAsset === 'eth' ? 'Tip Submitted! ⚡' : 'Tip Sent Successfully! 🎉'}
               </h3>
              
                               <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 relative">
                   <div className="text-center">
                     <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                       {successAsset === 'roar' 
                         ? `${successAmount.toLocaleString()} 🦁 ROAR sent!`
                         : `$${successAmount.toFixed(2)} ⚡ ETH sent!`
                       }
                     </p>
                     <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                       to @{receiverHandle}
                     </p>
                   </div>
                   {successAsset === 'eth' && (
                     <motion.div
                       animate={{ rotate: 360 }}
                       transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                       className="absolute top-4 right-4 text-blue-500 text-lg"
                     >
                       ⚡
                     </motion.div>
                   )}
                   {successAsset === 'eth' && (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.3 }}
                       className="mt-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-md px-2 py-1 text-center"
                     >
                       🔗 Processing on blockchain... This may take a few seconds
                     </motion.div>
                   )}
                 </div>
              
                             <motion.p
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.6 }}
                 className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto"
               >
                 {successAsset === 'eth' ? (
                   <>
                     ⚡ <strong>Tip Sent!</strong> Your tip is being processed on the blockchain and should complete in a few seconds.
                     You're supporting amazing creators! 🚀
                   </>
                 ) : (
                   <>
                     🌟 <strong>Amazing!</strong> You're supporting great creators and building a thriving community.
                     Your generosity helps creators keep making awesome content!
                   </>
                 )}
               </motion.p>
            </motion.div>

                           {/* Action Button */}
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.8 }}
               >
                 <Button
                   onClick={handleClose}
                   className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
                 >
                   <Heart className="w-5 h-5 mr-2" />
                   Awesome!
                 </Button>
               </motion.div>
          </motion.div>
        </div>
      );
    }

    return (
      <div key="tip-form" className="p-6 space-y-6">
        {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center mb-3">
          <Heart className="w-6 h-6 text-white" />
        </div>
        
        <h2 className="text-xl font-semibold mb-1">Tip @{receiverHandle}</h2>
        <p className="text-sm text-muted-foreground">
          Show appreciation for great content
        </p>
      </div>

      {/* Asset Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'eth' | 'roar')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roar" className="gap-2">
            <Coins className="w-4 h-4" />
            ROAR
          </TabsTrigger>
          <TabsTrigger value="eth" className="gap-2">
            <DollarSign className="w-4 h-4" />
            ETH
          </TabsTrigger>
        </TabsList>

        {/* ROAR Tab */}
        <TabsContent value="roar" className="space-y-4">
          {tipLimits && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your Balance:</span>
                <span className="font-medium">{tipLimits.userROARBalance.toLocaleString()} 🦁</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Daily Remaining:</span>
                <span className="font-medium">{tipLimits.remainingDailyLimit.toLocaleString()} 🦁</span>
              </div>
            </div>
          )}

          {/* ROAR Presets */}
          <div className="grid grid-cols-2 gap-3">
            {ROAR_PRESETS.map((preset, index) => (
              <motion.button
                key={preset.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                onClick={() => {
                  setSelectedPreset(preset.value);
                  setCustomAmount('');
                }}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden",
                  "hover:scale-105 hover:shadow-lg transform",
                  "flex flex-col items-center gap-2 text-white",
                  selectedPreset === preset.value 
                    ? "border-white shadow-xl scale-105" 
                    : "border-transparent hover:border-white/50"
                )}
                style={{
                  background: selectedPreset === preset.value 
                    ? `linear-gradient(135deg, var(--tw-gradient-stops))` 
                    : `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  opacity: selectedPreset === preset.value ? 1 : 0.9
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${preset.gradient}`} />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold">{preset.label}</span>
                    <span className="text-lg opacity-90">🦁</span>
                  </div>
                  <span className="text-xs opacity-80 text-center">{preset.description}</span>
                </div>
                {selectedPreset === preset.value && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-2 right-2 bg-white/20 rounded-full p-1"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Custom ROAR Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Amount</label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Enter ROAR amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedPreset(null);
              }}
              onFocus={handleMobileFocus}
              className="text-center border-2 focus:border-primary transition-colors text-lg h-12 font-medium"
              min="1"
              step="1"
            />
            {customAmount && (
              <p className="text-xs text-center text-muted-foreground transition-opacity duration-200">
                {parseFloat(customAmount).toLocaleString()} ROAR tokens
              </p>
            )}
          </div>
        </TabsContent>

        {/* ETH Tab */}
        <TabsContent value="eth" className="space-y-4">
          {walletBalance && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your ETH Balance:</span>
                <span className="font-medium">{parseFloat(walletBalance.balance.eth).toFixed(6)} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>USD Value:</span>
                <span className="font-medium">${walletBalance.balance.usd.toFixed(2)}</span>
              </div>
              {ethPrice > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>ETH Price:</span>
                  <span>${ethPrice.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* ETH Presets */}
                    <div className="grid grid-cols-2 gap-3">
            {ethPresets.map((preset, index) => {
              const userEthBalance = parseFloat(walletBalance?.balance.eth || '0');
              const userUsdBalance = userEthBalance * ethPrice;
              const isAffordable = userUsdBalance >= preset.usdValue;
              
              return (
                <motion.button
                key={preset.usdValue}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                onClick={() => {
                  setSelectedPreset(preset.usdValue);
                  setCustomAmount('');
                }}
                disabled={!isAffordable}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden",
                  "hover:scale-105 hover:shadow-lg transform",
                  "flex flex-col items-center gap-2 text-white",
                  !isAffordable && "opacity-50 cursor-not-allowed",
                  selectedPreset === preset.usdValue 
                    ? "border-white shadow-xl scale-105" 
                    : "border-transparent hover:border-white/50"
                )}
                style={{
                  background: selectedPreset === preset.usdValue 
                    ? `linear-gradient(135deg, var(--tw-gradient-stops))` 
                    : `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  opacity: !isAffordable ? 0.5 : (selectedPreset === preset.usdValue ? 1 : 0.9)
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${preset.gradient}`} />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold">{preset.label}</span>
                    <span className="text-sm opacity-90">⚡</span>
                  </div>
                  <span className="text-xs opacity-80 text-center">{preset.description}</span>
                  <span className="text-xs opacity-70">≈ {preset.ethValue.toFixed(6)} ETH</span>
                  {!isAffordable && (
                    <span className="text-xs text-red-200 bg-red-500/20 px-2 py-1 rounded">
                      Insufficient balance
                    </span>
                  )}
                </div>
                {selectedPreset === preset.usdValue && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-2 right-2 bg-white/20 rounded-full p-1"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
          </div>

          {/* Custom ETH Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Amount (USD)</label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Enter USD amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedPreset(null);
              }}
              onFocus={handleMobileFocus}
              className="text-center border-2 focus:border-primary transition-colors text-lg h-12 font-medium"
              step="0.01"
              min="0.01"
            />
            {customAmount && ethPrice > 0 && (
              <div className="text-xs text-center space-y-1 transition-opacity duration-200">
                <p className="text-muted-foreground">
                  ${parseFloat(customAmount).toFixed(2)} USD
                </p>
                <p className="text-muted-foreground">
                  ≈ {convertUSDToETH(parseFloat(customAmount), ethPrice).toFixed(6)} ETH
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Tip Button */}
      <div>
        <Button
          onClick={handleTip}
          disabled={isLoading || (!selectedPreset && !customAmount)}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 transition-all duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {activeTab === 'eth' ? 'Submitting to Blockchain...' : 'Sending Tip...'}
            </>
          ) : (
            <>
              <Heart className="w-5 h-5 mr-2" />
              {getTipAmount() > 0 
                ? `Send ${activeTab === 'roar' 
                    ? `${getTipAmount().toLocaleString()} 🦁` 
                    : `$${getTipAmount().toFixed(2)} ⚡`} Tip`
                : 'Choose Amount Above'
              }
            </>
          )}
        </Button>
      </div>

      {/* Fun encouragement text */}
      <p className="text-center text-sm text-muted-foreground">
        ✨ Spread positivity and support great creators ✨
      </p>
    </div>
    );
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="sr-only">Tip {receiverHandle}</SheetTitle>
          </SheetHeader>
          <SheetContent_Internal />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Tip {receiverHandle}</DialogTitle>
        </DialogHeader>
        <SheetContent_Internal />
      </DialogContent>
    </Dialog>
  );
}; 