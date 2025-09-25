import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  createDaoProposal, 
  CreateProposalRequest, 
  isValidEthereumAddress, 
  truncateAddress 
} from '@/utils/daoApi';
import { toast } from 'sonner';
import { 
  Loader2, 
  Vote, 
  DollarSign, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Copy,
  ExternalLink,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateProposalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticker: string;
  communityName: string;
  rewardPoolBalance: number;
  rewardPoolAddress: string;
  onProposalCreated?: () => void;
}

const CreateProposalSheet: React.FC<CreateProposalSheetProps> = ({
  open,
  onOpenChange,
  ticker,
  communityName,
  rewardPoolBalance,
  rewardPoolAddress,
  onProposalCreated
}) => {
  const isMobile = useIsMobile();
  
  // Form state
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currency, setCurrency] = useState<'eth' | 'tokens'>('eth');
  const [votingPeriod, setVotingPeriod] = useState<'3' | '7' | '14'>('7');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdProposal, setCreatedProposal] = useState<any>(null);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setStep('form');
      setTitle('');
      setPurpose('');
      setToAddress('');
      setQuantity('');
      setCurrency('eth');
      setVotingPeriod('7');
      setErrors({});
      setCreatedProposal(null);
    }
  }, [open]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (!purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    } else if (purpose.length > 2000) {
      newErrors.purpose = 'Purpose must be less than 2000 characters';
    }

    if (!toAddress.trim()) {
      newErrors.toAddress = 'Recipient address is required';
    } else if (!isValidEthereumAddress(toAddress)) {
      newErrors.toAddress = 'Invalid Ethereum address format';
    }

    if (!quantity.trim()) {
      newErrors.quantity = 'Amount is required';
    } else {
      const amount = parseFloat(quantity);
      if (isNaN(amount) || amount <= 0) {
        newErrors.quantity = 'Amount must be a positive number';
      } else if (currency === 'eth' && amount > rewardPoolBalance) {
        newErrors.quantity = `Amount exceeds available pool balance (${rewardPoolBalance.toFixed(6)} ETH)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep('review');
    }
  };

  const handleBack = () => {
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const proposalData: CreateProposalRequest = {
        ticker,
        title: title.trim(),
        purpose: purpose.trim(),
        to_address: toAddress.trim(),
        quantity: quantity.trim(),
        currency,
        voting_period_days: votingPeriod
      };

      const response = await createDaoProposal(proposalData);

      if (response.success && response.data) {
        setCreatedProposal(response.data);
        setStep('success');
        
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
        });

        toast.success('Proposal created successfully!');
        
        if (onProposalCreated) {
          onProposalCreated();
        }
      } else {
        toast.error(response.message || 'Failed to create proposal');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSuccessClose = () => {
    onOpenChange(false);
    // Refresh the page to show the new proposal
    window.location.reload();
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const openInExplorer = (address: string) => {
    window.open(`https://basescan.org/address/${address}`, '_blank');
  };

  const renderFormStep = () => (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Proposal Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Marketing Campaign Funding"
          className={errors.title ? 'border-red-500' : ''}
          maxLength={255}
        />
        {errors.title && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.title}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{title.length}/255 characters</p>
      </div>

      {/* Purpose */}
      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose & Details *</Label>
        <Textarea
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Describe what the funds will be used for, expected outcomes, timeline, and any other relevant details..."
          className={`min-h-[120px] ${errors.purpose ? 'border-red-500' : ''}`}
          maxLength={2000}
        />
        {errors.purpose && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.purpose}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{purpose.length}/2000 characters</p>
      </div>

      {/* Recipient Address */}
      <div className="space-y-2">
        <Label htmlFor="toAddress">Recipient Address *</Label>
        <Input
          id="toAddress"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="0x742d35Cc6634C0532925a3b8D4C9db96c4b4df93"
          className={errors.toAddress ? 'border-red-500' : ''}
        />
        {errors.toAddress && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.toAddress}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Ethereum address where funds will be sent if proposal passes
        </p>
      </div>

      {/* Amount and Currency */}
      <div className="space-y-4">
        <Label>Requested Amount *</Label>
        
        {/* Currency Selection */}
        <RadioGroup value={currency} onValueChange={(value: 'eth' | 'tokens') => setCurrency(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="eth" id="eth" />
            <Label htmlFor="eth" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              ETH (from reward pool)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tokens" id="tokens" />
            <Label htmlFor="tokens" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              ${ticker} tokens
            </Label>
          </div>
        </RadioGroup>

        {/* Amount Input */}
        <div className="space-y-2">
          <Input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={currency === 'eth' ? '0.5' : '1000'}
            type="number"
            step={currency === 'eth' ? '0.000001' : '1'}
            min="0"
            className={errors.quantity ? 'border-red-500' : ''}
          />
          {errors.quantity && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.quantity}
            </p>
          )}
          {currency === 'eth' && (
            <p className="text-xs text-muted-foreground">
              Available in pool: {rewardPoolBalance.toFixed(6)} ETH
            </p>
          )}
        </div>
      </div>

      {/* Voting Period */}
      <div className="space-y-2">
        <Label>Voting Period</Label>
        <Select value={votingPeriod} onValueChange={(value: '3' | '7' | '14') => setVotingPeriod(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 days</SelectItem>
            <SelectItem value="7">7 days (recommended)</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How long community members have to vote on this proposal
        </p>
      </div>

      {/* Governance Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-blue-800 dark:text-blue-200">Governance Requirements</p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Minimum 10% of token holders must participate (quorum)</li>
                <li>• 50% of votes must be "for" to pass the proposal</li>
                <li>• Voting power = 1 token = 1 vote</li>
                <li>• You can create 1 proposal per community every 7 days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">Review Proposal</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Purpose</Label>
            <p className="mt-1 text-sm">{purpose}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
              <p className="mt-1 font-medium">
                {quantity} {currency === 'eth' ? 'ETH' : ticker}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Voting Period</Label>
              <p className="mt-1 font-medium">{votingPeriod} days</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Recipient</Label>
            <div className="mt-1 flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {truncateAddress(toAddress)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyAddress(toAddress)}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openInExplorer(toAddress)}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Before You Submit</p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                <li>• Double-check the recipient address - transactions cannot be reversed</li>
                <li>• Ensure your proposal details are clear and comprehensive</li>
                <li>• This will create a public post in the community for voting</li>
                <li>• You cannot edit the proposal once submitted</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
            Proposal Created Successfully!
          </h3>
          <p className="text-green-700 dark:text-green-300 mt-2">
            Your proposal is now live and community members can start voting
          </p>
        </div>
      </div>

      {createdProposal && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Proposal ID</span>
                <Badge variant="outline">#{createdProposal.proposal_id}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Voting Ends</span>
                <span className="text-sm font-medium">
                  {new Date(createdProposal.voting_ends_on).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Eligible Voters</span>
                <span className="text-sm font-medium">
                  {createdProposal.total_eligible_votes.toLocaleString()} tokens
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          A post has been created in the community feed where members can view details and cast their votes.
        </p>
        <Button onClick={handleSuccessClose} className="w-full">
          <Vote className="w-4 h-4 mr-2" />
          View Community Feed
        </Button>
      </div>
    </div>
  );

  const content = (
    <div className="space-y-6">
      {step === 'form' && renderFormStep()}
      {step === 'review' && renderReviewStep()}
      {step === 'success' && renderSuccessStep()}

      {step === 'form' && (
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Review Proposal
          </Button>
        </div>
      )}

      {step === 'review' && (
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            Back to Edit
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Vote className="w-4 h-4 mr-2" />
                Create Proposal
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Vote className="w-5 h-5" />
              Create DAO Proposal
            </DrawerTitle>
            <DrawerDescription>
              Propose how to use {communityName} community funds
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Create DAO Proposal
          </SheetTitle>
          <SheetDescription>
            Propose how to use {communityName} community funds
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateProposalSheet;
