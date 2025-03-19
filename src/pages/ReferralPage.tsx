
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CopyIcon, 
  Share2, 
  Gift, 
  Sparkles, 
  Users, 
  Rocket, 
  Trophy, 
  Link,
  ArrowRight,
  CheckCircle2,
  Twitter,
  Facebook,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const ReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const [animateShare, setAnimateShare] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [rewardsClaimable, setRewardsClaimable] = useState(true);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  
  const referralUrl = 'dapps.co/invite/abc';
  
  // Reward state
  const [totalEarned, setTotalEarned] = useState(1.25);
  const [availableRewards, setAvailableRewards] = useState(0.18);
  const [progressEarned, setProgressEarned] = useState(0);
  const [progressAvailable, setProgressAvailable] = useState(0);
  
  const totalReferrals = 8;
  const activeReferrals = 5;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    
    // Show success toast
    toast.success("Invite link copied to clipboard!");
    
    // Trigger confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Reset copied state after 2s
    setTimeout(() => setCopied(false), 2000);
    
    // Show success message briefly
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };
  
  const handleShare = () => {
    setAnimateShare(true);
    setTimeout(() => setAnimateShare(false), 500);
    
    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Join me on dapps.co',
        text: 'Skip the waitlist and get a free share! Join me on dapps.co',
        url: referralUrl,
      }).catch(() => {
        // Fallback to copying to clipboard if share fails or is cancelled
        handleCopy();
      });
    } else {
      // Fallback to copying to clipboard
      handleCopy();
    }
  };

  const handleClaimRewards = () => {
    setIsClaimingRewards(true);
    
    // Animate reward claiming
    const claimAnimation = setInterval(() => {
      setProgressAvailable((prev) => {
        const newValue = Math.max(0, prev - 3);
        return newValue;
      });
      
      setTotalEarned((prev) => prev + 0.005);
    }, 50);
    
    // Simulate API call with timeout
    setTimeout(() => {
      clearInterval(claimAnimation);
      
      // Success animation
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#10B981', '#F59E0B']
      });
      
      toast.success("Rewards claimed successfully!");
      setIsClaimingRewards(false);
      setRewardsClaimable(false);
      setAvailableRewards(0);
      setProgressAvailable(0);
    }, 1500);
  };
  
  // Animate progress bars on mount
  useEffect(() => {
    setTimeout(() => setProgressEarned(85), 300);
    setTimeout(() => setProgressAvailable(15), 600);
  }, []);

  // Sample data for referral history
  const referralHistory = [
    { 
      username: "alex.eth", 
      date: "2023-08-15", 
      amount: 0.35,
      active: true 
    },
    { 
      username: "jenny.sol", 
      date: "2023-09-02", 
      amount: 0.28,
      active: true 
    },
    { 
      username: "max.btc", 
      date: "2023-09-10", 
      amount: 0.42,
      active: true 
    },
    { 
      username: "sarah.avax", 
      date: "2023-09-18", 
      amount: 0.12,
      active: true 
    },
    { 
      username: "tom.arb", 
      date: "2023-09-25", 
      amount: 0.08,
      active: true 
    },
    { 
      username: "jessica.matic", 
      date: "2023-10-05", 
      amount: 0,
      active: false 
    },
    { 
      username: "mike.op", 
      date: "2023-10-12", 
      amount: 0,
      active: false 
    },
    { 
      username: "lily.base", 
      date: "2023-10-19", 
      amount: 0,
      active: false 
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold">Share the Love</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total Invited:</span>
          <motion.span 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="font-bold text-primary"
          >
            {totalReferrals}
          </motion.span>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="col-span-1 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-2 border-primary/20 relative bg-gradient-to-br from-background to-primary/5">
            <div className="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 -mb-12 -ml-12 bg-primary/5 rounded-full blur-xl"></div>
            
            <CardHeader className="pb-2">
              <motion.div 
                className="flex items-center gap-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Gift className="h-6 w-6 text-primary animate-pulse" />
                <CardTitle>Your Invite Link</CardTitle>
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <CardDescription className="text-base mt-2">
                  Share this link with friends to help them skip the <motion.span 
                    className="font-semibold"
                    animate={{ color: ['#4F46E5', '#10B981', '#4F46E5'] }}
                    transition={{ duration: 5, repeat: Infinity }}
                  >75,000+ waitlist</motion.span> and get a <span className="font-semibold text-primary">free share in a community</span>!
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="pb-2">
              <motion.div 
                className="relative p-6 bg-primary/5 rounded-xl border border-primary/20 shadow-sm"
                whileHover={{ boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04)" }}
                transition={{ duration: 0.2 }}
              >
                <div className={`absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm rounded-xl transition-opacity duration-300 z-10 ${showSuccessMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Link copied to clipboard!</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Link className="absolute left-3 top-3 h-5 w-5 text-primary" />
                    <Input
                      value={referralUrl}
                      readOnly
                      className="pl-10 pr-4 py-6 text-base font-medium border-primary/20 bg-background"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <motion.div whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-none">
                      <Button 
                        variant={copied ? "default" : "outline"} 
                        size="lg"
                        onClick={handleCopy}
                        className={`relative overflow-hidden w-full ${copied ? "bg-green-600 hover:bg-green-700" : "border-primary/20"}`}
                      >
                        <CopyIcon className="h-5 w-5 mr-2" />
                        {copied ? "Copied!" : "Copy Link"}
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-none">
                      <Button 
                        size="lg" 
                        onClick={handleShare}
                        className={`relative overflow-hidden w-full ${animateShare ? 'animate-pulse' : ''}`}
                      >
                        <Share2 className="h-5 w-5 mr-2" />
                        Share
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                <motion.div 
                  className="mt-4 pt-4 border-t border-primary/10 flex flex-wrap gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button variant="outline" size="sm" className="group" onClick={handleShare}>
                    <Twitter className="h-4 w-4 mr-2 text-[#1DA1F2] group-hover:animate-spin" />
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="group" onClick={handleShare}>
                    <Facebook className="h-4 w-4 mr-2 text-[#1877F2] group-hover:animate-pulse" />
                    Facebook
                  </Button>
                </motion.div>
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex justify-center py-4 text-center text-sm text-muted-foreground">
              <motion.div 
                className="max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="font-medium">You earn 2% of all buy amounts</span> from your referrals forever!
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-2 border-primary/10 overflow-hidden bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <motion.div 
                className="flex items-center gap-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Trophy className="h-6 w-6 text-primary" />
                <CardTitle>Your Rewards</CardTitle>
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CardDescription className="text-base">
                  Track earnings from your invites
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Total Earned
                    </span>
                    <motion.span 
                      className="font-bold text-primary text-lg"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {totalEarned.toFixed(2)} ETH
                    </motion.span>
                  </div>
                  
                  <motion.div
                    className="bg-primary/10 p-4 rounded-xl relative overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressEarned}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                    <div className="relative flex items-center justify-center py-2">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ 
                          scale: [0.8, 1.1, 1],
                          opacity: 1
                        }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="text-xl font-bold text-primary"
                      >
                        Great earning potential!
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 font-medium">
                      <Wallet className="h-4 w-4 text-amber-500" />
                      Available Rewards
                    </span>
                    <motion.span 
                      className="font-bold text-amber-500 text-lg"
                      initial={{ scale: 0.8 }}
                      animate={rewardsClaimable ? { 
                        scale: [1, 1.1, 1],
                        transition: { 
                          repeat: Infinity,
                          repeatType: "reverse",
                          duration: 1.5
                        }
                      } : { scale: 1 }}
                    >
                      {availableRewards.toFixed(2)} ETH
                    </motion.span>
                  </div>
                  
                  {availableRewards > 0 && (
                    <motion.div
                      className="bg-amber-500/10 p-4 rounded-xl relative overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-500/5"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressAvailable}%` }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      />
                      <div className="relative flex items-center justify-center py-2">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ 
                            scale: [0.8, 1.1, 1],
                            opacity: 1
                          }}
                          transition={{ delay: 0.7, duration: 0.5 }}
                          className="text-lg font-medium text-amber-600"
                        >
                          Ready to claim!
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    className="w-full"
                    size="lg"
                    variant={rewardsClaimable ? "default" : "outline"}
                    onClick={handleClaimRewards}
                    disabled={!rewardsClaimable || isClaimingRewards}
                  >
                    {isClaimingRewards ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="mr-2"
                        >
                          <Sparkles className="h-5 w-5" />
                        </motion.div>
                        Claiming...
                      </>
                    ) : rewardsClaimable ? (
                      <>Claim Rewards</>
                    ) : (
                      <>No Rewards Available</>
                    )}
                  </Button>
                </motion.div>
                
                <motion.div 
                  className="grid grid-cols-2 gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div 
                    className="bg-muted/40 rounded-lg p-4 text-center border border-border/50"
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <motion.div 
                      className="text-2xl font-bold"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      {totalReferrals}
                    </motion.div>
                    <div className="text-sm text-muted-foreground">Total Invites</div>
                  </motion.div>
                  <motion.div 
                    className="bg-muted/40 rounded-lg p-4 text-center border border-border/50"
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sparkles className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                    <motion.div 
                      className="text-2xl font-bold"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      {activeReferrals}
                    </motion.div>
                    <div className="text-sm text-muted-foreground">Active Invites</div>
                  </motion.div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Card className="overflow-hidden border-2 border-primary/10 relative bg-gradient-to-tl from-background to-primary/5">
          <div className="absolute bottom-0 right-0 w-32 h-32 -mb-10 -mr-10 bg-primary/5 rounded-full blur-xl"></div>
          <CardHeader className="pb-2">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-2"
            >
              <Rocket className="h-6 w-6 text-primary" />
              <CardTitle>How Invites Work</CardTitle>
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <CardDescription className="text-base">
                Learn about our invitation program benefits
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div 
                  className="bg-primary/5 rounded-lg p-6 border border-primary/10"
                  whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04)" }}
                >
                  <motion.div 
                    className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4"
                    whileHover={{ rotate: 10 }}
                  >
                    <Gift className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h3 className="font-medium text-lg mb-2 text-primary">For Your Friends</h3>
                  <p className="text-muted-foreground">
                    They <span className="font-medium text-foreground">skip the 75,000+ waitlist</span> and get <span className="font-medium text-foreground">instant access</span> to dapps.co.
                  </p>
                </motion.div>
                <motion.div 
                  className="rounded-lg p-4 border border-primary/10"
                  animate={{ 
                    boxShadow: ['0 0 0 rgba(79, 70, 229, 0)', '0 0 10px rgba(79, 70, 229, 0.2)', '0 0 0 rgba(79, 70, 229, 0)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="rounded-full bg-primary/10 p-2 text-primary"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                    <span>Your friends get immediate access</span>
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <motion.div 
                  className="bg-primary/5 rounded-lg p-6 border border-primary/10"
                  whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04)" }}
                >
                  <motion.div 
                    className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4"
                    whileHover={{ rotate: 10 }}
                  >
                    <Sparkles className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h3 className="font-medium text-lg mb-2 text-primary">Free Share</h3>
                  <p className="text-muted-foreground">
                    Your friends receive a <span className="font-medium text-foreground">free share in a community</span> when they join.
                  </p>
                </motion.div>
                <motion.div 
                  className="rounded-lg p-4 border border-primary/10"
                  animate={{ 
                    boxShadow: ['0 0 0 rgba(79, 70, 229, 0)', '0 0 10px rgba(79, 70, 229, 0.2)', '0 0 0 rgba(79, 70, 229, 0)']
                  }}
                  transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="rounded-full bg-primary/10 p-2 text-primary"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, delay: 0.3, repeat: Infinity }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                    <span>Free share worth up to $100</span>
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <motion.div 
                  className="bg-primary/5 rounded-lg p-6 border border-primary/10"
                  whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.1), 0 10px 10px -5px rgba(79, 70, 229, 0.04)" }}
                >
                  <motion.div 
                    className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4"
                    whileHover={{ rotate: 10 }}
                  >
                    <Trophy className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h3 className="font-medium text-lg mb-2 text-primary">You Earn</h3>
                  <p className="text-muted-foreground">
                    You earn <span className="font-medium text-foreground">up to 2% of all buy amounts</span> from users who join through your invite link.
                  </p>
                </motion.div>
                <motion.div 
                  className="rounded-lg p-4 border border-primary/10"
                  animate={{ 
                    boxShadow: ['0 0 0 rgba(79, 70, 229, 0)', '0 0 10px rgba(79, 70, 229, 0.2)', '0 0 0 rgba(79, 70, 229, 0)']
                  }}
                  transition={{ duration: 2, delay: 0.6, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="rounded-full bg-primary/10 p-2 text-primary"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, delay: 0.6, repeat: Infinity }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                    <span>Rewards paid in ETH to your wallet</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
      >
        <Card className="overflow-hidden border border-border/60 bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center gap-2"
            >
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Your Invites</CardTitle>
            </motion.div>
            <CardDescription>
              View your referred users and earnings
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {referralHistory.map((referral, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index + 1.2 }}
                    whileHover={{ backgroundColor: "rgba(79, 70, 229, 0.05)" }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${referral.username}`} />
                          <AvatarFallback>{referral.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <div>
                        <div className="font-medium">{referral.username}</div>
                        <div className="text-sm text-muted-foreground">Joined on {referral.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {referral.amount > 0 ? (
                          <motion.span 
                            className="text-primary"
                            whileHover={{ scale: 1.05 }}
                          >
                            {referral.amount.toFixed(2)} ETH
                          </motion.span>
                        ) : "-"}
                      </div>
                      <div className="text-sm">
                        {referral.active ? (
                          <motion.span 
                            className="text-green-600 flex items-center gap-1 justify-end"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </motion.span>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReferralPage;
