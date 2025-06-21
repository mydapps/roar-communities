import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, TrendingUp, Clock, Users, UserPlus, Twitter, Bell, 
  ArrowRight, Trophy, Target, Calendar, Share2, ThumbsUp, MessageCircle,
  PenTool, BarChart3, Vote, User, Coins, Wallet, RefreshCw, Loader2,
  Info, CheckCircle2, LucideIcon, ChevronRight, Gift, Lock
} from 'lucide-react';
import { useLinkAccount } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { isMobileApp } from '@/utils/deviceUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  fetchAvailableBoosters, 
  fetchRegularBoosterStatus, 
  fetchGoldenBoosterStatus, 
  claimGoldenBooster, 
  claimAllGoldenBoosters, 
  claimRegularBooster, 
  fetchAchievements, 
  submitENBWallet,
  fetchENBWalletStatus,
  refreshENBWalletBalances,
  submitSNIWallet,
  fetchSNIWalletStatus,
  refreshSNIWalletBalances
} from '@/utils/apiBase';
import type { 
  AvailableBoostersResponse, 
  RegularBoosterStatusResponse, 
  GoldenBoosterStatusResponse,
  GoldenBoosterClaimResponse,
  RegularBoosterClaimResponse,
  Achievement as ApiAchievement, 
  ENBWalletStatusResponse,
  ENBWalletSubmitResponse,
  ENBWalletRefreshResponse,
  SNIWalletStatusResponse,
  SNIWalletSubmitResponse,
  SNIWalletRefreshResponse
} from '@/utils/apiBase';
import { BoosterDisplay } from '@/components/shared/BoosterDisplay';
import { BoosterDetailModal } from '@/components/shared/BoosterDetailModal';

// Mock API data - replace with actual API implementation
const mockFetchBoosterData = async (): Promise<BoosterData> => {
  return {
    success: true,
    boosters: {
      collected_boosters: 2.5,
      available_boosters: 8.5,
      total_boosters: 11.0,
      collected_golden_boosters: 1,
      available_golden_boosters: 4,
      total_golden_boosters: 5,
      current_farming_rate: 2.5, // 1 (base) + collected boosts
      max_farming_rate: 6.0 // Maximum potential if all boosters are collected
    },
    activities: [
      // Golden boosters (permanent)
      {
        id: "connect_twitter",
        type: "golden" as const,
        title: "Connect Twitter",
        description: "Connect your Twitter account to unlock social boosters",
        boost: 1.0,
        completed: true,
        completed_on: "2023-04-10T15:30:00Z",
        icon: "Twitter",
        prerequisites: [],
        action_url: "/connect/twitter"
      },
      {
        id: "create_community",
        type: "golden" as const,
        title: "Create a Community",
        description: "Create your own thriving community",
        boost: 2.0,
        completed: false,
        icon: "Users",
        prerequisites: [],
        action_url: "/create-community"
      },
      {
        id: "complete_profile",
        type: "golden" as const,
        title: "Complete Profile",
        description: "Set your avatar, bio, and customize your profile",
        boost: 1.0,
        completed: false,
        icon: "User",
        prerequisites: [],
        action_url: "/edit-profile"
      },
      {
        id: "join_5_communities",
        type: "golden" as const,
        title: "Join 5 Communities",
        description: "Join at least 5 communities",
        boost: 5.0,
        completed: false,
        icon: "Users",
        progress: {
          current: 3,
          target: 5
        },
        prerequisites: [],
        action_url: "/communities"
      },
      {
        id: "invite_10_friends",
        type: "golden" as const,
        title: "Invite 10 Friends",
        description: "Invite at least 10 friends to join Roar",
        boost: 5.0,
        completed: false,
        icon: "UserPlus",
        progress: {
          current: 4,
          target: 10
        },
        next_level: {
          id: "invite_20_friends",
          title: "Invite 20 Friends",
          boost: 5.0,
          current: 4,
          target: 20
        },
        prerequisites: [],
        action_url: "/referral"
      },
      {
        id: "join_discord",
        type: "golden" as const,
        title: "Join Discord Community",
        description: "Connect with the wider Roar community",
        boost: 1.0,
        completed: false,
        icon: "MessageCircle",
        prerequisites: [],
        action_url: "https://discord.gg/roarcommunity"
      },
      {
        id: "enable_notifications",
        type: "golden" as const,
        title: "Enable Notifications",
        description: "Stay updated on latest activities and farming boosts",
        boost: 1.0,
        completed: false,
        icon: "Bell",
        prerequisites: [],
        action_url: "/notifications/settings"
      },
      
      // Regular boosters (single-time or repeatable)
      {
        id: "refer_friends",
        type: "regular" as const,
        title: "Invite Friends",
        description: "Invite 5 friends to join Roar",
        boost: 0.5,
        completed: true,
        completed_on: "2023-04-09T12:45:00Z",
        icon: "UserPlus",
        progress: {
          current: 5,
          target: 5
        },
        next_level: {
          id: "refer_friends_10",
          title: "Invite 10 Friends",
          boost: 0.5,
          current: 5,
          target: 10
        },
        prerequisites: [],
        action_url: "/referral"
      },
      {
        id: "daily_tweet",
        type: "regular" as const,
        title: "Daily Tweet",
        description: "Share your Roar experience on Twitter",
        boost: 0.5,
        completed: true,
        completed_on: "2023-04-12T09:15:00Z",
        icon: "Share2",
        refresh: {
          type: "daily",
          next_available: "2023-04-13T00:00:00Z"
        },
        prerequisites: ["connect_twitter"],
        action_url: "/share/twitter"
      },
      {
        id: "daily_check_in",
        type: "regular" as const,
        title: "Daily Check-in",
        description: "Check in to the app every day",
        boost: 0.5,
        completed: false,
        streak: {
          current: 2,
          max_achieved: 5,
          multiplier: {
            threshold: 5,
            boost: 0.1
          }
        },
        icon: "Calendar",
        refresh: {
          type: "daily",
          next_available: null
        },
        prerequisites: [],
        action_url: "/check-in"
      },
      {
        id: "share_community",
        type: "regular" as const,
        title: "Share a Community",
        description: "Share your favorite community on social media",
        boost: 0.5,
        completed: false,
        icon: "Share2",
        prerequisites: [],
        action_url: "/communities"
      },
      {
        id: "first_post",
        type: "regular" as const,
        title: "Create First Post",
        description: "Create your first post in any community",
        boost: 0.5,
        completed: false,
        icon: "PenTool",
        prerequisites: [],
        action_url: "/communities"
      },
      {
        id: "buy_shares",
        type: "regular" as const,
        title: "Buy Community Shares",
        description: "Invest in community shares for the first time",
        boost: 0.5,
        completed: false,
        icon: "TrendingUp",
        prerequisites: [],
        action_url: "/communities"
      },
      {
        id: "engage_posts",
        type: "regular" as const,
        title: "Engage with 10 Posts",
        description: "Like or comment on 10 different posts",
        boost: 0.5,
        completed: false,
        progress: {
          current: 3,
          target: 10
        },
        icon: "ThumbsUp",
        prerequisites: [],
        action_url: "/feed"
      },
      {
        id: "daily_upvote_streak",
        type: "regular" as const,
        title: "Daily Upvote Streak",
        description: "Roar at posts daily to build a streak and earn bigger boosts",
        boost: 0.5,
        completed: false,
        icon: "UpvoteStreak",
        refresh: { type: "daily", next_available: null },
        streak: { current: 0, max_achieved: 0, multiplier: { threshold: 1, boost: 0.25 } },
        prerequisites: [],
        action_url: "/feed"
      },
      {
        id: "daily_comment_streak",
        type: "regular" as const,
        title: "Daily Comment Streak",
        description: "Comment useful things on 5 posts daily to build a streak and earn bigger boosts",
        boost: 0.5,
        completed: false,
        icon: "CommentStreak",
        progress: { current: 0, target: 5 },
        refresh: { type: "daily", next_available: null },
        streak: { current: 0, max_achieved: 0, multiplier: { threshold: 1, boost: 0.25 } },
        prerequisites: [],
        action_url: "/feed"
      },
      {
        id: "daily_follow_streak",
        type: "regular" as const,
        title: "Daily Follow Streak",
        description: "Follow 5 new people daily to build a streak and earn bigger boosts",
        boost: 0.5,
        completed: false,
        icon: "FollowStreak",
        progress: { current: 0, target: 5 },
        refresh: { type: "daily", next_available: null },
        streak: { current: 0, max_achieved: 0, multiplier: { threshold: 1, boost: 0.25 } },
        prerequisites: [],
        action_url: "/feed"
      }
    ],
    // Empty array for achievements since we're using API data
    achievements: []
  };
};

// Types
interface BoosterProgressData {
  collected_boosters: number;
  available_boosters: number;
  total_boosters: number;
  collected_golden_boosters: number;
  available_golden_boosters: number;
  total_golden_boosters: number;
  current_farming_rate: number;
  max_farming_rate: number;
}

interface BoosterProgress {
  current: number;
  target: number;
}

interface NextLevel {
  id: string;
  title: string;
  boost: number;
  current: number;
  target: number;
}

