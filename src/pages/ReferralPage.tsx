import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  CopyIcon, 
  Share2, 
  Gift, 
  Sparkles, 
  Users, 
  Trophy,
  CheckCircle2, 
  XIcon,
  Facebook,
  Send,
  Zap,
  User,
  ArrowRight,
  Link as LinkIcon,
  Wallet,
  Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { shareToSocialMedia, SharePlatform } from '@/utils/shareUtils';
import { useResponsive } from '@/hooks/use-mobile';
import { createAuthHeaders } from '@/utils/apiBase';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

// Define types for API responses
interface ReferralEarnings {
  wallet: string;
  referral_earnings: number;
  address_balance: number;
  total_withdrawn: number;
  available_to_withdraw: number;
}

interface InvitedUser {
  id: number;
  handle: string;
  avatar_url: string | null;
  invited_on: string;
}

interface InvitedUsersResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  invited_users: InvitedUser[];
}

// Add WhatsApp icon component
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="text-[#25D366]">
    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

// Add X icon component with the proper logo
const XLogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"></path>
  </svg>
);

const ReferralPage = () => {
  const { isMobile } = useResponsive();
  const [copied, setCopied] = useState(false);
  const [rewardsClaimable, setRewardsClaimable] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  
  // User data
  const [userHandle, setUserHandle] = useState<string>('');
  
  // API data states
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState<ReferralEarnings | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [totalInvites, setTotalInvites] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Generate referral URL with user handle
  const referralUrl = userHandle ? `dapps.co/invite/${userHandle.toLowerCase()}` : 'dapps.co/invite';
  
  useEffect(() => {
    // Get user handle from local storage
    const storedHandle = localStorage.getItem('dapps_user_handle');
    if (storedHandle) {
      setUserHandle(storedHandle);
    }
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use relative proxy path for earnings
        const earningsResponse = await fetch('/api/referral_earnings', {
          credentials: 'include' // Add credentials
        });
        if (!earningsResponse.ok) throw new Error('Failed to fetch earnings');
        const earningsData = await earningsResponse.json();
        if (earningsData.success) {
          setEarnings(earningsData);
          // Set rewards claimable if available to withdraw > 0
          setRewardsClaimable(earningsData.available_to_withdraw > 0);
        } else {
          throw new Error(earningsData.message || 'Could not load earnings');
        }
        
        // Use relative proxy path for invited users
        const invitedUsersResponse = await fetch('/api/invited_users?page=1&limit=20', {
          credentials: 'include' // Add credentials
        });
        if (!invitedUsersResponse.ok) throw new Error('Failed to fetch invited users');
        const invitedUsersData = await invitedUsersResponse.json();
        if (invitedUsersData.success) {
          setInvitedUsers(invitedUsersData.invited_users);
          setTotalInvites(invitedUsersData.total);
        } else {
          throw new Error(invitedUsersData.message || 'Could not load invited users');
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  // Add confetti burst function
  const triggerConfetti = (intensity = 'medium') => {
    const options = {
      particleCount: intensity === 'high' ? 150 : intensity === 'medium' ? 100 : 50,
      spread: intensity === 'high' ? 90 : intensity === 'medium' ? 70 : 50,
      origin: { y: 0.6 },
      colors: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899']
    };
    
    confetti(options);
  };
  
  // Enhanced copy function
  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    
    // Show success toast
    toast.success("Invite link copied!");
    
    // Show copy notification
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
    
    // Trigger enhanced confetti effect
    triggerConfetti('medium');
    
    // Reset copied state after 2s
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = (platform: SharePlatform) => {
    const options = {
      url: referralUrl,
      title: 'Join me on dapps.co',
      text: 'Skip the waitlist and get a free share! Join me on dapps.co'
    };
    
    shareToSocialMedia(platform, options).then((success) => {
      if (success && platform === 'copy') {
        toast.success("Link copied to clipboard!");
      } else if (success) {
        toast.success(`Shared successfully to ${platform}!`);
        
        // Trigger small confetti burst on successful share
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 }
        });
      }
    });
  };

  const handleClaimRewards = async () => {
    if (!earnings || !rewardsClaimable) return;
    
    setIsClaimingRewards(true);
    
    try {
      // Use relative proxy path
      const response = await fetch('/api/claim_referral_rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Keep content type for POST
        credentials: 'include' // Add credentials
      });
      
      if (!response.ok) throw new Error('Failed to claim rewards');
      
      const data = await response.json();
      if (data.success) {
        setEarnings(prev => {
          if (!prev) return null;
          return {
            ...prev,
            referral_earnings: prev.referral_earnings,
            available_to_withdraw: 0,
            total_withdrawn: prev.total_withdrawn + prev.available_to_withdraw
          };
        });
        
        setRewardsClaimable(false);
        
        // Success animation
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#10B981', '#F59E0B']
        });
        
        toast.success("Rewards claimed successfully!");
      } else {
        throw new Error(data.message || 'Failed to claim rewards');
      }
    } catch (err) {
      console.error('Error claiming rewards:', err);
      toast.error('Failed to claim rewards');
    } finally {
      setIsClaimingRewards(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (err) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto px-4 pb-20 pt-20">
      {/* Header Section with animated background */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-5 border border-primary/20 relative overflow-hidden"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {/* Animated background elements */}
        <motion.div 
          className="absolute -top-16 -right-16 w-32 h-32 bg-primary/20 rounded-full blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
        ></motion.div>
        <motion.div 
          className="absolute -bottom-20 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", delay: 1 }}
        ></motion.div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <motion.h1 
              className="text-2xl font-bold flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Gift className="h-6 w-6 text-primary" />
              </motion.div>
              Share the Love
            </motion.h1>
            <p className="text-sm max-w-sm">
              Skip the 75,000+ waitlist for your friends and earn rewards
            </p>
          </div>
          
          <motion.div 
            className="bg-primary/15 px-3 py-2 rounded-lg border border-primary/30 text-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-sm text-muted-foreground">Your Invites</div>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mx-auto" />
            ) : (
              <motion.div 
                className="text-2xl font-bold text-primary"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                {totalInvites}
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
      
      {/* Invite Link + Rewards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invite Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -3 }}
        >
          <Card className="border-primary/20 relative overflow-hidden shadow-md">
            <motion.div 
              className="absolute top-0 right-0 w-48 h-48 -mt-20 -mr-20 bg-primary/5 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
            ></motion.div>
            
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-xl">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, repeatType: "loop", repeatDelay: 3 }}
                >
                  <LinkIcon className="h-5 w-5 text-primary" />
                </motion.div>
                Your Invite Link
              </CardTitle>
              <CardDescription className="text-sm">
                Share to give friends <span className="font-medium text-primary">instant access</span> and <span className="font-medium text-primary">500 🦁</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-3 pt-4">
              <div className="relative">
                {showCopyNotification && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1.5 rounded-md shadow-lg z-10 flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Copied!</span>
                  </motion.div>
                )}
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Input
                        value={referralUrl}
                        readOnly
                        className="pr-20 py-5 text-base font-medium border-primary/20 bg-muted/30"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-0 top-0 h-full border-l border-primary/10 rounded-none px-3 text-primary"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        ) : (
                          <CopyIcon className="h-4 w-4 mr-1" />
                        )}
                        {isMobile ? '' : (copied ? 'Copied!' : 'Copy')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() => handleShare('twitter')}
                    >
                      <XLogoIcon />
                      {!isMobile && <span className="truncate hidden md:hidden">X</span>}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() => handleShare('whatsapp')}
                    >
                      <WhatsAppIcon />
                      {!isMobile && <span className="truncate hidden md:hidden">WhatsApp</span>}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() => handleShare('telegram')}
                    >
                      <Send className="h-4 w-4 text-[#26A5E4]" />
                      {!isMobile && <span className="truncate hidden md:hidden">Telegram</span>}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() => handleShare('farcaster')}
                    >
                      <Zap className="h-4 w-4 text-purple-500" />
                      {!isMobile && <span className="truncate hidden md:hidden">Farcaster</span>}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0 pb-4">
              <motion.div 
                className="text-xs text-muted-foreground text-center w-full font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                New users get <span className="font-medium text-primary">500 🦁</span> and you earn <span className="font-medium text-primary">2% of all buy amounts</span> from your referrals forever!
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
        
        {/* Rewards Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-primary/20 h-full">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="h-5 w-5 text-primary" />
                Your Rewards
              </CardTitle>
              <CardDescription className="text-sm">
                Track your earnings from invites
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Total Earned */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between rounded-lg p-3 bg-gradient-to-r from-primary/5 to-transparent border border-primary/10"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 bg-primary/10 rounded-full">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">Total Earned</span>
                    </div>
                    <motion.div 
                      className="text-xl font-bold text-primary"
                      animate={isClaimingRewards ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: isClaimingRewards ? Infinity : 0, duration: 0.5 }}
                    >
                      {earnings?.referral_earnings.toFixed(4)} ETH
                    </motion.div>
                  </motion.div>
                  
                  {/* Available Rewards */}
                  {earnings && earnings.available_to_withdraw > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="p-1.5 bg-amber-500/10 rounded-full">
                          <Wallet className="h-4 w-4 text-amber-500" />
                        </div>
                        <span className="font-medium">Available Rewards</span>
                      </div>
                      <motion.div 
                        className="text-xl font-bold text-amber-500"
                        animate={rewardsClaimable && !isClaimingRewards ? { 
                          scale: [1, 1.05, 1],
                        } : {}}
                        transition={{ 
                          repeat: rewardsClaimable && !isClaimingRewards ? Infinity : 0, 
                          duration: 1.5 
                        }}
                      >
                        {earnings.available_to_withdraw.toFixed(4)} ETH
                      </motion.div>
                    </motion.div>
                  )}
                  
                  {earnings && earnings.available_to_withdraw > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button 
                        variant={rewardsClaimable ? "default" : "outline"}
                        className="w-full"
                        disabled={!rewardsClaimable || isClaimingRewards}
                        onClick={handleClaimRewards}
                      >
                        {isClaimingRewards ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="mr-1.5"
                            >
                              <Sparkles className="h-4 w-4" />
                            </motion.div>
                            Claiming Rewards...
                          </>
                        ) : rewardsClaimable ? (
                          <>Claim Rewards</>
                        ) : (
                          <>No Rewards Available</>
                        )}
                      </Button>
                    </motion.div>
                  )}
                  
                  {/* Stats */}
                  <motion.div 
                    className="grid grid-cols-2 gap-3 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="bg-muted/40 rounded-lg p-3 text-center border border-border/50">
                      <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <div className="text-xl font-bold">{totalInvites}</div>
                      <div className="text-xs text-muted-foreground">Total Invites</div>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 text-center border border-border/50">
                      <Wallet className="h-4 w-4 mx-auto mb-1 text-green-500" />
                      <div className="text-xl font-bold">{earnings?.total_withdrawn.toFixed(4) || '0.0000'}</div>
                      <div className="text-xs text-muted-foreground">Total Withdrawn</div>
                    </div>
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              How Invites Work
            </CardTitle>
            <CardDescription className="text-sm">
              Key benefits of our referral program
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div 
                className="rounded-lg border border-primary/20 p-4 relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent"
                whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.2)" }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <motion.div 
                  className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full -mt-8 -mr-8 blur-xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                ></motion.div>
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    y: [0, -3, 0]
                  }}
                  transition={{ duration: 5, repeat: Infinity, repeatType: "loop", repeatDelay: 3 }}
                >
                  <Gift className="h-8 w-8 text-primary mb-3" />
                </motion.div>
                <h3 className="font-semibold text-lg mb-1">For Your Friends</h3>
                <p className="text-sm text-muted-foreground">
                  They <span className="text-foreground font-medium">skip the 75,000+ waitlist</span> and get <span className="text-foreground font-medium">instant access</span>.
                </p>
              </motion.div>
              
              <motion.div 
                className="rounded-lg border border-primary/20 p-4 relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full -mt-8 -mr-8 blur-xl"></div>
                <Sparkles className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-1">Free Share</h3>
                <p className="text-sm text-muted-foreground">
                  Your friends receive <span className="text-foreground font-medium">500 🦁</span> and a <span className="text-foreground font-medium">free share in a community</span> when they join.
                </p>
              </motion.div>
              
              <motion.div 
                className="rounded-lg border border-primary/20 p-4 relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full -mt-8 -mr-8 blur-xl"></div>
                <Trophy className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-1">You Earn</h3>
                <p className="text-sm text-muted-foreground">
                  You earn <span className="text-foreground font-medium">2% of all buy amounts</span> from your referrals forever!
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Invited Users Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-10"
      >
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
              >
                <Users className="h-5 w-5 text-primary" />
              </motion.div>
              Your Invites
            </CardTitle>
            <CardDescription className="text-sm">
              People you've invited to dapps.co
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : invitedUsers.length > 0 ? (
              <div className="space-y-3">
                {invitedUsers.map((user, index) => (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index + 0.5 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-primary/5 transition-colors"
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 5px 15px -5px rgba(0, 0, 0, 0.1)"
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={user.avatar_url || `https://avatar.vercel.sh/${user.handle}`} />
                        <AvatarFallback>{user.handle[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">@{user.handle}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs flex items-center gap-1.5 text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {formatDate(user.invited_on)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="text-center p-8 border border-dashed border-primary/20 rounded-lg bg-muted/10"
                whileHover={{ scale: 1.01 }}
              >
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "loop" }}
                  className="mx-auto mb-3"
                >
                  <Users className="h-12 w-12 text-primary/60 mx-auto" />
                </motion.div>
                <h3 className="text-lg font-medium mb-2">No invites yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                  Start sharing your invite link with friends to earn rewards!
                </p>
                <Button 
                  variant="outline" 
                  className="border-primary/20 text-primary"
                  onClick={handleCopy}
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy Invite Link
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReferralPage;
