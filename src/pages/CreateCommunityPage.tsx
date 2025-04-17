import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommunityCreation, CommunityTypeOption } from '../hooks/useCommunityCreation';
import { useTitle } from '../hooks/useTitle';
import { Shield, Zap, Trophy, CheckCircle2, Lock, Globe, AlertCircle, HelpCircle, ChevronRight, Check, ArrowRight, Users, DollarSign } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchEthPrice } from '../utils/apiBase';

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
    confirmAdvancedTypeCreation,
    advancedTypeGasEstimate
  } = useCommunityCreation();

  const [animatedHandle, setAnimatedHandle] = useState('');
  const [showHandleSuggestion, setShowHandleSuggestion] = useState(false);
  
  // Add state for ETH price
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isEthPriceLoading, setIsEthPriceLoading] = useState(false);
  
  // Add this state for advanced type transaction modal
  const [showAdvancedTypeModal, setShowAdvancedTypeModal] = useState(false);
  const [advancedTypeData, setAdvancedTypeData] = useState<{
    estimatedGasFee?: string;
    totalCost?: number;
  } | null>(null);
  
  const [formErrors, setErrors] = useState<Record<string, string | undefined>>({});
  
  // Fetch ETH price when component mounts
  useEffect(() => {
    const getEthPrice = async () => {
      setIsEthPriceLoading(true);
      try {
        const response = await fetchEthPrice();
        if (response.success && response.price) {
          setEthPrice(response.price);
        } else {
          console.error('Failed to fetch ETH price:', response.error);
          // Fallback price if API fails
          setEthPrice(3000);
        }
      } catch (error) {
        console.error('Error fetching ETH price:', error);
        // Fallback price if API fails
        setEthPrice(3000);
      } finally {
        setIsEthPriceLoading(false);
      }
    };
    
    getEthPrice();
  }, []);
  
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
  
  // Estimate USD value using actual ETH price from API
  const estimateUsdValue = (ethValue: number) => {
    // Use the fetched price, or default to 3000 if not available
    const ethToUsd = ethPrice || 3000;
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
    // Allow only lowercase alphanumeric characters and hyphens
    const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    updateField('handle', sanitizedValue);
    
    // Update validation state
    if (sanitizedValue.length === 0) {
      setErrors((prev) => ({ ...prev, handle: "Handle is required" }));
    } else if (sanitizedValue.length < 3) {
      setErrors((prev) => ({ ...prev, handle: "Handle must be at least 3 characters" }));
    } else {
      setErrors((prev) => ({ ...prev, handle: undefined }));
    }
  };

  // Apply handle suggestion
  const applyHandleSuggestion = (suggestion: string) => {
    console.log("Applying handle suggestion:", suggestion);
    updateField('handle', suggestion);
    setErrors((prev) => ({ ...prev, handle: undefined }));
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

  // Render the community type selector
  const renderCommunityTypeSelector = () => {
    const communityTypes = [
      {
        id: 'general',
        title: 'General',
        description: 'Ideal for larger communities with gradual price rises',
        icon: <Globe className="h-6 w-6 text-[#31bcc3]" />,
        bgClass: 'bg-gradient-to-br from-blue-500/10 to-teal-500/10',
        earnings: 'Admin: 1.5% • Community: 2%',
        cost: '0.00106 ETH'
      },
      {
        id: 'niche',
        title: 'Niche',
        description: 'Best for smaller communities with faster price growth',
        icon: <Zap className="h-6 w-6 text-[#31bcc3]" />,
        bgClass: 'bg-gradient-to-br from-amber-500/10 to-rose-500/10',
        earnings: 'Admin: 1.5% • Community: 2%',
        cost: '0.00106 ETH'
      },
      {
        id: 'advanced',
        title: 'Advanced',
        description: 'Custom configuration for precise economic settings',
        icon: <Trophy className="h-6 w-6 text-[#31bcc3]" />,
        bgClass: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10',
        earnings: 'Custom settings',
        cost: 'Custom'
      }
    ];

    // For displaying the USD value of the community creation cost
    const communityCostETH = 0.00106;
    const communityCostUSD = estimateUsdValue(communityCostETH);

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
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-[#31bcc3]/20 p-1.5 mt-0.5">
                  <DollarSign className="h-3.5 w-3.5 text-[#31bcc3]" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Creation Cost: {communityTypes.find(t => t.id === state.communityType)?.cost}</span>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    One-time cost to create community and mint first share (≈${communityCostUSD} USD)
                    {isEthPriceLoading && <span className="ml-1 inline-block animate-pulse">updating...</span>}
                  </p>
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

        {/* Add a dedicated button for configuring advanced settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-center"
        >
          <Button
            onClick={handleAdvancedConfigTransaction}
            disabled={isLoading}
            className="px-8 py-6 bg-gradient-to-r from-[#31bcc3] to-primary text-white rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all w-full md:w-auto text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Configure Advanced Settings
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    );
  };

  // Render privacy settings section
  const renderPrivacySettings = () => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-xl border border-border/60 bg-muted/30 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className={`rounded-full p-2 ${state.isEncrypted ? 'bg-[#31bcc3]/20' : 'bg-muted/50'}`}>
                <Lock className={`h-5 w-5 ${state.isEncrypted ? 'text-[#31bcc3]' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h4 className="font-medium text-base mb-1">Encrypted Community</h4>
                <p className="text-sm text-muted-foreground">
                  When enabled, community content will be encrypted and only accessible to members.
                </p>
              </div>
            </div>
            <Switch
              checked={state.isEncrypted}
              onCheckedChange={value => updateField('isEncrypted', value)}
              className="data-[state=checked]:bg-[#31bcc3]"
            />
          </div>
        </motion.div>
      </div>
    );
  };

  // Render main form fields
  const renderFormFields = () => {
    return (
      <div className="mb-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="name" className="mb-2 block font-medium text-base">
              Community Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your community name"
              value={state.name}
              onChange={e => updateField('name', e.target.value)}
              className="transition-all duration-200 focus:border-[#31bcc3] focus:ring-[#31bcc3]/30 bg-background/80 backdrop-blur-sm border-border shadow-sm rounded-xl text-foreground font-normal py-6 px-4 text-base"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>
            
          <div>
            <Label htmlFor="handle" className="mb-2 block font-medium text-base">
              Community Handle
            </Label>
            
            <div className="space-y-3">
              {/* Handle Input Container */}
              <div className="relative rounded-xl overflow-hidden shadow-sm border border-border bg-background/80 backdrop-blur-sm focus-within:ring-2 focus-within:ring-[#31bcc3]/30 focus-within:border-[#31bcc3] transition-all duration-200">
                {/* URL Prefix Container */}
                <div className="flex items-center">
                  <div className="bg-[#31bcc3]/10 border-r border-border/40 py-3 px-4 select-none">
                    <span className="text-[#31bcc3] font-medium whitespace-nowrap">dapps.co/c/</span>
                  </div>
                
                  {/* Actual Input */}
                  <Input
                    id="handle"
                    placeholder="your-handle"
                    value={state.handle}
                    onChange={handleHandleChange}
                    className="border-0 rounded-none focus-visible:ring-0 py-3 px-4 bg-transparent shadow-none font-medium"
                  />
                </div>
              </div>
              
              {/* Preview Renderer - Shows how the handle will look */}
              {state.handle && (
                <div className="relative rounded-lg px-4 py-2 bg-[#31bcc3]/5 border border-[#31bcc3]/15">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-xs uppercase font-medium bg-[#31bcc3]/10 text-[#31bcc3] px-2 py-0.5 rounded">Preview</span>
                    <p className="font-medium text-foreground truncate">
                      <span className="text-[#31bcc3]">dapps.co/c/</span>
                      <span>{state.handle}</span>
                    </p>
                  </div>
                </div>
              )}
              
              {/* Show handle suggestion only when we have a name but no handle */}
              {showHandleSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-lg overflow-hidden"
                >
                  <div className="px-4 py-3 bg-[#31bcc3]/10 border border-[#31bcc3]/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">Suggested:</span>
                        <div className="bg-background/80 rounded px-2 py-1 border border-[#31bcc3]/30 font-medium text-foreground">
                          {animatedHandle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHandleSuggestion(false)}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Ignore
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => applyHandleSuggestion(animatedHandle)}
                        className="h-8 text-xs bg-[#31bcc3] hover:bg-[#31bcc3]/90 text-white"
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Error display */}
              {errors.handle && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.handle}</span>
                </p>
              )}
              
              {/* Helper text */}
              {!errors.handle && (
                <p className="text-xs text-muted-foreground">
                  Choose a unique handle that's easy to remember. Only letters, numbers, and hyphens allowed.
                </p>
              )}
            </div>
          </div>
            
          <div>
            <Label htmlFor="description" className="mb-2 block font-medium text-base">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What's your community about?"
              value={state.description}
              onChange={e => updateField('description', e.target.value)}
              className="min-h-[120px] transition-all duration-200 focus:border-[#31bcc3] focus:ring-[#31bcc3]/30 bg-background/80 backdrop-blur-sm border-border shadow-sm rounded-xl text-foreground font-normal resize-none p-4 text-base"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add advanced config completion screen
  const renderAdvancedConfigCompleted = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-10"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-[#31bcc3]/10"
        >
          <Trophy className="h-10 w-10 text-[#31bcc3]" />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute"
          >
            <CheckCircle2 className="h-10 w-10 text-[#31bcc3]" />
          </motion.div>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#31bcc3] to-primary bg-clip-text text-transparent"
        >
          Advanced Configuration Complete!
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/30 backdrop-blur-sm p-6 rounded-xl border border-border/50 max-w-xl mx-auto mb-8"
        >
          <h3 className="text-lg font-medium mb-3">Configuration Summary</h3>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground text-left">Community Name:</dt>
            <dd className="font-medium text-right">{state.name}</dd>
            
            <dt className="text-muted-foreground text-left">Handle:</dt>
            <dd className="font-medium text-right">dapps.co/c/{state.handle}</dd>
            
            <dt className="text-muted-foreground text-left">Type:</dt>
            <dd className="font-medium text-right flex items-center justify-end gap-1">
              <Badge variant="outline" className="bg-[#31bcc3]/10 text-[#31bcc3] border-[#31bcc3]/40">
                Advanced
              </Badge>
            </dd>
            
            <dt className="text-muted-foreground text-left">K Value:</dt>
            <dd className="font-medium text-right">{state.advancedConfig.k}</dd>
            
            <dt className="text-muted-foreground text-left">Alpha (Ξ):</dt>
            <dd className="font-medium text-right">{state.advancedConfig.alpha}</dd>
            
            <dt className="text-muted-foreground text-left">Base Price:</dt>
            <dd className="font-medium text-right">{state.advancedConfig.basePrice} ETH</dd>
            
            <dt className="text-muted-foreground text-left">Community Rewards:</dt>
            <dd className="font-medium text-right">{state.advancedConfig.rewardPercentage}%</dd>
            
            <dt className="text-muted-foreground text-left">Admin Earnings:</dt>
            <dd className="font-medium text-right">{state.advancedConfig.adminEarningPercentage}%</dd>
          </dl>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleCreateCommunity}
            disabled={isLoading}
            className="px-8 py-6 bg-gradient-to-r from-[#31bcc3] to-primary text-white rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all"
          >
            {isLoading ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Launch Community
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    );
  };

  // Also add the success screen component
  const renderSuccessScreen = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-10"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-[#31bcc3]/10"
        >
          <CheckCircle2 className="h-10 w-10 text-[#31bcc3]" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mb-4"
        >
          Community Created Successfully!
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Badge variant="outline" className="mx-auto bg-muted/40 text-muted-foreground">
            {state.isEncrypted ? 'Encrypted' : 'Public'} · {state.communityType.charAt(0).toUpperCase() + state.communityType.slice(1)}
          </Badge>
          
          <p className="mt-4 text-muted-foreground">
            You'll be redirected to your new community page shortly...
            <Sparkles className="inline-block ml-2 h-4 w-4 animate-pulse" />
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleNavigateToCommunity}
            className="px-8 py-6 bg-gradient-to-r from-[#31bcc3] to-primary text-white rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all"
          >
            Go to Community
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hide mobile navigation for this page */}
      <style>{`
        @media (max-width: 768px) {
          nav.bottom-0.fixed, 
          .fixed.bottom-0.left-0.right-0.z-50,
          div[class*="fixed bottom-0"] {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background to-muted/30" />
        <div className="absolute -top-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-[40%] -left-[30%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-[#31bcc3]/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute top-1/4 left-1/2 w-2 h-2 rounded-full bg-[#31bcc3]/60 animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 rounded-full bg-[#31bcc3]/40 animate-pulse delay-500" />
        <div className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-[#31bcc3]/50 animate-pulse delay-1000" />
      </div>

      <div className="container max-w-4xl mx-auto pt-16 pb-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Create Your Community
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Build a space for your audience, members, or team to connect and share.
          </p>
        </motion.div>

        {/* Skip forward section */}
        {step === 'form' && (
          <>
            {renderFormFields()}
            {renderPrivacySettings()}
            {renderCommunityTypeSelector()}
            {state.communityType === 'advanced' && renderAdvancedConfig()}
            
            {/* Add Create Community Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex justify-center"
            >
              {/* For non-advanced community types, always show the button */}
              {/* For advanced type, only show when step is 'advanced' */}
              {(state.communityType !== 'advanced' || 
                (state.communityType === 'advanced' && (step as string) === 'advanced')) && (
                  <Button
                    onClick={handleCreateCommunity}
                    disabled={isLoading}
                    className="px-8 py-6 bg-gradient-to-r from-[#31bcc3] to-primary text-white rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all w-full md:w-auto text-lg font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Create Community
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                )}
            </motion.div>
            
            {/* Add error display for general form errors */}
            {(errors.name || errors.handle || errors.description || errors.advancedConfigError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 flex items-start gap-2"
              >
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Please fix the form errors</p>
                  {/* Use dangerouslySetInnerHTML to render the HTML link for deposit page */}
                  <p 
                    className="text-sm mt-1"
                    dangerouslySetInnerHTML={{ 
                      __html: errors.name || errors.handle || errors.description || errors.advancedConfigError || '' 
                    }}
                  />
                </div>
              </motion.div>
            )}
          </>
        )}
        
        {step === 'advanced' && renderAdvancedConfigCompleted()}
        {step === 'complete' && renderSuccessScreen()}
        
        {/* Transaction sheets */}
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
          advancedConfig={state.advancedConfig}
        />
        
        {/* Advanced type modal */}
        <CommunityTransactionSheet
          open={showAdvancedTypeModal}
          onOpenChange={setShowAdvancedTypeModal}
          step={transactionStep}
          isLoading={isLoading}
          communityName={state.name}
          communityHandle={state.handle}
          isEncrypted={state.isEncrypted}
          communityType={state.communityType}
          estimatedGasFee={advancedTypeData?.estimatedGasFee}
          totalCost={advancedTypeData?.totalCost}
          customTitle="Advanced Community Type"
          customDescription="You're creating a custom economic model for your community. This transaction will set up your community's unique share price curve and reward distribution."
          onConfirm={async () => {
            // Call the confirm function for advanced type
            try {
              await confirmAdvancedTypeCreation();
            } catch (error) {
              console.error("Error during advanced type creation:", error);
            }
          }}
          onComplete={() => {
            // Close the modal and continue to the advanced configuration summary
            setShowAdvancedTypeModal(false);
          }}
          txHash={txHash}
          isAdvanced={true}
          advancedConfig={state.advancedConfig}
        />
      </div>
    </div>
  );
};

export default CreateCommunityPage; 