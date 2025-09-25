import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Coins, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  Trophy,
  Target,
  ExternalLink,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { DaoProposalData, castDaoVote } from '@/utils/postApi';
import { cn } from '@/lib/utils';

interface DaoProposalVotingProps {
  proposalData: DaoProposalData;
  onVoteSuccess?: () => void;
}

export const DaoProposalVoting: React.FC<DaoProposalVotingProps> = ({
  proposalData,
  onVoteSuccess
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | 'abstain' | null>(null);
  const [voteReason, setVoteReason] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const { voting_results, user_voting_data, proposal_status } = proposalData;

  // Calculate time remaining
  const timeRemaining = voting_results.seconds_remaining;
  const days = Math.floor(timeRemaining / (24 * 3600));
  const hours = Math.floor((timeRemaining % (24 * 3600)) / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);

  const getStatusBadge = () => {
    switch (proposal_status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Active
        </Badge>;
      case 'passed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>;
      default:
        return null;
    }
  };

  const triggerSuccessEffects = () => {
    // Confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']
    });

    // Show success animation
    setShowSuccessAnimation(true);
    setTimeout(() => setShowSuccessAnimation(false), 3000);
  };

  const handleVoteClick = (voteChoice: 'for' | 'against' | 'abstain') => {
    if (!user_voting_data.is_eligible) {
      toast.error('You are not eligible to vote on this proposal');
      return;
    }

    if (user_voting_data.has_voted) {
      toast.error('You have already voted on this proposal');
      return;
    }

    if (proposal_status !== 'active') {
      toast.error('Voting is no longer active for this proposal');
      return;
    }

    setSelectedVote(voteChoice);
    setShowVoteModal(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedVote) return;

    setIsVoting(true);
    try {
      const result = await castDaoVote({
        proposal_id: proposalData.proposal_id,
        vote_choice: selectedVote,
        vote_reason: voteReason.trim() || undefined
      });

      if (result.success) {
        toast.success(`Vote cast successfully! You voted ${selectedVote.toUpperCase()}`);
        triggerSuccessEffects();
        setShowVoteModal(false);
        setVoteReason('');
        setSelectedVote(null);
        
        // Call success callback to refresh data
        if (onVoteSuccess) {
          onVoteSuccess();
        }
      } else {
        toast.error(result.message || 'Failed to cast vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to cast vote');
    } finally {
      setIsVoting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'eth') {
      return `${amount} ETH`;
    } else {
      return `${amount.toLocaleString()} ${proposalData.ticker}`;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <Card className={cn(
        "border-2",
        proposal_status === 'passed' 
          ? "border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20"
          : "border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20"
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">DAO Proposal</CardTitle>
              <Badge variant="outline" className="text-xs font-mono">
                ${proposalData.ticker}
              </Badge>
            </div>
            {getStatusBadge()}
          </div>
          
          <div className="space-y-3">
            <h3 className="font-bold text-xl">{proposalData.proposal_title}</h3>
            <p className="text-muted-foreground">{proposalData.purpose}</p>
            
            {/* Recipient Address */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Recipient Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                      {truncateAddress(proposalData.to_address)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(proposalData.to_address, 'Address')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(`https://basescan.org/address/${proposalData.to_address}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4" />
                <span>Requesting: {formatCurrency(proposalData.quantity, proposalData.currency)}</span>
              </div>
              {proposal_status === 'active' && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {days > 0 ? `${days}d ` : ''}
                    {hours > 0 ? `${hours}h ` : ''}
                    {minutes}m remaining
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Voting Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Voting Results</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{voting_results.total_voters} voters</span>
              </div>
            </div>

            {/* Combined Voting Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">
                    For: {voting_results.votes_for.toLocaleString()} ({(voting_results.for_percentage || 0).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-medium">
                    Against: {voting_results.votes_against.toLocaleString()} ({(voting_results.against_percentage || 0).toFixed(1)}%)
                  </span>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
              
              {/* Combined Progress Bar */}
              <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                {voting_results.total_votes_cast > 0 ? (
                  <>
                    <div 
                      className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${voting_results.for_percentage || 0}%` }}
                    />
                    <div 
                      className="absolute right-0 top-0 h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${voting_results.against_percentage || 0}%` }}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    No votes yet
                  </div>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                {voting_results.total_votes_cast.toLocaleString()} total votes cast
              </div>
            </div>

            {/* Quorum Progress */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Participation</span>
                <span>{voting_results.turnout_percentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={voting_results.turnout_percentage} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Quorum: {voting_results.quorum_percentage}%</span>
                <span className={voting_results.quorum_met ? 'text-green-600' : 'text-red-600'}>
                  {voting_results.quorum_met ? 'Met' : 'Not Met'}
                </span>
              </div>
            </div>
          </div>

          {/* User Voting Section */}
          {user_voting_data.is_eligible && (
            <div className="space-y-4 pt-4 border-t">
              {user_voting_data.has_voted ? (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      You voted {user_voting_data.vote_choice?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Voting power: {user_voting_data.voting_power.toLocaleString()} {proposalData.ticker}
                  </div>
                </div>
              ) : proposal_status === 'active' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-medium">Cast Your Vote</span>
                    <Badge variant="outline" className="text-xs">
                      {user_voting_data.voting_power.toLocaleString()} voting power
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleVoteClick('for')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      For
                    </Button>
                    <Button
                      onClick={() => handleVoteClick('against')}
                      variant="destructive"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Against
                    </Button>
                    <Button
                      onClick={() => handleVoteClick('abstain')}
                      variant="outline"
                      size="sm"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Abstain
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Voting has ended for this proposal
                </div>
              )}
            </div>
          )}

          {!user_voting_data.is_eligible && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800 dark:text-amber-200">
                  You need to hold {proposalData.ticker} tokens to vote on this proposal
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vote Confirmation Modal */}
      <Dialog open={showVoteModal} onOpenChange={setShowVoteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Confirm Your Vote
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold",
                selectedVote === 'for' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                selectedVote === 'against' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                selectedVote === 'abstain' && "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              )}>
                {selectedVote === 'for' && <CheckCircle className="w-5 h-5" />}
                {selectedVote === 'against' && <XCircle className="w-5 h-5" />}
                {selectedVote === 'abstain' && <AlertCircle className="w-5 h-5" />}
                Voting {selectedVote?.toUpperCase()}
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Voting power: {user_voting_data.voting_power.toLocaleString()} {proposalData.ticker}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={voteReason}
                onChange={(e) => setVoteReason(e.target.value)}
                placeholder="Share why you're voting this way..."
                className="min-h-[80px]"
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {voteReason.length}/1000
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowVoteModal(false)}
                className="flex-1"
                disabled={isVoting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmVote}
                disabled={isVoting}
                className="flex-1"
              >
                {isVoting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Voting...
                  </div>
                ) : (
                  'Confirm Vote'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Vote Cast!</h3>
              <p className="text-muted-foreground">
                Your voice has been heard in the community
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DaoProposalVoting;

