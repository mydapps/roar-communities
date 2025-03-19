
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
  Wallet
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { shareToSocialMedia, SharePlatform } from '@/utils/shareUtils';
import { useResponsive } from '@/hooks/use-mobile';

const ReferralPage = () => {
  const { isMobile } = useResponsive();
  const [copied, setCopied] = useState(false);
  const [rewardsClaimable, setRewardsClaimable] = useState(true);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  
  // Reward state
  const [totalEarned, setTotalEarned] = useState(1.25);
  const [availableRewards, setAvailableRewards] = useState(0.18);
  
  const referralUrl = 'dapps.co/invite/abc';
  const totalReferrals = 8;
  const activeReferrals = 5;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    
    // Show success toast
    toast.success("Invite link copied!");
    
    // Show copy notification
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
    
    // Trigger confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
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

  const handleClaimRewards = () => {
    setIsClaimingRewards(true);
    
    // Animate reward claiming
    let tempAvailable = availableRewards;
    const claimAnimation = setInterval(() => {
      if (tempAvailable <= 0.01) {
        clearInterval(claimAnimation);
        setAvailableRewards(0);
        setTotalEarned((prev) => prev + tempAvailable);
        setIsClaimingRewards(false);
        setRewardsClaimable(false);
        
        // Success animation
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#10B981', '#F59E0B']
        });
        
        toast.success("Rewards claimed successfully!");
        return;
      }
      
      const increment = 0.01;
      tempAvailable -= increment;
      
      setAvailableRewards(tempAvailable);
      setTotalEarned((prev) => prev + increment);
    }, 50);
  };
  
  // Sample data for referral history
  const referralHistory = [
    { username: "alex.eth", date: "2023-08-15", amount: 0.35, active: true },
    { username: "jenny.sol", date: "2023-09-02", amount: 0.28, active: true },
    { username: "max.btc", date: "2023-09-10", amount: 0.42, active: true },
    { username: "sarah.avax", date: "2023-09-18", amount: 0.12, active: true },
    { username: "tom.arb", date: "2023-09-25", amount: 0.08, active: true },
    { username: "jessica.matic", date: "2023-10-05", amount: 0, active: false },
    { username: "mike.op", date: "2023-10-12", amount: 0, active: false },
    { username: "lily.base", date: "2023-10-19", amount: 0, active: false }
  ];

  return (
    <div className="space-y-5 max-w-3xl mx-auto px-4 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-20 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Share the Love
            </h1>
            <p className="text-sm max-w-sm">
              Skip the 75,000+ waitlist for your friends and earn rewards
            </p>
          </div>
          
          <motion.div 
            className="bg-primary/10 px-3 py-2 rounded-lg border border-primary/20 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-sm text-muted-foreground">Your Invites</div>
            <div className="text-2xl font-bold text-primary">{totalReferrals}</div>
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
        >
          <Card className="border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 -mt-20 -mr-20 bg-primary/5 rounded-full blur-2xl"></div>
            
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-xl">
                <LinkIcon className="h-5 w-5 text-primary" />
                Your Invite Link
              </CardTitle>
              <CardDescription className="text-sm">
                Share to give friends <span className="font-medium text-primary">instant access</span> and a <span className="font-medium text-primary">free share</span>
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
                      <XIcon className="h-4 w-4 text-[#1DA1F2]" />
                      {!isMobile && <span className="truncate">X</span>}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() => handleShare('facebook')}
                    >
                      <Facebook className="h-4 w-4 text-[#1877F2]" />
                      {!isMobile && <span className="truncate">Facebook</span>}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() => handleShare('telegram')}
                    >
                      <Send className="h-4 w-4 text-[#26A5E4]" />
                      {!isMobile && <span className="truncate">Telegram</span>}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center justify-center gap-1.5 min-w-0"
                      onClick={() => handleShare('farcaster')}
                    >
                      <Zap className="h-4 w-4 text-purple-500" />
                      {!isMobile && <span className="truncate">Farcaster</span>}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0 pb-4">
              <motion.div 
                className="text-xs text-muted-foreground text-center w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                You earn <span className="font-medium text-primary">2% of all buy amounts</span> from your referrals forever!
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
              <div className="space-y-4">
                {/* Total Earned */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between"
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
                    {totalEarned.toFixed(2)} ETH
                  </motion.div>
                </motion.div>
                
                {/* Available Rewards */}
                {availableRewards > 0 && (
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
                      {availableRewards.toFixed(2)} ETH
                    </motion.div>
                  </motion.div>
                )}
                
                {availableRewards > 0 && (
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
                    <div className="text-xl font-bold">{totalReferrals}</div>
                    <div className="text-xs text-muted-foreground">Total Invites</div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 text-center border border-border/50">
                    <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <div className="text-xl font-bold">{activeReferrals}</div>
                    <div className="text-xs text-muted-foreground">Active Invites</div>
                  </div>
                </motion.div>
              </div>
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
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              How Invites Work
            </CardTitle>
            <CardDescription className="text-sm">
              Key benefits of our referral program
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div 
                className="rounded-lg border border-primary/20 p-4 relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full -mt-8 -mr-8 blur-xl"></div>
                <Gift className="h-8 w-8 text-primary mb-3" />
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
                  Your friends receive a <span className="text-foreground font-medium">free share in a community</span> when they join.
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
      
      {/* Recent Referrals Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-10"
      >
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" />
              Recent Invites
            </CardTitle>
            <CardDescription className="text-sm">
              Your most recent referrals and their status
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {referralHistory.slice(0, isMobile ? 3 : 5).map((referral, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.5 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${referral.username}`} />
                      <AvatarFallback>{referral.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{referral.username}</div>
                      <div className="text-xs text-muted-foreground">{referral.date}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      {referral.amount > 0 ? (
                        <span className="text-primary">{referral.amount.toFixed(2)} ETH</span>
                      ) : "-"}
                    </div>
                    <div className="text-xs">
                      {referral.active ? (
                        <span className="text-green-600 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* View More Button (mobile only) */}
              {isMobile && totalReferrals > 3 && (
                <Button variant="outline" size="sm" className="w-full mt-2 text-primary">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  View All {totalReferrals} Invites
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReferralPage;
