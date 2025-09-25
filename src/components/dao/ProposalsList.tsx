import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  listDaoProposals, 
  DaoProposal, 
  getProposalStatusBadge, 
  formatProposalAmount, 
  formatTimeRemaining,
  truncateAddress 
} from '@/utils/daoApi';
import { 
  Vote, 
  Clock, 
  Users, 
  TrendingUp, 
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface ProposalsListProps {
  ticker: string;
  limit?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const ProposalsList: React.FC<ProposalsListProps> = ({ 
  ticker, 
  limit = 5, 
  showViewAll = false,
  onViewAll 
}) => {
  const [proposals, setProposals] = useState<DaoProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await listDaoProposals(ticker, 'all', limit, 0);
        
        if (response.success) {
          setProposals(response.data.proposals);
        } else {
          setError('Failed to load proposals');
        }
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError('Failed to load proposals');
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchProposals();
    }
  }, [ticker, limit]);

  const openProposalInExplorer = (proposal: DaoProposal) => {
    // This would navigate to the detailed proposal view
    // For now, we'll just show a toast
    console.log('View proposal details:', proposal.id);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Vote className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No DAO proposals yet. Be the first to create one!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => {
        const statusBadge = getProposalStatusBadge(proposal.proposal_status);
        const isActive = proposal.proposal_status === 'active';
        
        return (
          <Card 
            key={proposal.id} 
            className={`transition-all hover:shadow-md cursor-pointer ${
              isActive ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10' : ''
            }`}
            onClick={() => openProposalInExplorer(proposal)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title and Status */}
                  <div className="flex items-start gap-2 mb-2">
                    <h4 className="font-medium text-sm leading-tight truncate flex-1">
                      {proposal.title}
                    </h4>
                    <Badge 
                      variant={statusBadge.variant}
                      className={`text-xs flex-shrink-0 ${statusBadge.color}`}
                    >
                      {statusBadge.text}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatProposalAmount(proposal.quantity, proposal.currency, ticker)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {proposal.total_voters} voters
                      </span>
                    </div>

                    {/* Time info */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {isActive ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {formatTimeRemaining(proposal.seconds_remaining)}
                        </span>
                      ) : (
                        <span>
                          Ended {new Date(proposal.voting_ends_on).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Voting results for completed proposals */}
                    {!isActive && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 dark:text-green-400">
                          For: {((proposal.votes_for / (proposal.votes_for + proposal.votes_against)) * 100 || 0).toFixed(1)}%
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                          Against: {((proposal.votes_against / (proposal.votes_for + proposal.votes_against)) * 100 || 0).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* View All Button */}
      {showViewAll && onViewAll && (
        <Button 
          variant="outline" 
          onClick={onViewAll}
          className="w-full mt-3"
        >
          <Vote className="w-4 h-4 mr-2" />
          View All Proposals
        </Button>
      )}
    </div>
  );
};

export default ProposalsList;
