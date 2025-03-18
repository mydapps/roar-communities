
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyIcon, Share2, DollarSign, Users, Link } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const referralUrl = 'https://dapps.co/join?ref=your-unique-code';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  
  const totalEarned = 1.25;
  const pendingRewards = 0.18;
  const totalReferrals = 8;
  const activeReferrals = 5;

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
      <h1 className="text-2xl font-bold">Referrals</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1 md:col-span-2 animate-scale-in">
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>
              Share this link and earn 0.75% of all buy amounts from your referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={referralUrl}
                  readOnly
                  className="pl-9 bg-muted/40"
                />
              </div>
              <Button 
                variant={copied ? "default" : "outline"} 
                size="icon" 
                onClick={handleCopy}
                className={copied ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-scale-in [animation-delay:100ms]">
          <CardHeader>
            <CardTitle>Referral Stats</CardTitle>
            <CardDescription>
              Track your referral performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Earned</span>
                  <span className="font-bold">{totalEarned.toFixed(2)} ETH</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Rewards</span>
                  <span className="font-bold">{pendingRewards.toFixed(2)} ETH</span>
                </div>
                <Progress value={15} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/40 rounded-lg p-4 text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{totalReferrals}</div>
                  <div className="text-sm text-muted-foreground">Total Referrals</div>
                </div>
                <div className="bg-muted/40 rounded-lg p-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{activeReferrals}</div>
                  <div className="text-sm text-muted-foreground">Active Referrals</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-scale-in [animation-delay:200ms]">
          <CardHeader>
            <CardTitle>How Referrals Work</CardTitle>
            <CardDescription>
              Learn about our referral program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <h3 className="font-medium mb-2 text-primary">Earn Passive Income</h3>
                <p className="text-sm text-muted-foreground">
                  You earn 0.75% of all buy amounts from users who join through your referral link. Rewards are paid in ETH directly to your wallet.
                </p>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary mt-1">
                    <Users className="h-3 w-3" />
                  </div>
                  <span>Share your unique referral link with friends and on social media</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary mt-1">
                    <Users className="h-3 w-3" />
                  </div>
                  <span>When someone signs up using your link, they become your referral</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary mt-1">
                    <DollarSign className="h-3 w-3" />
                  </div>
                  <span>Earn 0.75% of all their buy transactions forever</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary mt-1">
                    <DollarSign className="h-3 w-3" />
                  </div>
                  <span>Rewards are automatically credited to your wallet</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            View your referred users and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {referralHistory.map((referral, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors"
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
                    {referral.amount > 0 ? `${referral.amount.toFixed(2)} ETH` : "-"}
                  </div>
                  <div className="text-sm">
                    {referral.active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralPage;
