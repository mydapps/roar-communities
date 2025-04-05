import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommunityCreation, CommunityTypeOption } from '../hooks/useCommunityCreation';
import { useTitle } from '../hooks/useTitle';
import { Shield, Zap, Trophy, CheckCircle2, Lock, Globe, AlertCircle, HelpCircle, ChevronRight, Check, ArrowRight, Users } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// UI components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Slider } from '../components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { CommunityTransactionSheet } from '../components/community/CommunityTransactionSheet';

const CreateCommunityPage = () => {
  useTitle('Create Community | Dapps.co');
  const navigate = useNavigate();
  
  const {
    state,
    errors,
    isLoading,
    step,
    transactionStep,
    transactionData,
    txHash,
    updateField,
    updateAdvancedConfig,
    validateForm,
    handleSubmitAdvancedConfig,
    handleCreateCommunity,
    calculateSharePrice,
    validateCommunityCreation,
    confirmCommunityCreation,
    prepareAdvancedTypeCreation,
    advancedTypeGasEstimate
  } = useCommunityCreation();

  const [animatedHandle, setAnimatedHandle] = useState('');
  const [showHandleSuggestion, setShowHandleSuggestion] = useState(false);
  
  // Add this state for advanced type transaction modal
  const [showAdvancedTypeModal, setShowAdvancedTypeModal] = useState(false);
  const [advancedTypeData, setAdvancedTypeData] = useState<{
    estimatedGasFee?: string;
    totalCost?: number;
  } | null>(null);
  
  // Set default values for alpha and base price
  useEffect(() => {
    if (state.communityType === 'advanced') {
      // Set alpha to 0.0003 unconditionally 
      updateAdvancedConfig('alpha', 0.0003);
      // Set basePrice to 0.001 unconditionally
      updateAdvancedConfig('basePrice', 0.001);
    }
  }, [state.communityType]);
  
  // Add useEffect for automatic redirection
  useEffect(() => {
    if (step === 'complete' && state.handle) {
      // Wait 3 seconds before redirecting
      const redirectTimer = setTimeout(() => {
        console.log(`Redirecting to community: /c/${state.handle}`);
        navigate(`/c/${state.handle}`);
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [step, state.handle, navigate]);
  
  // Handle direct navigation to community after creation 
  const handleNavigateToCommunity = () => {
    console.log(`Manually navigating to: /c/${state.handle}`);
    navigate(`/c/${state.handle}`);
  };
  
  // Estimate USD value (1 ETH = $2500 placeholder value)
  const estimateUsdValue = (ethValue: number) => {
    const ethToUsd = 2500; // Placeholder exchange rate
    return (ethValue * ethToUsd).toFixed(2);
  };
  
  // Auto-generate handle suggestion based on community name
  useEffect(() => {
    if (state.name && !state.handle) {
      const suggestedHandle = state.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      if (suggestedHandle) {
        setAnimatedHandle(suggestedHandle);
        setShowHandleSuggestion(true);
      }
    } else {
      setShowHandleSuggestion(false);
    }
  }, [state.name, state.handle]);

  // Handle input validation - only allow alphanumeric and hyphen
  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^a-z0-9-]/g, '');
    updateField('handle', sanitizedValue);
  };

  // Apply handle suggestion
  const applyHandleSuggestion = () => {
    updateField('handle', animatedHandle);
    setShowHandleSuggestion(false);
  };

  // Update the handler for advanced configuration transaction
  const handleAdvancedConfigTransaction = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // Fetch gas estimates from the API
      const gasEstimate = await prepareAdvancedTypeCreation();
      
      if (gasEstimate.success) {
        // Set the data for the modal display
        setAdvancedTypeData({
          estimatedGasFee: gasEstimate.estimatedGasFee,
          totalCost: gasEstimate.totalCost,
        });
        
        // Show the transaction modal
        setShowAdvancedTypeModal(true);
      } else {
        // Add error to the local state instead of just toast
        updateField('advancedConfigError' as any, gasEstimate.error || "Failed to prepare advanced configuration. Please try again.");
        // Still show toast for immediate feedback
        toast.error(gasEstimate.error || "Failed to prepare advanced configuration. Please try again.");
      }
    } catch (error) {
      console.error("Error preparing advanced configuration:", error);
      // Add error to the local state
      updateField('advancedConfigError' as any, error instanceof Error ? error.message : "Failed to prepare advanced configuration. Please try again.");
      toast.error("Failed to prepare advanced configuration. Please try again.");
    }
  };

  // Handler for confirming the advanced type creation
  const handleConfirmAdvancedType = async () => {
    try {
      await handleSubmitAdvancedConfig();
      // Modal will close automatically when step changes to 'advanced'
    } catch (error) {
      console.error("Error creating advanced community type:", error);
    }
  };

  // Render the community type selector
  const renderCommunityTypeSelector = () => {
    const communityTypes = [
      {
        id: 'general',
        title: 'General',
        description: 'Ideal for larger communities with gradual price rises',
        icon: <Globe className="h-6 w-6 text-[#31bcc3]" />,
        bgClass: 'bg-gradient-to-br from-blue-500/10 to-teal-500/10',
        earnings: 'Admin: 1.5% • Community: 2%'
      },
      {
        id: 'niche',
        title: 'Niche',
        description: 'Best for smaller communities with faster price growth',
        icon: <Zap className="h-6 w-6 text-[#31bcc3]" />,
        bgClass: 'bg-gradient-to-br from-amber-500/10 to-rose-500/10',
        earnings: 'Admin: 1.5% • Community: 2%'
      },
      {
        id: 'advanced',
        title: 'Advanced',
        description: 'Custom configuration for precise economic settings',
        icon: <Trophy className="h-6 w-6 text-[#31bcc3]" />,
        bgClass: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10',
        earnings: 'Custom settings'
      }
    ];

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Community Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {communityTypes.map((type) => (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              className="relative"
            >
              <div
                className={`cursor-pointer p-5 rounded-xl flex flex-col items-center text-center gap-4 border-2 transition-all ${
                  state.communityType === type.id 
                    ? 'border-[#31bcc3] bg-[#31bcc3]/10 shadow-md shadow-[#31bcc3]/10' 
                    : 'border-border hover:border-[#31bcc3]/50 ' + type.bgClass
                }`}
                onClick={() => updateField('communityType', type.id as CommunityTypeOption)}
              >
                <div className={`rounded-full p-4 transition-all duration-300 ${
                  state.communityType === type.id 
                    ? 'bg-[#31bcc3]/20' 
                    : 'bg-muted/50'
                }`}>
                  {type.icon}
                </div>
                <div>
                  <h4 className="font-medium text-base mb-1 text-foreground">{type.title}</h4>
                  <p className="text-sm text-muted-foreground mb-1">{type.description}</p>
                  <Badge variant="outline" className="text-xs bg-muted/40 text-muted-foreground">
                    {type.earnings}
                  </Badge>
                </div>
                {state.communityType === type.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 bg-[#31bcc3] rounded-full p-1.5 shadow-lg shadow-[#31bcc3]/20"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        
        {(state.communityType === 'general' || state.communityType === 'niche') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50 text-sm"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-[#31bcc3]/20 p-1.5 mt-0.5">
                  <Users className="h-3.5 w-3.5 text-[#31bcc3]" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Community Rewards: 2%</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Distributed to top creators within the community every month.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-[#31bcc3]/20 p-1.5 mt-0.5">
                  <Trophy className="h-3.5 w-3.5 text-[#31bcc3]" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Admin Earnings: 1.5%</span>
                  <p className="text-muted-foreground text-xs mt-0.5">Earned by you as the community admin from each trade.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Render advanced configuration fields
  const renderAdvancedConfig = () => {
    if (state.communityType !== 'advanced') return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-muted/30 backdrop-blur-sm p-6 rounded-xl border border-border/50 shadow-inner"
      >
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.1, 1] }}
                transition={{ duration: 0.5 }}
                className="rounded-full bg-[#31bcc3]/20 p-1.5"
              >
                <Trophy className="h-5 w-5 text-[#31bcc3]" />
              </motion.div>
              <h3 className="font-semibold text-lg">Advanced Economics</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Configure the economic parameters of your community using the formula: Share Price = Base Price + Alpha × (Shares-1)<sup>k</sup></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="outline" className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/40 px-2 py-1 text-xs md:px-3 md:py-1.5 md:text-sm hidden sm:inline-flex">
              Expert Mode
            </Badge>
          </div>
          <Badge variant="outline" className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/40 px-2 py-1 text-xs mb-3 sm:hidden inline-flex">
            Expert Mode
          </Badge>
          <div className="text-sm text-muted-foreground mb-5">
            Fine-tune the economic parameters of your community with the formula:
            <motion.div 
              initial={{ opacity: 0.5, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-mono bg-background/70 p-3 rounded-lg mt-2 text-center border border-border/50"
            >
              SharePrice = BasePrice + Alpha × (Shares-1)<sup>k</sup>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block">
              k Value <span className="text-sm text-muted-foreground">(Controls curve steepness)</span>
            </Label>
            <Tabs 
              value={state.advancedConfig.k.toString()} 
              onValueChange={(value) => updateAdvancedConfig('k', parseInt(value))}
              className="w-full"
            >
              <TabsList className="w-full mb-2 p-1 bg-muted/50 backdrop-blur-sm">
                {[1, 2, 3].map(value => (
                  <TabsTrigger
                    key={value}
                    value={value.toString()}
                    className={state.advancedConfig.k === value 
                      ? 'bg-[#31bcc3] text-white shadow-md data-[state=active]:bg-[#31bcc3] data-[state=active]:text-white'
                      : 'data-[state=active]:bg-background'
                    }
                  >
                    {value}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {errors['advancedConfig.k'] && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors['advancedConfig.k']}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Higher values create steeper price curves better for smaller, exclusive communities.
            </p>
          </div>

          <div>
            <Label htmlFor="alpha" className="mb-2 block">
              Alpha <span className="text-sm text-muted-foreground">(Price sensitivity)</span>
            </Label>
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="w-full"
              >
                <div className="relative flex items-center">
                  <Input
                    id="alpha"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={state.advancedConfig.alpha}
                    onChange={e => updateAdvancedConfig('alpha', parseFloat(e.target.value))}
                    className="pr-16 transition-all duration-200 focus:border-[#31bcc3] focus:ring-[#31bcc3]/30 bg-background/50 backdrop-blur-sm border-border/60 rounded-xl text-foreground font-normal"
                  />
                  <div className="absolute right-0 inset-y-0 flex items-center pr-3 pointer-events-none bg-muted/40 rounded-r-xl border-l border-border/40 pl-3">
                    <span className="text-muted-foreground font-medium text-sm">ETH</span>
                  </div>
                </div>
              </motion.div>
            </div>
            {errors['advancedConfig.alpha'] && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors['advancedConfig.alpha']}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="basePrice" className="mb-2 block">
              Base Price <span className="text-sm text-muted-foreground">(Starting price)</span>
            </Label>
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="w-full"
              >
                <div className="relative flex items-center">
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.001"
                    min="0"
                    value={state.advancedConfig.basePrice}
                    onChange={e => updateAdvancedConfig('basePrice', parseFloat(e.target.value))}
                    className="pr-16 transition-all duration-200 focus:border-[#31bcc3] focus:ring-[#31bcc3]/30 bg-background/50 backdrop-blur-sm border-border/60 rounded-xl text-foreground font-normal"
                  />
                  <div className="absolute right-0 inset-y-0 flex items-center pr-3 pointer-events-none bg-muted/40 rounded-r-xl border-l border-border/40 pl-3">
                    <span className="text-muted-foreground font-medium text-sm">ETH</span>
                  </div>
                </div>
              </motion.div>
            </div>
            {errors['advancedConfig.basePrice'] && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors['advancedConfig.basePrice']}</span>
              </p>
            )}
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label htmlFor="rewardPercentage">
                  Community Rewards <span className="text-sm text-muted-foreground">(Max 5%)</span>
                </Label>
                <motion.span 
                  key={state.advancedConfig.rewardPercentage}
                  initial={{ scale: 0.8, color: '#31bcc3' }}
                  animate={{ scale: 1, color: '#666' }}
                  className="text-sm font-medium bg-[#31bcc3]/10 px-2 py-0.5 rounded"
                >
                  {state.advancedConfig.rewardPercentage}%
                </motion.span>
              </div>
              <Slider
                id="rewardPercentage"
                value={[state.advancedConfig.rewardPercentage]}
                min={0}
                max={5}
                step={0.1}
                onValueChange={value => {
                  const newRewardPercentage = value[0];
                  const adminPercentage = state.advancedConfig.adminEarningPercentage;
                  
                  // If the total would exceed 5%, adjust the admin percentage
                  if (newRewardPercentage + adminPercentage > 5) {
                    updateAdvancedConfig('adminEarningPercentage', parseFloat((5 - newRewardPercentage).toFixed(1)));
                  }
                  
                  updateAdvancedConfig('rewardPercentage', newRewardPercentage);
                }}
                className="py-4"
              />
              {errors['advancedConfig.rewardPercentage'] && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors['advancedConfig.rewardPercentage']}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Distributed to top creators within the community every month.
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label htmlFor="adminEarningPercentage">
                  Admin Earnings <span className="text-sm text-muted-foreground">(Max 5%)</span>
                </Label>
                <motion.span 
                  key={state.advancedConfig.adminEarningPercentage}
                  initial={{ scale: 0.8, color: '#31bcc3' }}
                  animate={{ scale: 1, color: '#666' }}
                  className="text-sm font-medium bg-[#31bcc3]/10 px-2 py-0.5 rounded"
                >
                  {state.advancedConfig.adminEarningPercentage}%
                </motion.span>
              </div>
              <Slider
                id="adminEarningPercentage"
                value={[state.advancedConfig.adminEarningPercentage]}
                min={0}
                max={5}
                step={0.1}
                onValueChange={value => {
                  const newAdminPercentage = value[0];
                  const rewardPercentage = state.advancedConfig.rewardPercentage;
                  
                  // If the total would exceed 5%, adjust the reward percentage
                  if (newAdminPercentage + rewardPercentage > 5) {
                    updateAdvancedConfig('rewardPercentage', parseFloat((5 - newAdminPercentage).toFixed(1)));
                  }
                  
                  updateAdvancedConfig('adminEarningPercentage', newAdminPercentage);
                }}
                className="py-4"
              />
              {errors['advancedConfig.adminEarningPercentage'] && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors['advancedConfig.adminEarningPercentage']}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Earned by you as the community admin from each trade.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-sm">Total fees:</p>
            <Badge 
              className={`px-2 py-1 ${
                state.advancedConfig.rewardPercentage + state.advancedConfig.adminEarningPercentage > 5 
                  ? 'bg-red-100 text-red-800 border-red-200' 
                  : 'bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/20'
              }`}
            >
              {(state.advancedConfig.rewardPercentage + state.advancedConfig.adminEarningPercentage).toFixed(1)}% / 5%
            </Badge>
          </div>

          {/* Share Price Calculator Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2 bg-background/80 backdrop-blur-sm rounded-xl p-5 border border-border/50 mt-4 shadow-sm"
          >
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <div className="rounded-full bg-[#31bcc3]/20 p-1.5">
                <Sparkles className="h-4 w-4 text-[#31bcc3]" />
              </div>
              <span>Share Price Simulator</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <motion.div 
                whileHover={{ y: -2 }}
                className="p-4 bg-muted/50 rounded-lg border border-border/40 transition-all duration-200"
              >
                <p className="text-muted-foreground mb-1 text-sm">First Share</p>
                <p className="font-medium text-lg text-[#31bcc3]">
                  {state.advancedConfig.basePrice.toFixed(4)} ETH
                </p>
                <p className="text-xs text-muted-foreground">
                  ~${estimateUsdValue(state.advancedConfig.basePrice)}
                </p>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                className="p-4 bg-muted/50 rounded-lg border border-border/40 transition-all duration-200"
              >
                <p className="text-muted-foreground mb-1 text-sm">After 100 Shares</p>
                <p className="font-medium text-lg text-[#31bcc3]">
                  {calculateSharePrice(100)?.toFixed(4) || '0'} ETH
                </p>
                <p className="text-xs text-muted-foreground">
                  ~${estimateUsdValue(calculateSharePrice(100) || 0)}
                </p>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                className="p-4 bg-muted/50 rounded-lg border border-border/40 transition-all duration-200"
              >
                <p className="text-muted-foreground mb-1 text-sm">After 1000 Shares</p>
                <p className="font-medium text-lg text-[#31bcc3]">
                  {calculateSharePrice(1000)?.toFixed(4) || '0'} ETH
                </p>
                <p className="text-xs text-muted-foreground">
                  ~${estimateUsdValue(calculateSharePrice(1000) || 0)}
                </p>
              </motion.div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                These values show how your share price will grow as more people join your community.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ marginBottom: '-72px' }}>
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background to-muted/30" />
        <div className="absolute -top-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-[40%] -left-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute top-1/4 left-1/2 w-2 h-2 rounded-full bg-[#31bcc3]/60 animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 rounded-full bg-[#31bcc3]/40 animate-pulse delay-500" />
        <div className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-[#31bcc3]/50 animate-pulse delay-1000" />
      </div>

      <div className="container max-w-4xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center mt-14"
        >
          <div className="inline-block mb-4">
            <motion.div
              animate={{ 
                boxShadow: ['0 0 0 0px rgba(49, 188, 195, 0.2)', '0 0 0 10px rgba(49, 188, 195, 0)'],
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2,
              }}
              className="rounded-full bg-[#31bcc3]/20 p-4"
            >
              <Users className="h-10 w-10 text-[#31bcc3]" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-[#31bcc3]">Create Your Community</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Create a space where like-minded people truly belong, connect with purpose, and grow together through shared interests and investment.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative bg-card/80 backdrop-blur-md rounded-xl border border-border/50 shadow-lg overflow-hidden"
            >
              {/* Animated corner accent */}
              <div className="absolute top-0 right-0 w-40 h-40 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#31bcc3]/20 to-transparent transform rotate-45 translate-x-10 -translate-y-10" />
              </div>

              <div className="p-6 md:p-8">
                {/* Show API error alert if any field has an error from the API */}
                {(errors.name || errors.handle) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 flex items-start gap-2"
                  >
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Community Creation Error</p>
                      <p className="text-sm mt-1">{errors.name || errors.handle}</p>
                    </div>
                  </motion.div>
                )}
                
                <motion.div layout className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="mb-2 block text-base">
                      Community Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={state.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g., Crypto Enthusiasts"
                      className={`${errors.name ? 'border-red-500' : ''} py-6 px-4 text-base transition-all duration-200 focus:border-[#31bcc3] focus:ring-[#31bcc3]/30 bg-background/50 backdrop-blur-sm border-border/60 rounded-xl hover:border-[#31bcc3]/30 text-foreground font-normal`}
                    />
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.name}</span>
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="handle" className="mb-2 block text-base">
                      Community Handle <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center mb-1 group">
                      <div className="bg-muted/80 px-4 py-3 rounded-l-md border border-r-0 border-input text-muted-foreground group-hover:border-[#31bcc3]/50 transition-colors duration-200">
                        dapps.co/c/
                      </div>
                      <Input
                        id="handle"
                        value={state.handle}
                        onChange={handleHandleChange}
                        placeholder="your-community-handle"
                        className={`rounded-l-none py-6 px-4 text-base transition-all duration-200 focus:border-[#31bcc3] focus:ring-[#31bcc3]/30 group-hover:border-[#31bcc3]/50 bg-background/50 backdrop-blur-sm text-foreground font-normal ${errors.handle ? 'border-red-500' : ''}`}
                      />
                    </div>

                    {showHandleSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-2"
                      >
                        <span>Suggested:</span>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-[#31bcc3]/10 hover:text-[#31bcc3] transition-colors"
                          onClick={applyHandleSuggestion}
                        >
                          {animatedHandle}
                        </Badge>
                        <button
                          onClick={applyHandleSuggestion}
                          className="text-xs text-[#31bcc3] hover:underline flex items-center"
                        >
                          <span>Use this</span>
                          <CheckCircle2 className="ml-1 h-3 w-3" />
                        </button>
                      </motion.div>
                    )}

                    {errors.handle && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.handle}</span>
                      </motion.p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be your community's unique URL. Only alphanumeric characters and hyphens allowed.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description" className="mb-2 block text-base">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={state.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Tell people what your community is about..."
                      rows={4}
                      className="resize-none transition-all duration-200 focus:border-[#31bcc3] focus:ring-[#31bcc3]/30 bg-background/50 backdrop-blur-sm border-border/60 rounded-xl hover:border-[#31bcc3]/30 text-foreground font-normal"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="isEncrypted" className="text-base font-medium">
                          Privacy Setting
                        </Label>
                        <p className="text-sm text-muted-foreground">Choose whether your community content is public or encrypted</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isEncrypted"
                          checked={state.isEncrypted}
                          onCheckedChange={(checked) => updateField('isEncrypted', checked)}
                          className="data-[state=checked]:bg-[#31bcc3]"
                        />
                        <Label htmlFor="isEncrypted" className="cursor-pointer">
                          {state.isEncrypted ? (
                            <span className="flex items-center gap-1 text-sm font-medium">
                              <Lock className="h-3.5 w-3.5" /> Encrypted
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm font-medium">
                              <Globe className="h-3.5 w-3.5" /> Public
                            </span>
                          )}
                        </Label>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/40 backdrop-blur-sm rounded-lg text-sm border border-border/50">
                      {state.isEncrypted ? (
                        <div className="flex items-start gap-2">
                          <div className="rounded-full bg-[#31bcc3]/20 p-1.5 mt-0.5">
                            <Lock className="h-3.5 w-3.5 text-[#31bcc3]" />
                          </div>
                          <span>
                            <span className="font-medium">Encrypted: </span> 
                            Only community members will be able to view the content. Best for private or exclusive communities.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <div className="rounded-full bg-[#31bcc3]/20 p-1.5 mt-0.5">
                            <Globe className="h-3.5 w-3.5 text-[#31bcc3]" />
                          </div>
                          <span>
                            <span className="font-medium">Public: </span>
                            Anyone can view the content, but only members can post. Best for growing communities and maximum reach.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {renderCommunityTypeSelector()}
                  {renderAdvancedConfig()}
                </motion.div>
              </div>

              {/* Show advanced config error if present */}
              {state.advancedConfigError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 flex items-start gap-2"
                >
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Advanced Configuration Error</p>
                    <p className="text-sm mt-1">{state.advancedConfigError}</p>
                  </div>
                </motion.div>
              )}

              <motion.div 
                layout 
                className="p-6 bg-muted/30 backdrop-blur-sm border-t border-border flex flex-col sm:flex-row justify-end gap-4"
              >
                {state.communityType === 'advanced' ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleAdvancedConfigTransaction}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-[#31bcc3] to-primary hover:from-primary hover:to-[#31bcc3] text-white shadow-md shadow-[#31bcc3]/20 px-6 py-6 text-base w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Sparkles className="h-4 w-4" />
                          </motion.span>
                          Processing...
                        </>
                      ) : (
                        <>
                          Configure Advanced Settings
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleCreateCommunity}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-[#31bcc3] to-primary hover:from-primary hover:to-[#31bcc3] text-white shadow-md shadow-[#31bcc3]/20 px-6 py-6 text-base w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Sparkles className="h-4 w-4" />
                          </motion.span>
                          Creating Community...
                        </>
                      ) : (
                        <>
                          Create Community
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {step === 'advanced' && (
            <motion.div
              key="advanced"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-card/80 backdrop-blur-md rounded-xl border border-border/50 shadow-lg overflow-hidden"
            >
              <div className="p-6 md:p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ 
                      boxShadow: ['0 0 0 0px rgba(49, 188, 195, 0.2)', '0 0 0 10px rgba(49, 188, 195, 0)'],
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 2,
                    }}
                    className="w-20 h-20 rounded-full bg-[#31bcc3]/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <Trophy className="h-10 w-10 text-[#31bcc3]" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-2 -right-2 bg-gradient-to-r from-[#31bcc3] to-primary rounded-full p-1.5 shadow-lg"
                  >
                    <Check className="h-4 w-4 text-white" />
                  </motion.div>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold mb-3 text-[#31bcc3]"
                >
                  Advanced Configuration Complete!
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground mb-8 max-w-md mx-auto"
                >
                  Your advanced economic parameters have been configured. You're now ready to launch your community!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-muted/30 backdrop-blur-sm p-5 rounded-xl mb-6 text-left border border-border/50"
                >
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#31bcc3]" />
                    <span>Configuration Summary</span>
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between items-center border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Community Name:</span>
                      <span className="font-medium">{state.name}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Handle:</span>
                      <span className="font-medium">dapps.co/c/{state.handle}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/30">Advanced</Badge>
                    </li>
                    <li className="flex justify-between items-center border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">k Value:</span>
                      <span className="font-medium">{state.advancedConfig.k}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Alpha:</span>
                      <span className="font-medium">{state.advancedConfig.alpha} ETH</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span className="font-medium">{state.advancedConfig.basePrice} ETH</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Community Rewards:</span>
                      <span className="font-medium">{state.advancedConfig.rewardPercentage}%</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-muted-foreground">Admin Earnings:</span>
                      <span className="font-medium">{state.advancedConfig.adminEarningPercentage}%</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              <div className="p-6 bg-muted/30 backdrop-blur-sm border-t border-border flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={handleCreateCommunity}
                    disabled={isLoading}
                    size="lg"
                    className="bg-gradient-to-r from-[#31bcc3] to-primary hover:from-primary hover:to-[#31bcc3] text-white shadow-lg shadow-[#31bcc3]/20 px-8 py-6 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Sparkles className="h-5 w-5" />
                        </motion.span>
                        Creating Community...
                      </>
                    ) : (
                      <>
                        Launch Community
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card/80 backdrop-blur-md rounded-xl border border-border/50 shadow-lg overflow-hidden text-center p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 20, 
                  delay: 0.2 
                }}
              >
                <motion.div
                  animate={{ 
                    boxShadow: ['0 0 0 0px rgba(49, 188, 195, 0.3)', '0 0 0 15px rgba(49, 188, 195, 0)'],
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2,
                  }}
                  className="w-24 h-24 rounded-full bg-[#31bcc3]/20 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="h-12 w-12 text-[#31bcc3]" />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold mb-3 text-[#31bcc3]">Community Created Successfully!</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                  Congratulations! Your new community is now live. You'll be redirected to your community page shortly.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-block mb-8"
              >
                <Badge className="bg-[#31bcc3]/20 text-[#31bcc3] border-[#31bcc3]/30 px-4 py-1.5 text-base">
                  {state.isEncrypted ? 'Encrypted' : 'Public'} · {state.communityType.charAt(0).toUpperCase() + state.communityType.slice(1)} Community
                </Badge>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
                className="mt-8 text-muted-foreground flex flex-col items-center"
              >
                <span>Redirecting to your new community...</span>
                <div className="mt-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-6 w-6 text-[#31bcc3]" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Type Creation Transaction Sheet/Modal */}
        <CommunityTransactionSheet
          open={showAdvancedTypeModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowAdvancedTypeModal(false);
            }
          }}
          step={isLoading ? 'confirm' : 'initialize'}
          isLoading={isLoading}
          communityName={state.name}
          communityHandle={state.handle}
          isEncrypted={state.isEncrypted}
          communityType="Advanced"
          estimatedGasFee={advancedTypeData?.estimatedGasFee}
          totalCost={advancedTypeData?.totalCost}
          onConfirm={handleConfirmAdvancedType}
          isAdvanced={true}
          customTitle="Advanced Economics Setup"
          customDescription="You're about to set up advanced economic parameters for your community. This requires a transaction on the blockchain."
        />

        {/* Main community creation transaction sheet (existing) */}
        <CommunityTransactionSheet
          open={step === 'transaction'}
          onOpenChange={(open) => {
            if (!open && step === 'transaction') {
              // If the sheet is being closed while in transaction step, go back to form
              updateField('step' as any, 'form');
            }
          }}
          step={transactionStep}
          isLoading={isLoading}
          communityName={state.name}
          communityHandle={state.handle}
          isEncrypted={state.isEncrypted}
          communityType={state.communityType}
          estimatedGasFee={transactionData?.estimatedGasFee}
          totalCost={transactionData?.totalCost}
          onConfirm={async () => {
            // Call the confirm function and ignore the boolean return value
            try {
              await confirmCommunityCreation();
            } catch (error) {
              console.error("Error during community creation confirmation:", error);
            }
          }}
          onComplete={handleNavigateToCommunity}
          txHash={txHash}
          isAdvanced={state.communityType === 'advanced'}
        />
      </div>
    </div>
  );
};

export default CreateCommunityPage; 