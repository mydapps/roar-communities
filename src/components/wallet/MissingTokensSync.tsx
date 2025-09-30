import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Coins,
  RefreshCw,
  ArrowRight,
  Star,
  Trophy,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { checkMissingTokens, syncMissingTokens, TokenDiscrepancy, TokenChange } from '@/utils/missingTokensApi';

interface MissingTokensSyncProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}

type SyncStep = 'initial' | 'checking' | 'preview' | 'syncing' | 'success' | 'error';

const MissingTokensSync: React.FC<MissingTokensSyncProps> = ({
  open,
  onOpenChange,
  onSyncComplete
}) => {
  const [step, setStep] = useState<SyncStep>('initial');
  const [discrepancies, setDiscrepancies] = useState<TokenDiscrepancy[]>([]);
  const [changes, setChanges] = useState<TokenChange[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState(0);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']
    });
  };

  const handleCheck = async () => {
    setStep('checking');
    setProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await checkMissingTokens();
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.data) {
        setDiscrepancies(result.data.discrepancies);
        setProcessingTime(result.data.processingTimeMs);
        
        if (result.data.summary.discrepanciesFound > 0) {
          setStep('preview');
          // Small celebration for finding tokens
          confetti({
            particleCount: 30,
            spread: 40,
            origin: { y: 0.7 },
            colors: ['#3B82F6', '#8B5CF6']
          });
        } else {
          // No discrepancies found
          setStep('success');
          setChanges([]);
        }
      } else {
        setError(result.message || 'Failed to check for missing tokens');
        setStep('error');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError('Network error occurred while checking tokens');
      setStep('error');
    }
  };

  const handleSync = async () => {
    setStep('syncing');
    setProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 90));
    }, 300);

    try {
      const result = await syncMissingTokens();
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.data) {
        setChanges(result.data.changes);
        setProcessingTime(result.data.processingTimeMs);
        setStep('success');
        
        // Big celebration for successful sync
        triggerConfetti();
        
        // Call completion callback
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        setError(result.message || 'Failed to sync missing tokens');
        setStep('error');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError('Network error occurred while syncing tokens');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('initial');
    setDiscrepancies([]);
    setChanges([]);
    setProgress(0);
    setError(null);
    setProcessingTime(0);
    onOpenChange(false);
  };

  const handleSuccessClose = () => {
    handleClose();
    // Reload the wallet page to show updated balances
    window.location.reload();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add':
      case 'added':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'update':
      case 'updated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'update_to_zero':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(2)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(2)}K`;
    }
    return balance.toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Missing Tokens Sync
          </DialogTitle>
          <DialogDescription>
            Scan and fix missing or incorrect token balances
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Initial State */}
          {step === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Sync Token Balances</h3>
                  <p className="text-muted-foreground mb-4">
                    If you have missing or incorrect token balances, we'll scan your wallet and fix them.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Fast Scan
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Safe & Secure
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleCheck} size="lg" className="w-full group">
                <Search className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Scan Wallet
                <Sparkles className="w-4 h-4 ml-2 group-hover:animate-spin" />
              </Button>
            </motion.div>
          )}

          {/* Checking State */}
          {step === 'checking' && (
            <motion.div
              key="checking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <RefreshCw className="w-10 h-10 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Scanning Wallet...</h3>
                <p className="text-muted-foreground">
                  Checking for missing or incorrect balances
                </p>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
              </div>
            </motion.div>
          )}

          {/* Preview State */}
          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Found {discrepancies.length} Token{discrepancies.length !== 1 ? 's' : ''} to Fix!
                </h3>
                <p className="text-muted-foreground">
                  These balances will be updated in your portfolio
                </p>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {discrepancies.map((disc, index) => (
                  <motion.div
                    key={disc.ticker}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {disc.ticker.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold">{disc.tokenName}</h4>
                              <p className="text-sm text-muted-foreground">${disc.ticker}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Badge className={getActionColor(disc.actionNeeded)}>
                                {disc.actionNeeded === 'add' ? 'New' : 'Update'}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">
                              {formatBalance(disc.blockchainBalance)} tokens
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSync} className="flex-1 group">
                  <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                  Sync Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Syncing State */}
          {step === 'syncing' && (
            <motion.div
              key="syncing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Updating Balances...</h3>
                <p className="text-muted-foreground">
                  Fixing token balances in your portfolio
                </p>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              
              {changes.length > 0 ? (
                <>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Sync Complete!
                      <Star className="w-5 h-5 text-yellow-500" />
                    </h3>
                    <p className="text-muted-foreground">
                      Successfully updated {changes.length} token balance{changes.length !== 1 ? 's' : ''} in your portfolio
                    </p>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {changes.map((change, index) => (
                      <motion.div
                        key={change.ticker}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {change.ticker.slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-semibold">{change.tokenName}</h4>
                                  <p className="text-sm text-muted-foreground">${change.ticker}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                  <span className="font-semibold text-green-600">
                                    +{formatBalance(change.newBalance)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold mb-2">All Good!</h3>
                  <p className="text-muted-foreground">
                    Your token balances are correct. No issues found.
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Completed in {(processingTime / 1000).toFixed(2)} seconds
              </div>

              <Button onClick={handleSuccessClose} size="lg" className="w-full">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Awesome!
              </Button>
            </motion.div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Oops! Something went wrong</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Close
                </Button>
                <Button onClick={handleCheck} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default MissingTokensSync;