interface RefreshInfo {
  type: "daily" | "weekly" | "monthly";
  next_available: string | null;
}

interface StreakInfo {
  current: number;
  max_achieved: number;
  multiplier: {
    threshold: number;
    boost: number;
  };
}

interface Achievement {
  id: string;
  title: string;
  name: string;
  type: string;
  description: string;
  reward: string;
  completed: boolean;
  unlocked: boolean;
  unlocked_at: string | null;
  rarity: string;
  display_color: string;
  progress?: BoosterProgress;
  icon: string;
}

interface BoosterActivity {
  id: string;
  type: "golden" | "regular";
  title: string;
  description: string;
  boost: number;
  completed: boolean;
  completed_on?: string;
  eligible?: boolean;
  icon: string;
  progress?: BoosterProgress;
  next_level?: NextLevel;
  prerequisites: string[];
  refresh?: RefreshInfo;
  streak?: StreakInfo;
  action_url: string;
  requires_action?: boolean;
}

interface BoosterData {
  success: boolean;
  boosters: BoosterProgressData;
  activities: BoosterActivity[];
  achievements: Achievement[];
}

// ENB Wallet Linking Modal Component
interface ENBWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ENBWalletModal: React.FC<ENBWalletModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletStatus, setWalletStatus] = useState<ENBWalletStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { linkWallet } = useLinkAccount({
    onSuccess: async (user) => {
      console.log('[wallet] ✅ Wallet linked successfully');
      console.log('[wallet] User object received:', JSON.stringify(user, null, 2));
      console.log('[wallet] User ID:', user?.id);
      console.log('[wallet] User linked accounts count:', user?.linkedAccounts?.length || 0);
      
      setIsLinking(false);
      
      // Find the most recently linked wallet
      const walletAccounts = user.linkedAccounts?.filter(account => account.type === 'wallet') || [];
      console.log('[wallet] All linked accounts:', user?.linkedAccounts?.map(acc => ({ 
        type: acc.type, 
        address: (acc as any).address || 'no-address' 
      })));
      console.log('[wallet] Wallet accounts found:', walletAccounts.length);
      console.log('[wallet] Wallet accounts details:', walletAccounts.map(wallet => ({ 
        type: wallet.type, 
        address: (wallet as any).address || 'no-address',
        chainId: (wallet as any).chainId || 'unknown',
        walletClient: (wallet as any).walletClient || 'unknown'
      })));
      
      if (walletAccounts.length > 0) {
        const latestWallet = walletAccounts[walletAccounts.length - 1];
        console.log('[wallet] Latest wallet selected:', latestWallet);
        console.log('[wallet] Latest wallet address:', (latestWallet as any).address);
        
        if ((latestWallet as any).address) {
          console.log('[wallet] Proceeding to submit wallet address:', (latestWallet as any).address);
          await handleWalletSubmit((latestWallet as any).address);
        } else {
          console.error('[wallet] ❌ Latest wallet has no address field');
          toast.error('Wallet address not found');
        }
      } else {
        console.error('[wallet] ❌ No wallet accounts found in linkedAccounts');
        console.log('[wallet] All account types found:', user?.linkedAccounts?.map(acc => acc.type));
        toast.error('No wallet found in linked accounts');
      }
    },
    onError: (error) => {
      console.log('[wallet] ❌ Failed to link wallet - ERROR DETAILS:');
      console.log('[wallet] Error object:', error);
      console.log('[wallet] Error type:', typeof error);
      console.log('[wallet] Error keys:', error ? Object.keys(error) : 'null');
      console.log('[wallet] Error stringified:', JSON.stringify(error, null, 2));
      
      const errorObj = error as any;
      console.log('[wallet] Error message:', errorObj?.message);
      console.log('[wallet] Error code:', errorObj?.code);
      console.log('[wallet] Error privyErrorCode:', errorObj?.privyErrorCode);
      console.log('[wallet] Error type field:', errorObj?.type);
      console.log('[wallet] Error cause:', errorObj?.cause);
      console.log('[wallet] Error stack:', errorObj?.stack);
      
      setIsLinking(false);
      
      // Provide specific error messages based on the error code
      let errorMessage = 'Failed to link wallet. Please try again.';
      
      if (error && typeof error === 'object') {
        const errorCode = errorObj?.privyErrorCode || errorObj?.code || errorObj?.type;
        console.log('[wallet] Determined error code:', errorCode);
        
        switch (errorCode) {
          case 'failed_to_link_account':
            errorMessage = 'Wallet linking was cancelled or failed. Please try again.';
            console.log('[wallet] Error categorized as: failed_to_link_account');
            break;
          case 'cannot_link_more_of_type':
            errorMessage = 'You already have a wallet linked. Please use the refresh button to update balances.';
            console.log('[wallet] Error categorized as: cannot_link_more_of_type');
            break;
          case 'user_exited_link_flow':
            errorMessage = 'Wallet linking was cancelled.';
            console.log('[wallet] Error categorized as: user_exited_link_flow');
            break;
          case 'wallet_connection_rejected':
          case 'user_rejected_request':
            errorMessage = 'Wallet connection was rejected. Please approve the connection in your wallet.';
            console.log('[wallet] Error categorized as: wallet_connection_rejected/user_rejected_request');
            break;
          case 'unsupported_wallet':
            errorMessage = 'This wallet type is not supported. Please try with MetaMask or another supported wallet.';
            console.log('[wallet] Error categorized as: unsupported_wallet');
            break;
          case 'timeout':
            errorMessage = 'Wallet linking timed out. Please try again.';
            console.log('[wallet] Error categorized as: timeout');
            break;
          default:
            console.log('[wallet] Error not categorized, checking message content');
            // Check if error message contains helpful information
            if (errorObj?.message) {
              console.log('[wallet] Analyzing error message:', errorObj.message);
              if (errorObj.message.includes('cancelled')) {
                errorMessage = 'Wallet linking was cancelled.';
                console.log('[wallet] Message indicates cancellation');
              } else if (errorObj.message.includes('rejected')) {
                errorMessage = 'Wallet connection was rejected. Please try again.';
                console.log('[wallet] Message indicates rejection');
              } else if (errorObj.message.includes('timeout')) {
                errorMessage = 'Connection timed out. Please try again.';
                console.log('[wallet] Message indicates timeout');
              }
            }
            break;
        }
      }
      
      console.log('[wallet] Final error message to show user:', errorMessage);
      toast.error(errorMessage);
    }
  });

  const handleLinkWallet = () => {
    console.log('[wallet] 🚀 Starting wallet linking process...');
    console.log('[wallet] Current linking state:', isLinking);
    console.log('[wallet] Current submitting state:', isSubmitting);
    
    setIsLinking(true);
    console.log('[wallet] Set isLinking to true, calling linkWallet()');
    
    try {
      linkWallet();
      console.log('[wallet] linkWallet() called successfully');
    } catch (error) {
      console.error('[wallet] ❌ Error calling linkWallet():', error);
      setIsLinking(false);
      toast.error('Failed to initiate wallet linking');
    }
  };

  const handleWalletSubmit = async (walletAddress: string) => {
    console.log('[wallet] 📤 Starting wallet submission process...');
    console.log('[wallet] Wallet address to submit:', walletAddress);
    
    setIsSubmitting(true);
    try {
      console.log('[wallet] Calling submitENBWallet API...');
      const result = await submitENBWallet(walletAddress);
      console.log('[wallet] submitENBWallet result:', result);
      
      if (result && result.success) {
        console.log('[wallet] ✅ Wallet submission successful');
        console.log('[wallet] Result data:', result.data);
        toast.success(result.message);
        
        if (result.data?.eligible_for_booster) {
          console.log('[wallet] 🎉 User eligible for booster!');
          console.log('[wallet] ENB balance:', result.data.enb_balance);
          toast.success(`🎉 Eligible for 2x ENB Token Holder Boost! Balance: ${result.data.enb_balance} ENB`);
          onSuccess();
          onClose();
        } else {
          console.log('[wallet] ⚠️ User not eligible for booster');
          console.log('[wallet] ENB balance:', result.data?.enb_balance);
          console.log('[wallet] Required balance:', result.data?.required_balance);
          toast.warning(`Insufficient ENB balance: ${result.data?.enb_balance || 0} ENB. Need at least ${result.data?.required_balance || 1000} ENB.`);
          // Refresh wallet status to show current wallets
          await loadWalletStatus();
        }
      } else {
        console.error('[wallet] ❌ Wallet submission failed');
        console.log('[wallet] Error result:', result);
        toast.error(result?.message || 'Failed to verify wallet');
      }
    } catch (error) {
      console.error('[wallet] ❌ Exception during wallet submission:', error);
      toast.error('Failed to verify wallet. Please try again.');
    } finally {
      console.log('[wallet] Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const loadWalletStatus = async () => {
    console.log('[wallet] 📋 Loading wallet status...');
    setIsLoadingStatus(true);
    try {
      console.log('[wallet] Calling fetchENBWalletStatus API...');
      const status = await fetchENBWalletStatus();
      console.log('[wallet] fetchENBWalletStatus result:', status);
      console.log('[wallet] Status success:', status?.success);
      console.log('[wallet] Wallets count:', status?.data?.wallets?.length || 0);
      setWalletStatus(status);
    } catch (error) {
      console.error('[wallet] ❌ Error loading wallet status:', error);
    } finally {
      console.log('[wallet] Setting isLoadingStatus to false');
      setIsLoadingStatus(false);
    }
  };

  const handleRefreshBalances = async () => {
    console.log('[wallet] 🔄 Refreshing wallet balances...');
    setIsRefreshing(true);
    try {
      console.log('[wallet] Calling refreshENBWalletBalances API...');
      const result = await refreshENBWalletBalances();
      console.log('[wallet] refreshENBWalletBalances result:', result);
      
      if (result && result.success) {
        console.log('[wallet] ✅ Balance refresh successful');
        console.log('[wallet] Refresh result data:', result.data);
        toast.success('Wallet balances refreshed!');
        
        if (result.data.eligible_for_booster) {
          console.log('[wallet] 🎉 User now eligible for booster after refresh!');
          console.log('[wallet] Max balance after refresh:', result.data.max_balance);
          toast.success(`🎉 Now eligible for 2x ENB Token Holder Boost! Max balance: ${result.data.max_balance} ENB`);
          onSuccess();
          onClose();
        } else {
          console.log('[wallet] ⚠️ User still not eligible after refresh');
          console.log('[wallet] Max balance:', result.data.max_balance);
          console.log('[wallet] Required balance:', result.data.required_balance);
          toast.info(`Max balance: ${result.data.max_balance} ENB. Need at least ${result.data.required_balance} ENB.`);
        }
        
        // Refresh the status display
        console.log('[wallet] Refreshing wallet status display...');
        await loadWalletStatus();
      } else {
        console.error('[wallet] ❌ Balance refresh failed');
        console.log('[wallet] Error result:', result);
        toast.error(result?.message || 'Failed to refresh balances');
      }
    } catch (error) {
      console.error('[wallet] ❌ Exception during balance refresh:', error);
      toast.error('Failed to refresh balances. Please try again.');
    } finally {
      console.log('[wallet] Setting isRefreshing to false');
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWalletStatus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            ENB Token Holder Boost
          </DialogTitle>
          <DialogDescription>
            Connect your external wallet to verify you hold 1000+ ENB tokens for a 2x boost.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Requirements */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg p-3">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Requirements:</h4>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Hold at least 1,000 ENB tokens</li>
              <li>• Connect external wallet (MetaMask, etc.)</li>
              <li>• Wallet must contain ENB tokens</li>
            </ul>
          </div>

          {/* Current Wallet Status */}
          {isLoadingStatus ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2">Loading wallet status...</span>
            </div>
          ) : walletStatus?.success && walletStatus.data.wallets.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Connected Wallets:</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshBalances}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {walletStatus.data.wallets.map((wallet, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">
                        {wallet.wallet.slice(0, 6)}...{wallet.wallet.slice(-4)}
                      </span>
                      <span className={`font-medium ${Number(wallet.enb_balance) >= 1000 ? 'text-green-600' : 'text-orange-600'}`}>
                        {Number(wallet.enb_balance).toFixed(2)} ENB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Max Balance:
                  </span>
                  <span className={`font-bold ${walletStatus.data.eligible_for_booster ? 'text-green-600' : 'text-orange-600'}`}>
                    {Number(walletStatus.data.max_balance).toFixed(2)} ENB
                  </span>
                </div>
                {walletStatus.data.eligible_for_booster ? (
                  <p className="text-sm text-green-600 mt-1">✅ Eligible for 2x boost!</p>
                ) : (
                  <p className="text-sm text-orange-600 mt-1">
                    Need {(Number(walletStatus.data.required_balance) - Number(walletStatus.data.max_balance)).toFixed(2)} more ENB
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No wallets connected yet</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleLinkWallet}
              disabled={isLinking || isSubmitting}
              className="flex-1"
            >
              {isLinking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect New Wallet
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// SNI Wallet Linking Modal Component
interface SNIWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SNIWalletModal: React.FC<SNIWalletModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletStatus, setWalletStatus] = useState<SNIWalletStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { linkWallet } = useLinkAccount({
    onSuccess: async (user) => {
      console.log('[sni_wallet] ✅ Wallet linked successfully');
      setIsLinking(false);
      
      // Find the most recently linked wallet
      const walletAccounts = user.linkedAccounts?.filter(account => account.type === 'wallet') || [];
      
      if (walletAccounts.length > 0) {
        const latestWallet = walletAccounts[walletAccounts.length - 1];
        
        if ((latestWallet as any).address) {
          console.log('[sni_wallet] Proceeding to submit wallet address:', (latestWallet as any).address);
          await handleWalletSubmit((latestWallet as any).address);
        } else {
          console.error('[sni_wallet] ❌ Latest wallet has no address field');
          toast.error('Wallet address not found');
        }
      } else {
        console.error('[sni_wallet] ❌ No wallet accounts found in linkedAccounts');
        toast.error('No wallet found in linked accounts');
      }
    },
    onError: (error) => {
      console.log('[sni_wallet] ❌ Failed to link wallet:', error);
      setIsLinking(false);
      
      // Provide specific error messages
      let errorMessage = 'Failed to link wallet. Please try again.';
      const errorObj = error as any;
      const errorCode = errorObj?.privyErrorCode || errorObj?.code || errorObj?.type;
      
      switch (errorCode) {
        case 'failed_to_link_account':
          errorMessage = 'Wallet linking was cancelled or failed. Please try again.';
          break;
        case 'cannot_link_more_of_type':
          errorMessage = 'You already have a wallet linked. Please use the refresh button to update balances.';
          break;
        case 'user_exited_link_flow':
          errorMessage = 'Wallet linking was cancelled.';
          break;
        case 'wallet_connection_rejected':
        case 'user_rejected_request':
          errorMessage = 'Wallet connection was rejected. Please approve the connection in your wallet.';
          break;
        default:
          if (errorObj?.message) {
            if (errorObj.message.includes('cancelled')) {
              errorMessage = 'Wallet linking was cancelled.';
            } else if (errorObj.message.includes('rejected')) {
              errorMessage = 'Wallet connection was rejected. Please try again.';
            }
          }
          break;
      }
      
      toast.error(errorMessage);
    }
  });

  const handleLinkWallet = () => {
    console.log('[sni_wallet] 🚀 Starting wallet linking process...');
    setIsLinking(true);
    
    try {
      linkWallet();
    } catch (error) {
      console.error('[sni_wallet] ❌ Error calling linkWallet():', error);
      setIsLinking(false);
      toast.error('Failed to initiate wallet linking');
    }
  };

  const handleWalletSubmit = async (walletAddress: string) => {
    console.log('[sni_wallet] 📤 Starting wallet submission process...');
    setIsSubmitting(true);
    try {
      const result = await submitSNIWallet(walletAddress);
      
      if (result && result.success) {
        toast.success(result.message);
        
        if (result.data?.eligible_for_booster) {
          toast.success(`🎉 Eligible for 2x SNI Token Holder Boost! Balance: ${result.data.sni_balance} SNI`);
          onSuccess();
          onClose();
        } else {
          toast.warning(`Insufficient SNI balance: ${result.data?.sni_balance || 0} SNI. Need at least ${result.data?.required_balance || 10} SNI.`);
          await loadWalletStatus();
        }
      } else {
        toast.error(result?.message || 'Failed to verify wallet');
      }
    } catch (error) {
      toast.error('Failed to verify wallet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadWalletStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const result = await fetchSNIWalletStatus();
      if (result && result.success) {
        setWalletStatus(result);
      }
    } catch (error) {
      console.error('[sni_wallet] ❌ Exception loading wallet status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshSNIWalletBalances();
      
      if (result && result.success) {
        toast.success('Wallet balances refreshed!');
        
        if (result.data.eligible_for_booster) {
          toast.success(`🎉 Now eligible for 2x SNI Token Holder Boost! Max balance: ${result.data.max_balance} SNI`);
          onSuccess();
          onClose();
        } else {
          toast.info(`Max balance: ${result.data.max_balance} SNI. Need at least ${result.data.required_balance} SNI.`);
        }
        
        await loadWalletStatus();
      } else {
        toast.error(result?.message || 'Failed to refresh balances');
      }
    } catch (error) {
      toast.error('Failed to refresh balances. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWalletStatus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-purple-500" />
            SNI Token Holder Boost
          </DialogTitle>
          <DialogDescription>
            Connect your external wallet to verify you hold 10+ SNI tokens for a 2x boost.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Requirements */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/40 rounded-lg p-3">
            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Requirements:</h4>
            <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
              <li>• Hold at least 10 SNI tokens</li>
              <li>• Connect external wallet (MetaMask, etc.)</li>
              <li>• Wallet must contain SNI tokens on Polygon</li>
            </ul>
          </div>

          {/* Current Wallet Status */}
          {isLoadingStatus ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading wallet status...</span>
            </div>
          ) : walletStatus?.data?.wallets && walletStatus.data.wallets.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium">Connected Wallets:</h4>
              
              {walletStatus.data.wallets.map((wallet, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {wallet.wallet.slice(0, 6)}...{wallet.wallet.slice(-4)}
                    </span>
                    <span className="text-sm font-semibold">
                      {Number(wallet.sni_balance).toFixed(2)} SNI
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(wallet.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Max Balance:
                  </span>
                  <span className={`font-bold ${walletStatus.data.eligible_for_booster ? 'text-green-600' : 'text-orange-600'}`}>
                    {Number(walletStatus.data.max_balance).toFixed(2)} SNI
                  </span>
                </div>
                {walletStatus.data.eligible_for_booster ? (
                  <p className="text-sm text-green-600 mt-1">✅ Eligible for 2x boost!</p>
                ) : (
                  <p className="text-sm text-orange-600 mt-1">
                    Need {(Number(walletStatus.data.required_balance) - Number(walletStatus.data.max_balance)).toFixed(2)} more SNI
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No wallets connected yet</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleLinkWallet} 
              disabled={isLinking || isSubmitting}
              className="w-full"
            >
              {isLinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting Wallet...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect New Wallet
                </>
              )}
            </Button>
            
            {walletStatus?.data?.wallets && walletStatus.data.wallets.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleRefreshBalances}
                disabled={isRefreshing || isSubmitting}
                className="w-full"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Balances
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>SNI tokens are on the Polygon network. Make sure your wallet is connected to Polygon to see your balance.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getIconComponent = (iconName: string): React.ReactNode => {
  const icons: Record<string, LucideIcon> = {
    Twitter: Twitter,
    Users: Users,
    Trophy: Trophy,
    TrendingUp: TrendingUp,
    ThumbsUp: ThumbsUp,
    Share2: Share2,
    Rocket: Sparkles,
    RefreshCw: Clock,
    PenTool: PenTool,
    MessageCircle: MessageCircle,
    Medal: Sparkles,
    Gift: Sparkles,
    Globe: Sparkles,
    Calendar: Calendar,
    Clock: Clock,
    Gem: Sparkles,
    UserPlus: UserPlus,
    User: User,
    Bell: Bell,
    Target: Target,
    Award: Trophy,
    UpvoteStreak: Sparkles,
    CommentStreak: Sparkles,
    FollowStreak: UserPlus,
    BarChart3: BarChart3,
    Vote: Vote,
    Coins: Coins,
    Wallet: Wallet
  };

  const IconComponent = icons[iconName] || Sparkles;
  return <IconComponent className="h-5 w-5" />;
};

// Booster card component
interface BoosterCardProps {
  activity: BoosterActivity;
  onClaim: (id: string) => Promise<void>;
  isProcessing: boolean;
  showENBModal?: () => void;
  showSNIModal?: () => void;
}

const BoosterCard: React.FC<BoosterCardProps> = ({ activity, onClaim, isProcessing, showENBModal, showSNIModal }) => {
  const [claiming, setClaiming] = useState(false);
  const navigate = useNavigate();
  
  // Check if all prerequisites are met (would need to be implemented with actual data)
  const prerequisitesMet = activity.eligible !== false;
  
  const handleAction = async () => {
    // If it's Twitter connect but not eligible, we need special handling
    if (activity.id === "twitter_connect" && activity.eligible === false) {
      try {
        // Use relative proxy path
        const response = await fetch(`/api/twitter_auth`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.url) {
            // Open Twitter auth in a new window
            window.open(data.url, '_blank');
            return;
          }
        }
        
        // Fallback if API fails
        toast.error("Failed to connect to Twitter/X. Please try again.");
      } catch (error) {
        console.error("Error initiating Twitter auth:", error);
        toast.error("Failed to connect to Twitter/X. Please try again.");
      }
      return;
    }
    
    // Special handling for mobile notifications booster
    if (activity.id === "enable_mobile_notifications" && activity.eligible === false) {
      // Check if user is in mobile app
      if (isMobileApp()) {
        // Navigate to notifications page to enable notifications
        navigate('/notifications');
        return;
      } else {
        // Open app download link for web users
        if (activity.action_url.startsWith('http')) {
          window.open(activity.action_url, '_blank');
          return;
        }
      }
    }
    
    // Special handling for ENB token holder booster
    if (activity.id === "enb_token_holder" && activity.eligible === false) {
      if (showENBModal) {
        showENBModal();
        return;
      }
    }
    
    // Special handling for SNI token holder booster
    if (activity.id === "sni_token_holder" && activity.eligible === false) {
      if (showSNIModal) {
        showSNIModal();
        return;
      }
    }
    
    // If the booster is completed, just return
    if (activity.completed) return;
    
    // For tasks that need to be completed first
    if (activity.eligible === false) {
      if (activity.action_url.startsWith('http')) {
        window.open(activity.action_url, '_blank');
        return;
      }
      
      // Otherwise navigate to the action page
      navigate(activity.action_url);
      return;
    }
    
    // If the booster is eligible but not claimed, we can claim it
    if (activity.eligible === true && !activity.completed) {
      setClaiming(true);
      await onClaim(activity.id);
      setClaiming(false);
      return;
    }
    
    // Default case - navigate to the action URL
    if (activity.action_url.startsWith('http')) {
      window.open(activity.action_url, '_blank');
    } else {
      navigate(activity.action_url);
    }
  };
  
  const isRefreshable = activity.refresh && activity.completed;
  const isReady = activity.refresh && activity.completed && new Date(activity.refresh.next_available || "") <= new Date();
  
  // Format the time until available
  const formatTimeUntilAvailable = () => {
    if (!activity.refresh || !activity.refresh.next_available) return '';
    
    const now = new Date();
    const available = new Date(activity.refresh.next_available);
    const diffMs = available.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Available now';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `Available in ${diffHrs}h ${diffMins}m`;
    } else {
      return `Available in ${diffMins}m`;
    }
  };
  
  // Determine button state and text based on eligibility and completion
  const getButtonContent = () => {
    if (claiming) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Claiming...
        </>
      );
    }
    
    if (activity.eligible === false) {
      if (activity.progress) {
        return (
          <>
            <ArrowRight className="h-4 w-4 mr-2" />
            {activity.id === 'twitter_connect' ? (
              <>
                Connect Twitter
                <span className="ml-1">/ <span className="inline-block font-bold">𝕏</span></span>
              </>
            ) : activity.id === 'enable_mobile_notifications' ? (
              isMobileApp() ? 'Enable Notifications' : 'Download Mobile App'
            ) : activity.id === 'enb_token_holder' ? (
              'Connect Wallet'
            ) : activity.id === 'sni_token_holder' ? (
              'Connect Wallet'
            ) : 'Complete Task'}
          </>
        );
      } else {
        return (
          <>
            <ArrowRight className="h-4 w-4 mr-2" />
            {activity.id === 'twitter_connect' ? (
              <>
                Connect Twitter
                <span className="ml-1">/ <span className="inline-block font-bold">𝕏</span></span>
              </>
            ) : activity.id === 'enable_mobile_notifications' ? (
              isMobileApp() ? 'Enable Notifications' : 'Download Mobile App'
            ) : activity.id === 'enb_token_holder' ? (
              'Connect Wallet'
            ) : 'Start Task'}
          </>
        );
      }
    }
    
    return (
      <>
        <Sparkles className="h-4 w-4 mr-2" />
        Claim Booster
      </>
    );
  };
  
  // Render streak in a more sober way
  const renderStreakIndicator = () => {
    if (!activity.streak) return null;
    
    const { current, multiplier } = activity.streak;
    const percentage = Math.min((current / multiplier.threshold) * 100, 100);
    
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-1">
        <div 
          className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };
  
  // Check if this is a regular booster with a streak
  const isStreakBooster = activity.type === 'regular' && activity.streak;
  
  return (
    <Card className={`
      overflow-hidden transition-all duration-200 hover:shadow-md
      ${activity.type === 'golden' ? 'border-yellow-200 dark:border-yellow-800/50' : 'border-blue-100 dark:border-blue-900/30'}
      ${activity.completed ? 'bg-gray-50/50 dark:bg-gray-900/20' : 'bg-white dark:bg-gray-900/10'}
      ${activity.eligible === true && !activity.completed ? 'border-l-4 border-l-green-400 dark:border-l-green-500' : ''}
    `}
    data-booster-id={activity.id}
    >
      <CardHeader className={`pb-2 ${activity.type === 'golden' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/10 dark:to-yellow-950/10' : ''}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`
              p-2 rounded-full 
              ${activity.type === 'golden' 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' 
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'}
              ${activity.eligible === true && !activity.completed ? 'ring-2 ring-green-400 dark:ring-green-500' : ''}
            `}>
              {getIconComponent(activity.icon)}
              {activity.eligible === true && !activity.completed && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <CardTitle className="text-base flex items-center">
                {activity.title}
                {activity.type === 'golden' && (
                  <span className="ml-2 text-yellow-500 dark:text-yellow-400 text-xs">✨ Golden</span>
                )}
                {activity.eligible === true && !activity.completed && (
                  <span className="ml-2 text-green-500 dark:text-green-400 text-xs animate-pulse">Ready to Claim</span>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {activity.description}
              </CardDescription>
            </div>
          </div>
          
          <Badge variant={activity.type === 'golden' ? 'default' : 'secondary'} className={`
            ${activity.type === 'golden' 
              ? 'bg-yellow-100 hover:bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50' 
              : 'bg-blue-50 hover:bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'}
          `}>
            +{activity.boost.toFixed(1)}x
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3 pb-3">
        {/* Progress bar for incomplete activities with progress */}
        {!activity.completed && activity.progress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Progress</span>
              <span className="font-medium">{activity.progress.current} / {activity.progress.target}</span>
            </div>
            <Progress
              value={(activity.progress.current / activity.progress.target) * 100}
              className={`h-1.5 ${activity.type === 'golden' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
            />
            {activity.eligible === false && activity.progress && (
              <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">
                {activity.progress.target - activity.progress.current} more to go!
              </p>
            )}
          </div>
        )}
        
        {/* Enhanced Streak info with a more sober design */}
        {activity.streak && (
          <div className="mb-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Streak: <span className="font-medium">{activity.streak.current}</span> day{activity.streak.current !== 1 ? 's' : ''}
                </span>
              </div>
              {activity.streak.current >= activity.streak.multiplier.threshold && (
                <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200">
                  +{activity.streak.multiplier.boost.toFixed(1)}x
                </Badge>
              )}
            </div>
            
            {/* Streak progress bar */}
            {renderStreakIndicator()}
            
            {/* Next milestone info */}
            {activity.streak.current < activity.streak.multiplier.threshold && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {activity.streak.multiplier.threshold - activity.streak.current} more day{activity.streak.multiplier.threshold - activity.streak.current !== 1 ? 's' : ''} for bonus
              </div>
            )}
          </div>
        )}
        
        {/* Refresh timer for repeatable actions */}
        {isRefreshable && !isReady && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Clock className="h-3 w-3" />
            <span>{formatTimeUntilAvailable()}</span>
          </div>
        )}
        
        {/* Eligibility status for non-eligible tasks */}
        {activity.eligible === false && !activity.completed && !activity.progress && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-2">
            <Info className="h-3 w-3" />
            <span>Complete this task to unlock the booster</span>
          </div>
        )}
        
        {/* Next level information */}
        {activity.completed && activity.next_level && (
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Next level: {activity.next_level.title}</span>
              <span className="font-medium">+{activity.next_level.boost.toFixed(1)}x</span>
            </div>
            <Progress
              value={(activity.next_level.current / activity.next_level.target) * 100}
              className={`h-1.5 ${activity.type === 'golden' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        {activity.completed ? (
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {isStreakBooster ? (
                <div className="flex flex-col">
                  <span>Completed for today</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Come back tomorrow to continue your streak</span>
                </div>
              ) : (
                <span>Completed</span>
              )}
            </div>
            
            {isRefreshable && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                disabled={!isReady || claiming}
                onClick={handleAction}
              >
                {claiming ? (
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                  </motion.div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Repeat
              </Button>
            )}
            
            {activity.next_level && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={handleAction}
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        ) : (
          <Button 
            variant={activity.type === 'golden' ? 'default' : 'secondary'}
            className={`w-full ${activity.type === 'golden' 
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white' 
              : ''
            }
            ${activity.eligible === true && !activity.completed ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-none' : ''}
            `}
            disabled={activity.eligible === true && (claiming || isProcessing)}
            onClick={handleAction}
          >
            {getButtonContent()}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Update AchievementCard props interface to match API data
interface AchievementCardProps {
  achievement: ApiAchievement;
}

// Update AchievementCard component to use API data structure
const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${achievement.unlocked ? 'border-green-200 dark:border-green-800/60' : 'border-purple-200 dark:border-purple-800/30'}`} 
          style={{ borderColor: achievement.unlocked ? `${achievement.display_color}40` : '' }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                 style={{ backgroundColor: `${achievement.display_color}20`, color: achievement.display_color }}>
              {getIconComponent(achievement.id.includes('invite') ? 'UserPlus' : achievement.id.includes('profile') ? 'User' : 'Award')}
            </div>
            <CardTitle className="text-base">{achievement.name}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-purple-50 hover:bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200"
                 style={{ backgroundColor: `${achievement.display_color}10`, color: achievement.display_color, borderColor: `${achievement.display_color}30` }}>
            {achievement.rarity}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-1 ml-10">{achievement.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-3 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="secondary" className="mr-2">
              {achievement.type}
            </Badge>
          </div>
          
          {achievement.unlocked && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400" style={{ color: achievement.display_color }}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span>Achievement Unlocked</span>
              {achievement.unlocked_at && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(achievement.unlocked_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
          
          {!achievement.unlocked && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Lock className="h-4 w-4 mr-1" />
              <span>Locked Achievement</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component to ensure drawer renders correctly on mobile
const MobileModalRenderer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  boosterData: AvailableBoostersResponse | null;
}> = ({ isOpen, onClose, boosterData }) => {
  const isMobile = useIsMobile();
  
  // Check for drawer elements and log their state
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    
    console.log('MobileModalRenderer: Modal opened, checking elements...');
    setTimeout(() => {
      const drawerContent = document.querySelector('.drawer-content');
      const drawerOverlay = document.querySelector('.drawer-overlay');
      
      console.log('Drawer content found:', !!drawerContent);
      console.log('Drawer overlay found:', !!drawerOverlay);
      
      if (drawerContent) {
        console.log('Drawer content display:', getComputedStyle(drawerContent).display);
        console.log('Drawer content visibility:', getComputedStyle(drawerContent).visibility);
        console.log('Drawer content z-index:', getComputedStyle(drawerContent).zIndex);
        
        // Force the drawer to be visible and positioned correctly
        (drawerContent as HTMLElement).style.display = 'flex';
        (drawerContent as HTMLElement).style.visibility = 'visible';
        (drawerContent as HTMLElement).style.zIndex = '9999';
        (drawerContent as HTMLElement).style.position = 'fixed';
        (drawerContent as HTMLElement).style.bottom = '0';
        (drawerContent as HTMLElement).style.left = '0';
        (drawerContent as HTMLElement).style.right = '0';
        (drawerContent as HTMLElement).style.transform = 'translateY(0)';
        (drawerContent as HTMLElement).style.backgroundColor = 'var(--background, white)';
        (drawerContent as HTMLElement).style.borderTopLeftRadius = '12px';
        (drawerContent as HTMLElement).style.borderTopRightRadius = '12px';
        (drawerContent as HTMLElement).style.boxShadow = '0 -4px 20px rgba(0, 0, 0, 0.15)';
        (drawerContent as HTMLElement).style.maxHeight = '80vh';
        (drawerContent as HTMLElement).style.overflowY = 'auto';
      }
      
      if (drawerOverlay) {
        console.log('Drawer overlay display:', getComputedStyle(drawerOverlay).display);
        console.log('Drawer overlay visibility:', getComputedStyle(drawerOverlay).visibility);
        console.log('Drawer overlay z-index:', getComputedStyle(drawerOverlay).zIndex);
        
        // Force the overlay to be visible
        (drawerOverlay as HTMLElement).style.display = 'block';
        (drawerOverlay as HTMLElement).style.visibility = 'visible';
        (drawerOverlay as HTMLElement).style.zIndex = '9998';
        (drawerOverlay as HTMLElement).style.opacity = '1';
        (drawerOverlay as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      }
    }, 100);
  }, [isOpen, isMobile]);
  
  if (!isMobile) return null;
  
  return isOpen ? (
    <BoosterDetailModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      boosterData={boosterData}
    />
  ) : null;
};

// Main booster page component
const BoosterPage: React.FC = () => {
  const [boosterData, setBoosterData] = useState<BoosterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const navigate = useNavigate();
  
  // State for API-based booster data (for modal)
  const [apiBoosterData, setApiBoosterData] = useState<AvailableBoostersResponse | null>(null);
  const [goldenBoosterStatus, setGoldenBoosterStatus] = useState<GoldenBoosterStatusResponse | null>(null);
  const [regularBoosterStatus, setRegularBoosterStatus] = useState<RegularBoosterStatusResponse | null>(null);
  const [isLoadingApiData, setIsLoadingApiData] = useState(false);
  // Add state for API achievements
  const [apiAchievements, setApiAchievements] = useState<ApiAchievement[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false);
  
  // New state for default tab value
  const [activeTab, setActiveTab] = useState<string>("golden");
  
  // Add a ref to track if we're on mobile
  const isMobileRef = useRef<boolean>(false);
  
  // ENB Wallet Modal state
  const [showENBWalletModal, setShowENBWalletModal] = useState(false);
  
  // SNI Wallet Modal state
  const [showSNIWalletModal, setShowSNIWalletModal] = useState(false);
  
  // Function to fetch all booster data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch achievements along with other data
      await fetchAchievementData();
      
      // Fetch the golden booster status API data
      const goldenStatus = await fetchGoldenBoosterStatus();
      setGoldenBoosterStatus(goldenStatus);
      
      // Fetch the regular booster status API data
      const regularStatus = await fetchRegularBoosterStatus();
      setRegularBoosterStatus(regularStatus);
      
      // Map the API data to our UI model
      if (goldenStatus && goldenStatus.success) {
        // Map golden boosters data
        const mappedGoldenActivities = goldenStatus.boosters.booster_details.map(booster => {
          const activity: BoosterActivity = {
            id: booster.type,
            type: "golden",
            title: booster.name,
            description: booster.description,
            boost: booster.boost,
            completed: booster.claimed,
            eligible: booster.eligible,
            icon: mapBoosterTypeToIcon(booster.type),
            prerequisites: [],
            action_url: booster.action_url || getActionUrl(booster.type),
          };
          
          // Add progress if available
          if (booster.progress) {
            activity.progress = {
              current: booster.progress.current,
              target: booster.progress.required
            };
          }
          
          // Add next level for invite_10_friends -> invite_20_friends
          if (booster.type === 'invite_10_friends') {
            // Find the invite_20_friends booster
            const invite20 = goldenStatus.boosters.booster_details.find(b => b.type === 'invite_20_friends');
            if (invite20 && invite20.progress) {
              activity.next_level = {
                id: 'invite_20_friends',
                title: invite20.name,
                boost: invite20.boost,
                current: invite20.progress.current,
                target: invite20.progress.required
              };
            }
          }
          
          return activity;
        });
        
        // Map regular boosters data
        let mappedRegularActivities: BoosterActivity[] = [];
        
        if (regularStatus && regularStatus.success) {
          // Map available regular boosters
          const availableRegularActivities = regularStatus.available_boosters.map(booster => {
            const activity: BoosterActivity = {
              id: booster.type,
              type: "regular",
              title: booster.name,
              description: getBoosterDescription(booster.type),
              boost: booster.boost,
              completed: false,
              eligible: booster.available,
              icon: mapBoosterTypeToIcon(booster.type),
              prerequisites: [],
              action_url: getActionUrl(booster.type),
            };
            
            // Add streak if available
            if (booster.streak) {
              activity.streak = {
                current: booster.streak,
                max_achieved: booster.streak, // Assume current is also max achieved
                multiplier: {
                  threshold: 5, // Default threshold
                  boost: 0.1 // Default boost per streak level
                }
              };
            }
            
            return activity;
          });
          
          // Map used or unavailable regular boosters
          const usedRegularActivities = regularStatus.used_or_unavailable_boosters.map(booster => {
            const activity: BoosterActivity = {
              id: booster.type,
              type: "regular",
              title: booster.name,
              description: getBoosterDescription(booster.type),
              boost: booster.boost,
              completed: booster.used,
              eligible: booster.available,
              icon: mapBoosterTypeToIcon(booster.type),
              prerequisites: [],
              action_url: getActionUrl(booster.type),
              requires_action: booster.requires_action
            };
            
            // Add streak if available
            if (booster.streak) {
              activity.streak = {
                current: booster.streak,
                max_achieved: booster.streak, // Assume current is also max achieved
                multiplier: {
                  threshold: 5, // Default threshold
                  boost: getNextStreamBoostIncrement(booster.type)
                }
              };
            }
            
            // If it requires action, add relevant info
            if (booster.requires_action) {
              activity.refresh = {
                type: "daily",
                next_available: null
              };
            }
            
            return activity;
          });
          
          // Merge and deduplicate
          const allRegularActivities = [...availableRegularActivities, ...usedRegularActivities];
          const uniqueIds = new Set();
          mappedRegularActivities = allRegularActivities.filter(activity => {
            if (uniqueIds.has(activity.id)) return false;
            uniqueIds.add(activity.id);
            return true;
          });
        }
        
        const mappedData: BoosterData = {
          success: true,
          boosters: {
            collected_boosters: 0, // Can be calculated if needed
            available_boosters: 0, // Can be calculated if needed
            total_boosters: goldenStatus.boosters.total_boost,
            collected_golden_boosters: goldenStatus.boosters.claimed_boosters.length,
            available_golden_boosters: goldenStatus.boosters.available_to_claim,
            total_golden_boosters: goldenStatus.boosters.booster_details.length,
            current_farming_rate: 1 + goldenStatus.boosters.total_boost, // Base rate (1) + boosters
            max_farming_rate: 1 + goldenStatus.boosters.booster_details.reduce((sum, b) => sum + b.boost, 0) // Base + all possible boosters
          },
          activities: [...mappedGoldenActivities, ...mappedRegularActivities],
          // Use an empty array for the achievements since we're using the API data directly
          achievements: []
        };
        
        setBoosterData(mappedData);
      } else {
        // Fallback to mock data if API fails
        const pageMockData = await mockFetchBoosterData();
        setBoosterData(pageMockData);
      }
      
      // Also fetch the API data for the modal
      await fetchApiBoosterData();
    } catch (error) {
      console.error('Error fetching booster data:', error);
      toast.error('Failed to load booster data');
      
      // Fallback to mock data if API fails
      const pageMockData = await mockFetchBoosterData();
      setBoosterData(pageMockData);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Update mobile detection
    isMobileRef.current = window.innerWidth <= 768;
    
    // Only hide bottom navigation, don't try to manipulate modals with CSS
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 768px) {
        .fixed.bottom-0:not([role="dialog"]), 
        nav.fixed.bottom-0, 
        nav.fixed.z-50:not([role="dialog"]),
        nav.bottom-0,
        .bottom-0:not(.md\\:hidden):not([role="dialog"]),
        [class*="navbar"][class*="bottom"],
        [class*="navigation"][class*="bottom"] {
          display: none !important;
        }
        
        body {
          overflow-x: hidden;
          padding-bottom: 0 !important;
          margin-bottom: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Fetch booster data on mount
    fetchData();
    
    return () => {
      // Clean up
      if (style && style.parentNode) {
        try {
          document.head.removeChild(style);
        } catch (e) {
          console.error('Error removing style element:', e);
        }
      }
    };
  }, []);
  
  // Map booster types to icons
  const mapBoosterTypeToIcon = (type: string): string => {
    switch (type) {
      case 'twitter_connect': return 'Twitter';
      case 'create_community': return 'Users';
      case 'complete_profile': return 'User';
      case 'join_5_communities': return 'Users';
      case 'invite_10_friends': return 'UserPlus';
      case 'join_discord': return 'MessageCircle';
      case 'enable_notifications': return 'Bell';
      case 'enable_mobile_notifications': return 'Bell';
      case 'enb_token_holder': return 'Coins';
      case 'refer_friends': return 'UserPlus';
      case 'daily_tweet': return 'Share2';
      case 'daily_check_in': return 'Calendar';
      case 'share_community': return 'Share2';
      case 'first_post': return 'PenTool';
      case 'buy_shares': return 'TrendingUp';
      case 'engage_posts': return 'ThumbsUp';
      case 'daily_upvote_streak': return 'UpvoteStreak';
      case 'daily_comment_streak': return 'CommentStreak';
      case 'daily_follow_streak': return 'FollowStreak';
      case 'daily_poll_creation': return 'BarChart3';
      case 'daily_poll_voting': return 'Vote';
      default: return 'Sparkles';
    }
  };
  
  // Get booster descriptions
  const getBoosterDescription = (type: string): string => {
    switch (type) {
      case 'twitter_connect': return 'Connect your Twitter account for a boost.';
      case 'create_community': return 'Start your own community.';
      case 'complete_profile': return 'Complete your profile details.';
      case 'join_5_communities': return 'Become a member of 5 communities.';
      case 'invite_10_friends': return 'Invite 10 friends to join.';
      case 'join_discord': return 'Join our Discord server.';
      case 'enable_notifications': return 'Enable push notifications.';
      case 'enable_mobile_notifications': return 'Download mobile app and enable notifications.';
      case 'enb_token_holder': return 'Hold 1000 or more ENB tokens to unlock this boost.';
      case 'refer_friends': return 'Refer friends to earn boosts.';
      case 'daily_tweet': return 'Tweet about us daily.';
      case 'daily_check_in': return 'Check in daily for rewards.';
      case 'daily_poll_creation': return 'Create a poll today for a 2x boost.';
      case 'daily_poll_voting': return 'Vote on 5 polls today for a 2x boost.';
      case 'share_community': return 'Share a community you like.';
      case 'first_post': return 'Make your first post.';
      case 'buy_shares': return 'Buy shares in a community.';
      case 'post_streak': return 'Create a new post daily to claim this booster';
      case 'roar_streak': return 'Roar to a post daily to claim this booster';
      case 'engage_posts': return 'Engage with posts in your feed.';
      case 'daily_upvote_streak': return 'Roar at posts daily to build a streak and earn bigger boosts';
      case 'daily_comment_streak': return 'Comment useful things on 5 posts daily to build a streak and earn bigger boosts';
      case 'daily_follow_streak': return 'Follow 5 new people daily to build a streak and earn bigger boosts';
      default: return 'Unlock this booster for more rewards!';
    }
  };
  
  // Get next streak boost increment
  const getNextStreamBoostIncrement = (type: string): number => {
    switch (type) {
      case 'daily_check_in': return 0.1;
      case 'daily_tweet': return 0.15;
      case 'daily_upvote_streak': return 0.25;
      case 'daily_comment_streak': return 0.25;
      case 'daily_follow_streak': return 0.25;
      default: return 0.1;
    }
  };
  
  // Get action URL for each booster type
  const getActionUrl = (type: string): string => {
    switch (type) {
      case 'twitter_connect': return '/connect/twitter';
      case 'create_community': return '/create-community';
      case 'complete_profile': return '/edit-profile';
      case 'join_5_communities': return '/communities';
      case 'invite_10_friends': return '/referral';
      case 'join_discord': return 'https://discord.gg/yourserver';
      case 'enable_notifications': return '/notifications/settings';
      case 'enable_mobile_notifications': return 'https://onelink.to/n6g5k2';
      case 'refer_friends': return '/referral';
      case 'daily_tweet': return '/share/twitter';
      case 'daily_check_in': return '/check-in';
      case 'share_community': return '/communities';
      case 'first_post': return '/feed';
      case 'buy_shares': return '/communities';
      case 'engage_posts': return '/feed';
      case 'daily_upvote_streak': return '/feed';
      case 'daily_comment_streak': return '/feed';
      case 'daily_follow_streak': return '/feed';
      case 'daily_poll_creation': return '/feed';
      case 'daily_poll_voting': return '/feed';
      default: return '/';
    }
  };
  
  // Function to fetch API booster data for modal
  const fetchApiBoosterData = async () => {
    try {
      setIsLoadingApiData(true);
      const data = await fetchAvailableBoosters();
      if (data && data.success) {
        setApiBoosterData(data);
      }
    } catch (error) {
      console.error('Error fetching API booster data:', error);
    } finally {
      setIsLoadingApiData(false);
    }
  };
  
  // Function to fetch achievement data from API
  const fetchAchievementData = async () => {
    try {
      setIsLoadingAchievements(true);
      console.log('Fetching achievements from API...');
      
      const achievementsData = await fetchAchievements();
      
      if (achievementsData && achievementsData.success) {
        console.log('Achievements fetched successfully:', achievementsData.achievements);
        setApiAchievements(achievementsData.achievements);
        
        // Log achievement data details for debugging
        achievementsData.achievements.forEach(achievement => {
          console.log(`Achievement: ${achievement.name}, Type: ${achievement.type}, Unlocked: ${achievement.unlocked}, Rarity: ${achievement.rarity}`);
        });
      } else {
        console.warn('Achievement API returned unsuccessful response:', achievementsData);
        // If API fails, use empty array
        setApiAchievements([]);
        toast.error('Could not load achievements', {
          description: 'Please try again later'
        });
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      setApiAchievements([]);
    } finally {
      setIsLoadingAchievements(false);
    }
  };
  
  const handleClaimBooster = async (boosterId: string) => {
    setIsProcessing(true);
    try {
      let result;
      let isRegularBooster = false;
      
      // Check if this is a regular or golden booster
      const boosterType = boosterId;
      // Add the new regular booster IDs to this list
      const regularBoosterTypes = [
        'daily_tweet', 
        'daily_checkin', 
        'post_streak', 
        'roar_streak', 
        'daily_upvote_streak', 
        'daily_comment_streak', 
        'daily_follow_streak',
        'daily_poll_creation',
        'daily_poll_voting'
      ];
      
      if (regularBoosterTypes.includes(boosterType)) {
        // It's a regular booster
        isRegularBooster = true;
        result = await claimRegularBooster(boosterType);
      } else {
        // It's a golden booster
        result = await claimGoldenBooster(boosterType);
      }
      
      if (result && result.success) {
        // Get booster amount for better feedback
        const boostAmount = isRegularBooster 
          ? (result.booster?.boost || 0) 
          : (result.boost_added || 0);
        
        // Create level up animation element
        const createLevelUpAnimation = () => {
          // Find the booster card element
          const boosterCard = document.querySelector(`[data-booster-id="${boosterId}"]`);
          if (!boosterCard) return;
          
          // Get the position of the card
          const rect = boosterCard.getBoundingClientRect();
          
          // Create a floating text element
          const floatingText = document.createElement('div');
          floatingText.textContent = `+${boostAmount.toFixed(1)}x BOOST!`;
          floatingText.style.position = 'fixed';
          floatingText.style.left = `${rect.left + rect.width / 2}px`;
          floatingText.style.top = `${rect.top + rect.height / 2}px`;
          floatingText.style.transform = 'translate(-50%, -50%)';
          floatingText.style.fontSize = '22px';
          floatingText.style.fontWeight = 'bold';
          floatingText.style.color = '#FFD700';
          floatingText.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.7)';
          floatingText.style.zIndex = '9999';
          floatingText.style.pointerEvents = 'none';
          floatingText.style.transition = 'all 1.5s ease-out';
          
          document.body.appendChild(floatingText);
          
          // Animate the text
          setTimeout(() => {
            floatingText.style.top = `${rect.top - 100}px`;
            floatingText.style.opacity = '0';
            floatingText.style.fontSize = '32px';
          }, 50);
          
          // Remove the element after animation
          setTimeout(() => {
            if (document.body.contains(floatingText)) {
              document.body.removeChild(floatingText);
            }
          }, 1500);
        };
        
        // Custom success messages for streaks
        let successMessage = 'Booster claimed successfully!';
        
        if (isRegularBooster && result.booster?.streak) {
          const streak = result.booster.streak;
          if (streak > 1) {
            successMessage = `${streak} Day Streak! 🔥`;
            
            // Add streak animation
            const createStreakAnimation = () => {
              const streakElem = document.createElement('div');
              streakElem.innerHTML = `<div class="text-center">
                <div class="text-4xl font-bold text-amber-500">${streak} DAY STREAK! 🔥</div>
                <div class="text-lg text-amber-400 mt-2">Keep it going!</div>
              </div>`;
              streakElem.style.position = 'fixed';
              streakElem.style.top = '50%';
              streakElem.style.left = '50%';
              streakElem.style.transform = 'translate(-50%, -50%) scale(0.5)';
              streakElem.style.zIndex = '9999';
              streakElem.style.opacity = '0';
              streakElem.style.transition = 'all 1s ease-out';
              streakElem.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              streakElem.style.borderRadius = '16px';
              streakElem.style.padding = '32px';
              streakElem.style.minWidth = '300px';
              streakElem.style.pointerEvents = 'none';
              
              document.body.appendChild(streakElem);
              
              // Animate
              setTimeout(() => {
                streakElem.style.opacity = '1';
                streakElem.style.transform = 'translate(-50%, -50%) scale(1)';
              }, 100);
              
              // Remove
              setTimeout(() => {
                streakElem.style.opacity = '0';
                streakElem.style.transform = 'translate(-50%, -50%) scale(1.2)';
              }, 2000);
              
              setTimeout(() => {
                if (document.body.contains(streakElem)) {
                  document.body.removeChild(streakElem);
                }
              }, 3000);
            };
            
            // Show streak animation for streaks
            createStreakAnimation();
          }
        }
        
        // Show success toast with the boost amount
        toast.success(successMessage, {
          description: `+${boostAmount}x boost added to your farming rate`,
          icon: <Sparkles className="h-5 w-5 text-yellow-500" />
        });
        
        // Create confetti effect
        createConfettiEffect();
        
        // Create level up animation
        createLevelUpAnimation();
        
        // Refresh data
        if (isRegularBooster) {
          const regularStatus = await fetchRegularBoosterStatus();
          setRegularBoosterStatus(regularStatus);
        } else {
          const goldenStatus = await fetchGoldenBoosterStatus();
          setGoldenBoosterStatus(goldenStatus);
        }
        
        // Refresh all data
        fetchData();
        
        // Also refresh the API data for the modal
        await fetchApiBoosterData();
      } else {
        // Show error toast
        toast.error(result?.message || 'Failed to claim booster');
      }
    } catch (error) {
      console.error('Error claiming booster:', error);
      toast.error('Failed to claim booster');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Create a confetti effect when claiming boosters
  const createConfettiEffect = (isLarge = false) => {
    // We'll use the canvas element to create the confetti effect
    const canvas = document.createElement('canvas');
    const container = document.createElement('div');
    
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    
    container.appendChild(canvas);
    document.body.appendChild(container);
    
    const ctx = canvas.getContext('2d');
    
    // Confetti colors - gold, amber, yellow theme
    const colors = [
      '#FFD700', // Gold
      '#FFC107', // Amber
      '#FFEB3B', // Yellow
      '#FFD54F', // Amber Light
      '#FFF9C4', // Yellow Light
      '#FFB74D'  // Orange Light
    ];

    // Add some emoji confetti too
    const emojis = isLarge ? ['🦁', '✨', '🎉', '🚀', '💎', '🔥'] : ['✨', '🎉', '🚀'];
    
    // Confetti particles
    const particles: any[] = [];
    
    // Generate more particles for larger effect
    const particleCount = isLarge ? 200 : 100;
    const emojiCount = isLarge ? 30 : 15;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        radius: Math.random() * 4 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }
    
    // Add emoji particles
    for (let i = 0; i < emojiCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: Math.random() * 20 + 10,
        speed: Math.random() * 2 + 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1,
        shape: 'emoji'
      });
    }
    
    // Add sound effect
    const playSound = () => {
      try {
        const audio = new Audio('/success.mp3');
        audio.volume = 0.3; // Set a reasonable volume
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (e) {
        console.log('Audio creation failed:', e);
      }
    };
    
    // Try to play sound (will fail silently if no sound file)
    playSound();
    
    // Animation function
    let animationFrame: number;
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speed;
        p.rotation += p.rotationSpeed;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        
        if (p.shape === 'emoji') {
          ctx.font = `${p.size}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.emoji, 0, 0);
        } else if (p.shape === 'circle') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        }
        
        ctx.restore();
      }
      
      // Check if all particles are off-screen
      const allOffScreen = particles.every(p => p.y > canvas.height);
      
      if (allOffScreen) {
        cancelAnimationFrame(animationFrame);
        document.body.removeChild(container);
      } else {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    // Create a pulse effect in the background
    const createPulseEffect = () => {
      const pulse = document.createElement('div');
      pulse.style.position = 'fixed';
      pulse.style.top = '0';
      pulse.style.left = '0';
      pulse.style.right = '0';
      pulse.style.bottom = '0';
      pulse.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
      pulse.style.opacity = '0';
      pulse.style.pointerEvents = 'none';
      pulse.style.zIndex = '9998';
      pulse.style.transition = 'opacity 0.3s ease-in-out';
      
      document.body.appendChild(pulse);
      
      // Animate the pulse
      setTimeout(() => { pulse.style.opacity = '0.2'; }, 0);
      setTimeout(() => { pulse.style.opacity = '0'; }, 300);
      setTimeout(() => { 
        if (document.body.contains(pulse)) {
          document.body.removeChild(pulse);
        }
      }, 600);
    };
    
    createPulseEffect();
    
    // Remove after timeout as a fallback
    setTimeout(() => {
      cancelAnimationFrame(animationFrame);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }, 5000);
  };
  
  // Handle booster modal click with special handling for mobile
  const handleShowBoosterModal = () => {
    console.log('handleShowBoosterModal called, isMobile:', window.innerWidth <= 768);
    
    // Force load data if needed
    if (!apiBoosterData) {
      console.log('No booster data, fetching first...');
      fetchApiBoosterData().then(() => {
        console.log('Data fetched, now opening modal');
        setShowRateModal(true);
      });
      return;
    }

    // Just open modal, our MobileModalRenderer will handle mobile-specific behavior
    console.log('Opening modal directly');
    setShowRateModal(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <Sparkles className="h-8 w-8 text-amber-500" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Loading boosters...</p>
        </div>
      </div>
    );
  }
  
  if (!boosterData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load boosters</h2>
          <p className="text-muted-foreground mb-4">Please try again later</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
  
  const { boosters, activities } = boosterData;
  
  // Filter activities by type
  const goldenBoosters = activities.filter(activity => activity.type === 'golden');
  const regularBoosters = activities.filter(activity => activity.type === 'regular');
  
  // Calculate overall completion percentage
  const totalCompleted = activities.filter(a => a.completed).length;
  const totalActivities = activities.length;
  const completionPercentage = (totalCompleted / totalActivities) * 100;
  
  // Extract data needed for rendering
  const isLoadingAny = isLoading || isLoadingApiData || isLoadingAchievements;
  const hasAchievements = apiAchievements && apiAchievements.length > 0;
  
  return (
    <>
      <Helmet>
        <title>Booster Hub | Roar Communities</title>
      </Helmet>
      
      {/* Render desktop modal */}
      {!isMobileRef.current && (
        <BoosterDetailModal 
          open={showRateModal} 
          onOpenChange={setShowRateModal} 
          boosterData={apiBoosterData}
        />
      )}
      
      {/* Render mobile modal with our helper component */}
      <MobileModalRenderer
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        boosterData={apiBoosterData}
      />
      
      <div className="container max-w-3xl mx-auto px-4 py-6 mt-14 pb-20 overflow-x-hidden">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Link 
              to="/roar-farming"
              className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground mr-2"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Back to Farming
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Booster Hub
            </h1>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShowBoosterModal}
              className="flex items-center gap-2 bg-amber-100/60 hover:bg-amber-200/70 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-800/40 dark:text-amber-300 px-3 rounded-full border border-amber-300/30 dark:border-amber-700/30"
            >
              <span className="font-bold">{apiBoosterData ? apiBoosterData.effective_total.toFixed(1) : boosters.current_farming_rate.toFixed(1)}x</span>
              <Info className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <p className="text-muted-foreground">Complete activities to boost your farming rate</p>
        </div>
        
        {/* Completion Summary */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Completion Progress</h2>
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/30">
              {totalCompleted} / {totalActivities} Completed
            </Badge>
          </div>
          
          <Progress 
            value={completionPercentage} 
            className="h-2 bg-gray-100 dark:bg-gray-800"
          />
        </div>
        
        {/* Mobile Optimized Tabs with horizontal scroll */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <TabsList className="mb-4 bg-gray-100 dark:bg-gray-800/50 w-full md:w-auto flex justify-between min-w-[480px]">
              <TabsTrigger 
                value="golden" 
                className="flex-1 py-3 px-4 text-base data-[state=active]:bg-yellow-100 dark:data-[state=active]:bg-yellow-900/30 data-[state=active]:text-yellow-800 dark:data-[state=active]:text-yellow-300"
              >
                <Gift className="h-4 w-4 mr-2" />
                Golden Boosters
              </TabsTrigger>
              <TabsTrigger 
                value="regular" 
                className="flex-1 py-3 px-4 text-base data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-300"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Regular Boosters
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="flex-1 py-3 px-4 text-base data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-800 dark:data-[state=active]:text-purple-300"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="golden" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {goldenBoosters.map(booster => (
                <motion.div
                  key={booster.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BoosterCard 
                    activity={booster} 
                    onClaim={handleClaimBooster}
                    isProcessing={isProcessing}
                    showENBModal={() => setShowENBWalletModal(true)}
                    showSNIModal={() => setShowSNIWalletModal(true)}
                  />
                </motion.div>
              ))}
              
              {/* Link to explore regular boosters */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Button 
                  variant="outline" 
                  className="w-full py-6 border-dashed border-2 border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/20 group transition-all duration-300"
                  onClick={() => setActiveTab("regular")}
                >
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800/30 group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-center">Explore Regular Boosters</span>
                    <div className="px-2 py-0.5 mt-1 rounded-full bg-blue-100/80 dark:bg-blue-800/30 text-xs text-blue-700 dark:text-blue-300">
                      {regularBoosters.filter(b => b.completed).length}/{regularBoosters.length} completed
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="regular" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {regularBoosters.map((booster, index) => (
                <motion.div
                  key={booster.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <BoosterCard 
                    activity={booster} 
                    onClaim={handleClaimBooster}
                    isProcessing={isProcessing}
                    showENBModal={() => setShowENBWalletModal(true)}
                    showSNIModal={() => setShowSNIWalletModal(true)}
                  />
                </motion.div>
              ))}
              
              {/* Link to explore achievements */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Button 
                  variant="outline" 
                  className="w-full py-6 border-dashed border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/20 group transition-all duration-300"
                  onClick={() => setActiveTab("achievements")}
                >
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-800/30 group-hover:scale-110 transition-transform duration-300">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <span className="text-center">View Your Achievements</span>
                    <div className="px-2 py-0.5 mt-1 rounded-full bg-purple-100/80 dark:bg-purple-800/30 text-xs text-purple-700 dark:text-purple-300">
                      {apiAchievements.filter(a => a.unlocked).length}/{apiAchievements.length} unlocked
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {isLoadingAchievements ? (
                // Loading state
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 h-9 w-9"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2 ml-10"></div>
                    </CardHeader>
                    <CardContent className="pt-3 pb-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </CardContent>
                  </Card>
                ))
              ) : apiAchievements.length > 0 ? (
                // Render achievements from API
                apiAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  </motion.div>
                ))
              ) : (
                // No achievements found
                <div className="text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <Trophy className="h-10 w-10 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No Achievements Yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Keep participating in communities to unlock achievements!
                  </p>
                </div>
              )}
              
              {/* Placeholder for future achievements */}
              {apiAchievements.length > 0 && (
                <div className="text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg mt-4">
                  <Trophy className="h-10 w-10 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">More Achievements Coming Soon</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Keep participating in communities to unlock future achievements!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Fixed action button for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-gray-200 dark:border-gray-800 shadow-lg z-50">
          <Button 
            onClick={() => navigate('/roar-farming')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Return to Farming
          </Button>
        </div>
      </div>
      
      {/* ENB Wallet Modal */}
      <ENBWalletModal
        isOpen={showENBWalletModal}
        onClose={() => setShowENBWalletModal(false)}
        onSuccess={() => {
          // Refresh booster data when wallet is successfully linked and eligible
          fetchData();
        }}
      />
      
      {/* SNI Wallet Modal */}
      <SNIWalletModal
        isOpen={showSNIWalletModal}
        onClose={() => setShowSNIWalletModal(false)}
        onSuccess={() => {
          // Refresh booster data when wallet is successfully linked and eligible
          fetchData();
        }}
      />
    </>
  );
};

export default BoosterPage; 