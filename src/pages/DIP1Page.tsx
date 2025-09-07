import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, ExternalLink, CheckCircle2, Sparkles, Trophy, Vote } from 'lucide-react';
import { fetchDIPStatus, fetchDIPHasVoted, submitDIPVote, type DIPStatusResponse, type DIPHasVotedResponse } from '@/utils/dipApi';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const DIP1Page: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'yes' | 'no' | null>(null);
  const [status, setStatus] = useState<DIPStatusResponse | null>(null);
  const [hasVoted, setHasVoted] = useState<DIPHasVotedResponse | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [victoryShown, setVictoryShown] = useState(false);

  // Mock completed voting data - DIP-1 has passed!
  const completedVotingData = {
    success: true,
    dip_id: 1,
    yes_weight: 638577109,
    no_weight: 0,
    total_weight: 638577109,
    yes_pct: 100.0,
    no_pct: 0.0,
    yes_count: 1,
    no_count: 0,
    voting_complete: true
  };

  const load = async () => {
    setLoading(true);
    // Simulate loading and use completed data
    await new Promise(resolve => setTimeout(resolve, 500));
    setStatus(completedVotingData);
    setHasVoted({ success: true, dip_id: 1, has_voted: 1, vote: 'yes' });
    setLoading(false);
    
    // Trigger victory celebration on first load
    if (!victoryShown) {
      setTimeout(() => {
        triggerVictoryCelebration();
        setVictoryShown(true);
      }, 1000);
    }
  };

  useEffect(() => { load(); }, []);

  // Victory celebration with confetti and dopamine hits
  const triggerVictoryCelebration = () => {
    // Multiple confetti bursts for dopamine hit
    const celebrateWithConfetti = () => {
      // Primary celebration burst
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#10B981', '#059669', '#047857', '#065F46', '#FFD700'],
        gravity: 0.8,
        scalar: 1.4
      });
      
      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.8 },
          colors: ['#10B981', '#FFD700', '#F59E0B']
        });
      }, 200);
      
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.8 },
          colors: ['#10B981', '#FFD700', '#F59E0B']
        });
      }, 400);
      
      // Final sparkle burst
      setTimeout(() => {
        confetti({
          particleCount: 60,
          startVelocity: 30,
          spread: 360,
          origin: { x: 0.5, y: 0.4 },
          colors: ['#FFD700', '#F59E0B', '#FBBF24'],
          shapes: ['star'],
          gravity: 0.6
        });
      }, 800);
    };

    celebrateWithConfetti();
    
    // Show celebration overlay
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 5000);
  };

  const doVote = async (vote: 'yes' | 'no') => {
    setSubmitting(vote);
    try {
      const res = await submitDIPVote(1, vote);
      if (res.success) {
        // Trigger celebration animation
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
        
        toast.success(`Vote recorded! You voted ${vote.toUpperCase()} on DIP-1`, {
          duration: 3000,
        });
        await load();
      } else {
        toast.error(res.message || 'Failed to vote');
      }
    } catch (e) {
      toast.error('Failed to vote');
    } finally {
      setSubmitting(null);
    }
  };

  const yesPct = status ? status.yes_pct.toFixed(1) : '0.0';
  const noPct = status ? status.no_pct.toFixed(1) : '0.0';
  const totalWeight = status ? status.total_weight.toFixed(0) : '0';
  const yesWeight = status ? status.yes_weight.toFixed(0) : '0';
  const noWeight = status ? status.no_weight.toFixed(0) : '0';

  return (
    <>
      <Helmet>
        <title>DIP-1 Voting | Dapps Community</title>
      </Helmet>
      
      {/* Victory celebration overlay */}
      {celebrating && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Celebration background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-yellow-500/20 to-green-500/20 animate-pulse"></div>
          
          {/* Central trophy animation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-bounce">
              <div className="relative">
                <Trophy className="h-20 w-20 text-yellow-500 animate-pulse" />
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-8 w-8 text-yellow-400 animate-spin" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating celebration elements */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl animate-bounce"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            >
              {i % 4 === 0 ? '🏆' : i % 4 === 1 ? '🎉' : i % 4 === 2 ? '⭐' : '🦁'}
            </div>
          ))}
          
          {/* "PASSED!" text */}
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-4xl font-bold text-green-600 animate-pulse text-center">
              DIP-1 PASSED!
            </div>
            <div className="text-lg font-medium text-green-700 text-center mt-2 animate-bounce">
              Historic Victory!
            </div>
          </div>
        </div>
      )}

      <div className="container max-w-lg mx-auto px-4 py-6 mt-14">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            DIP-1: Community Tokens Revolution
          </h1>
            <Trophy className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              ✅ VOTING COMPLETED - PROPOSAL PASSED!
            </div>
          <p className="text-muted-foreground">
              Historic migration from shares to ERC20 tokens approved by community
          </p>
          </div>
        </div>

        {/* Final Results Card */}
        <Card className="mb-6 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
              <Trophy className="h-5 w-5" />
              Final Results
              <Trophy className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading final results...</span>
              </div>
            ) : status ? (
              <div className="space-y-6">
                {/* Massive Victory Display */}
                <div className="text-center">
                  <div className="text-3xl font-bold mb-4 text-green-600 dark:text-green-400">
                    UNANIMOUS VICTORY!
                  </div>
                  <div className="text-6xl font-bold mb-2 text-green-700 dark:text-green-300">
                    100%
                  </div>
                  <div className="text-lg text-muted-foreground mb-4">
                    Community Approval
                  </div>
                  
                  {/* Visual vote bar - full green */}
                  <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6 shadow-inner">
                    <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-full animate-pulse shadow-lg"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                      638,577,109 🦁 FOR DIP-1
                    </div>
                  </div>

                  {/* Detailed stats */}
                  <div className="grid grid-cols-1 gap-4 text-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        638,577,109 🦁
                    </div>
                      <div className="text-sm text-muted-foreground">Total Voting Power</div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        100% YES • 0% NO
                    </div>
                    </div>
                  </div>
                </div>

                {/* Completion Status */}
                <div className="text-center p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white shadow-lg">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="text-xl font-bold">VOTING COMPLETE</span>
                    <CheckCircle2 className="h-6 w-6" />
                      </div>
                  <div className="text-green-100">
                    DIP-1 officially approved by the Roar Communities
                      </div>
                  <div className="text-sm text-green-200 mt-2">
                    Historic transition to ERC20 tokens begins!
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Results unavailable
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proposal Details */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              Proposal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              Transform communities from shares to <strong>ERC20 standardized tokens</strong> with 
              professional DeFi infrastructure, sustainable creator rewards, and unlimited growth potential.
            </p>

            {/* Key Changes */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">What's changing:</h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="font-medium mb-1">Fixed supply model</div>
                  <div className="text-muted-foreground">Each community gets 1 billion tokens, preventing inflation and ensuring scarcity</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="font-medium mb-1">ERC20 compatibility</div>
                  <div className="text-muted-foreground">Community tokens work with any wallet, DEX, or DeFi protocol</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="font-medium mb-1">Professional trading</div>
                  <div className="text-muted-foreground">Uniswap v4 integration brings real liquidity and trading infrastructure</div>
                </div>
              </div>
            </div>

            {/* Fee Structure */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">New fee structure:</h4>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-bold">0.5%</div>
                    <div className="text-muted-foreground">Community treasury</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">0.25%</div>
                    <div className="text-muted-foreground">Creators</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">0.25%</div>
                    <div className="text-muted-foreground">Platform</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="flex justify-center">
              <Link 
                to="/mohit/04c06d" 
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Read full proposal & join discussion
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
};

export default DIP1Page;


