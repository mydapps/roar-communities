import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';

// Define structure for necessary community data
interface CommunityAboutData {
  name?: string;
  description?: string;
  created_on?: string;
  owner?: string;
  members_count?: number;
  shares?: number;
  fees?: {
    admin_fees?: number;
    reward_fees?: number;
    platform_fees?: number;
  };
  prices?: {
    buy_price?: number;
  };
  details?: { // Include details if needed, e.g., for rules fallback
    rules?: string | null;
  }
}

interface CommunityAboutSectionProps {
  community: CommunityAboutData | null | undefined;
  id: string | undefined; // Fallback for name
  minSharePosting: number;
  minShareCommenting: number;
  communityRules: string | null | undefined;
}

const CommunityAboutSection: React.FC<CommunityAboutSectionProps> = ({
  community,
  id,
  minSharePosting,
  minShareCommenting,
  communityRules
}) => {
  const communityName = community?.name || id || 'This community';

  // Prepare default rules text (similar to admin panel)
  const defaultRulesText = `• Be respectful to all members and maintain a professional tone
• No spam, excessive self-promotion, or plagiarism
• Content should be relevant to ${communityName}
• Provide evidence and sources for technical claims when possible
• Abide by the community guidelines for posting and commenting`;

  const rulesToDisplay = communityRules || defaultRulesText;

  return (
    <Card>
      <CardHeader>
        <CardTitle>About {communityName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Community Description</h3>
          <p className="text-muted-foreground">{community?.description || 'No description available.'}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created On</span>
                <span>{community?.created_on ? new Date(community.created_on).toLocaleDateString() : 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admin</span>
                <span>{community?.owner ? `${community.owner.substring(0, 6)}...${community.owner.substring(community.owner.length - 4)}` : 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Members</span>
                <span>{community?.members_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Shares</span>
                <span>{community?.shares?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Shares Posting</span>
                <span>{minSharePosting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Shares Commenting</span>
                <span>{minShareCommenting}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Fee Structure</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admin Fee</span>
                <span>{community?.fees?.admin_fees || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reward Pool</span>
                <span>{community?.fees?.reward_fees || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee</span>
                <span>{community?.fees?.platform_fees || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Share Price</span>
                <span>{community?.prices?.buy_price?.toFixed(6) || 0} ETH</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Community Rules</h3>
          {rulesToDisplay ? (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{rulesToDisplay}</div>
          ) : (
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
             {/* This fallback might not be strictly necessary if defaultRulesText is always generated */}
            <li>Be respectful to all members and maintain a professional tone</li>
            <li>No spam, excessive self-promotion, or plagiarism</li>
            <li>Content should be relevant to {communityName}</li>
            <li>Provide evidence and sources for technical claims when possible</li>
            <li>Abide by the community guidelines for posting and commenting</li>
          </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityAboutSection; 