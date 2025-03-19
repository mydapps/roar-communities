
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
  Facebook
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const ReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const [animateShare, setAnimateShare] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const referralUrl = 'dapps.co/invite/abc';
  
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
  
  const totalEarned = 1.25;
  const pendingRewards = 0.18;
  const totalReferrals = 8;
  const activeReferrals = 5;
  
  // Progress values for animations
  const [progressEarned, setProgressEarned] = useState(0);
  const [progressPending, setProgressPending] = useState(0);
  
  // Animate progress bars on mount
  useEffect(() => {
    setTimeout(() => setProgressEarned(85), 300);
    setTimeout(() => setProgressPending(15), 600);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Share the Love</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total Invited:</span>
          <span className="font-bold text-primary">{totalReferrals}</span>
        </div>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="col-span-1 lg:col-span-2 overflow-hidden border-2 border-primary/20 relative">
          <div className="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-primary/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 -mb-12 -ml-12 bg-primary/5 rounded-full blur-xl"></div>
          
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <CardTitle>Your Invite Link</CardTitle>
            </div>
            <CardDescription className="text-base mt-2">
              Share this link with friends to help them skip the <span className="font-semibold">75,000+ waitlist</span> and get a <span className="font-semibold text-primary">free community share</span>!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="relative p-6 bg-primary/5 rounded-xl border border-primary/20 shadow-sm">
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
                  <Button 
                    variant={copied ? "default" : "outline"} 
                    size="lg"
                    onClick={handleCopy}
                    className={`relative overflow-hidden flex-1 sm:flex-none ${copied ? "bg-green-600 hover:bg-green-700" : "border-primary/20"}`}
                  >
                    <CopyIcon className="h-5 w-5 mr-2" />
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={handleShare}
                    className={`relative overflow-hidden flex-1 sm:flex-none ${animateShare ? 'animate-pulse' : ''}`}
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-primary/10 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="group" onClick={handleShare}>
                  <Twitter className="h-4 w-4 mr-2 text-[#1DA1F2] group-hover:animate-spin" />
                  Twitter
                </Button>
                <Button variant="outline" size="sm" className="group" onClick={handleShare}>
                  <Facebook className="h-4 w-4 mr-2 text-[#1877F2] group-hover:animate-pulse" />
                  Facebook
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center py-4 text-center text-sm text-muted-foreground">
            <div className="max-w-md">
              <span className="font-medium">You earn 2% of all buy amounts</span> from your referrals forever!
            </div>
          </CardFooter>
        </Card>
        
        <Card className="border-2 border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Your Rewards</CardTitle>
            </div>
            <CardDescription className="text-base">
              Track earnings from your invites
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Total Earned
                  </span>
                  <span className="font-bold text-primary">{totalEarned.toFixed(2)} ETH</span>
                </div>
                <Progress value={progressEarned} className="h-2" />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 font-medium">
                    <Rocket className="h-4 w-4 text-amber-500" />
                    Pending Rewards
                  </span>
                  <span className="font-bold text-amber-500">{pendingRewards.toFixed(2)} ETH</span>
                </div>
                <Progress value={progressPending} className="h-2 bg-amber-100 text-amber-500" />
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-muted/40 rounded-lg p-4 text-center border border-border/50">
                  <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{totalReferrals}</div>
                  <div className="text-sm text-muted-foreground">Total Invites</div>
                </div>
                <div className="bg-muted/40 rounded-lg p-4 text-center border border-border/50">
                  <Sparkles className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                  <div className="text-2xl font-bold">{activeReferrals}</div>
                  <div className="text-sm text-muted-foreground">Active Invites</div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="overflow-hidden border-2 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              How Invites Work
            </CardTitle>
            <CardDescription className="text-base">
              Learn about our invitation program benefits
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg mb-2 text-primary">For Your Friends</h3>
                  <p className="text-muted-foreground">
                    They <span className="font-medium text-foreground">skip the 75,000+ waitlist</span> and get <span className="font-medium text-foreground">instant access</span> to dapps.co.
                  </p>
                </div>
                <div className="rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <span>Your friends get immediate access</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg mb-2 text-primary">Free Share</h3>
                  <p className="text-muted-foreground">
                    Your friends receive a <span className="font-medium text-foreground">free share in a community</span> of their choice when they join.
                  </p>
                </div>
                <div className="rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <span>Free share worth up to $100</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg mb-2 text-primary">You Earn</h3>
                  <p className="text-muted-foreground">
                    You earn <span className="font-medium text-foreground">up to 2% of all buy amounts</span> from users who join through your invite link.
                  </p>
                </div>
                <div className="rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <span>Rewards paid in ETH to your wallet</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Card className="overflow-hidden border border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Your Invites
            </CardTitle>
            <CardDescription>
              View your referred users and earnings
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {referralHistory.map((referral, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${referral.username}`} />
                      <AvatarFallback>{referral.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{referral.username}</div>
                      <div className="text-sm text-muted-foreground">Joined on {referral.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {referral.amount > 0 ? (
                        <span className="text-primary">{referral.amount.toFixed(2)} ETH</span>
                      ) : "-"}
                    </div>
                    <div className="text-sm">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReferralPage;
