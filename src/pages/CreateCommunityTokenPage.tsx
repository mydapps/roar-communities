import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Crown,
  Upload,
  Info,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Percent,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import CommunityCreationSuccess from '@/components/ui/community-creation-success';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createCommunityToken, validateTokenCreation, CreateTokenRequest, checkTickerAvailability } from '@/utils/communityTokensApi';
import { MediaUploadResponse } from '@/utils/postApi';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface FormData {
  name: string;
  ticker: string;
  description: string;
  image: File | null;
  rewardPoolPercent: number;
  ethAmount: string;
}

interface ValidationErrors {
  name?: string;
  ticker?: string;
  description?: string;
  image?: string;
  ethAmount?: string;
}

interface TickerValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  isValidFormat: boolean | null;
  message: string;
}

const CreateCommunityTokenPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    ticker: '',
    description: '',
    image: null,
    rewardPoolPercent: 10,
    ethAmount: '0.001'
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTokenData, setCreatedTokenData] = useState<any>(null);

  // New state for ticker validation
  const [tickerValidation, setTickerValidation] = useState<TickerValidationState>({
    isChecking: false,
    isAvailable: null,
    isValidFormat: null,
    message: ''
  });

  // New state for image upload
  const [uploadedImage, setUploadedImage] = useState<MediaUploadResponse | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Run initial validation on component mount
  useEffect(() => {
    validateField('name', formData.name);
    validateField('ticker', formData.ticker);
    validateField('ethAmount', formData.ethAmount);
    // Don't validate image on mount since it's optional
  }, []); // Empty dependency array means this runs once on mount

  // Real-time validation
  const validateField = (field: keyof FormData, value: any) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Community name is required';
        } else if (value.length < 3) {
          newErrors.name = 'Name must be at least 3 characters';
        } else if (value.length > 50) {
          newErrors.name = 'Name must be less than 50 characters';
        } else {
          delete newErrors.name;
        }
        break;

      case 'ticker':
        const tickerRegex = /^[A-Z0-9]+$/;
        if (!value.trim()) {
          newErrors.ticker = 'Ticker is required';
        } else if (!tickerRegex.test(value)) {
          newErrors.ticker = 'Only A-Z and 0-9 allowed';
        } else if (value.length < 2) {
          newErrors.ticker = 'Ticker must be at least 2 characters';
        } else if (value.length > 15) {
          newErrors.ticker = 'Ticker must be 15 characters or less';
        } else {
          delete newErrors.ticker;
        }
        break;

      case 'description':
        if (value.trim() && value.length < 20) {
          newErrors.description = 'Description must be at least 20 characters';
        } else if (value.length > 500) {
          newErrors.description = 'Description must be less than 500 characters';
        } else {
          delete newErrors.description;
        }
        break;

      case 'ethAmount':
        const ethValue = parseFloat(value);
        if (!value.trim()) {
          newErrors.ethAmount = 'ETH amount is required';
        } else if (isNaN(ethValue)) {
          newErrors.ethAmount = 'Please enter a valid number';
        } else if (ethValue < 0.0001) {
          newErrors.ethAmount = 'Minimum 0.0001 ETH required';
        } else if (ethValue > 1) {
          newErrors.ethAmount = 'Maximum 1 ETH allowed';
        } else {
          delete newErrors.ethAmount;
        }
        break;

      case 'image':
        // Image is optional, so no validation errors
        // Only validate if there's an actual file and it has issues
        delete newErrors.image;
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    if (field === 'ticker') {
      value = value.toUpperCase();
      // Trigger ticker validation after a short delay
      debouncedTickerValidation(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // Debounced ticker validation to avoid too many API calls
  const debouncedTickerValidation = useCallback(
    debounce(async (ticker: string) => {
      if (!ticker.trim() || ticker.length < 2) {
        setTickerValidation({
          isChecking: false,
          isAvailable: null,
          isValidFormat: null,
          message: ''
        });
        return;
      }

      setTickerValidation(prev => ({ ...prev, isChecking: true }));

      try {
        const response = await checkTickerAvailability(ticker);
        
        if (response.success && response.data) {
          setTickerValidation({
            isChecking: false,
            isAvailable: response.data.isAvailable,
            isValidFormat: response.data.isValidFormat,
            message: response.message
          });
        } else {
          setTickerValidation({
            isChecking: false,
            isAvailable: false,
            isValidFormat: false,
            message: response.message || 'Failed to validate ticker'
          });
        }
      } catch (error) {
        console.error('Ticker validation error:', error);
        setTickerValidation({
          isChecking: false,
          isAvailable: null,
          isValidFormat: null,
          message: 'Failed to validate ticker'
        });
      }
    }, 500),
    []
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - only allow specific image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Only JPG, JPEG, PNG, SVG, and WebP files are allowed' }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({ ...prev, image: undefined }));
    
    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await fetch('/api/upload_media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result: MediaUploadResponse = await response.json();
      
      if (result.success) {
        setUploadedImage(result);
        setFormData(prev => ({ ...prev, image: file }));
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors(prev => ({ ...prev, image: 'Failed to upload image. Please try again.' }));
      setImagePreview(null);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const isFormValid = () => {
    // Filter out image errors since image is optional
    const relevantErrors = Object.keys(errors).filter(key => key !== 'image');
    const hasNoRelevantErrors = relevantErrors.length === 0;
    const hasRequiredFields = formData.name.trim() && formData.ticker.trim() && formData.ethAmount.trim();
    
    // Debug logging to help identify validation issues
    console.log('Form validation check:', {
      hasNoRelevantErrors,
      hasRequiredFields,
      errors,
      relevantErrors,
      formData: {
        name: formData.name,
        ticker: formData.ticker,
        ethAmount: formData.ethAmount
      }
    });
    
    return hasNoRelevantErrors && hasRequiredFields;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);
    
    try {
      // Prepare API request data
      const requestData: CreateTokenRequest = {
        name: formData.name.trim(),
        ticker: formData.ticker.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        rewardPercent: formData.rewardPoolPercent,
        initialDepositEth: parseFloat(formData.ethAmount)
      };

      // Add image URL if uploaded
      if (uploadedImage && uploadedImage.url) {
        requestData.image = uploadedImage.url;
      }

      // Validate using API validation
      const validation = validateTokenCreation(requestData);
      if (!validation.isValid) {
        const newErrors: ValidationErrors = {};
        Object.entries(validation.errors).forEach(([key, value]) => {
          if (key === 'initialDepositEth') {
            newErrors.ethAmount = value;
          } else {
            newErrors[key as keyof ValidationErrors] = value;
          }
        });
        setErrors(newErrors);
        setIsSubmitting(false);
        toast.error('Please fix the validation errors');
        return;
      }

      // Make API call
      const response = await createCommunityToken(requestData);
      
      if (response.success && response.data) {
        // Include the uploaded image URL in the token data for the animation
        const tokenDataWithImage = {
          ...response.data,
          image: uploadedImage?.url || requestData.image || null
        };
        setCreatedTokenData(tokenDataWithImage);
        setShowSuccess(true);
        toast.success('Community token created successfully!');
        
        // Clear form
        setFormData({
          name: '',
          ticker: '',
          description: '',
          image: null,
          rewardPoolPercent: 10,
          ethAmount: '0.001'
        });
        setImagePreview(null);
        setCurrentStep(1);
      } else {
        throw new Error(response.error || response.message || 'Failed to create token');
      }
    } catch (error) {
      console.error('Error creating community token:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create community token');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    // Redirect to community tokens page
    window.location.href = '/community_tokens';
  };

  const benefits = [
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Own Your Community",
      description: "Be the founder and leader of your own digital tribe",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Earn 0.25% on Every Trade",
      description: "Passive income from all token transactions forever",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Reward Your Creators",
      description: "0.5% goes to reward pool for top community contributors",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "DAO Governance",
      description: "Democratic decision-making with your token holders",
      color: "from-purple-400 to-pink-500"
    }
  ];

  const steps = [
    { number: 1, title: "Community Details", description: "Name, ticker, and description" },
    { number: 2, title: "Visual Identity", description: "Upload your community image" },
    { number: 3, title: "Economics", description: "Set reward pool and initial investment" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-semibold mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Launch Your Community Token
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-4">
              Build Something
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}Bigger Than Yourself
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Create your own community token and become the leader of a thriving digital ecosystem. 
              Earn passive income while rewarding your most valuable contributors.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <AnimatePresence>
            {!showForm && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ delay: 0.4 }}
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="group"
                  >
                    <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                      <CardContent className="p-4">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r ${benefit.color} text-white mb-3`}>
                          {benefit.icon}
                        </div>
                        <h3 className="font-bold text-base mb-1">{benefit.title}</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Community Button */}
          <AnimatePresence>
            {!showForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <Button
                  onClick={() => setShowForm(true)}
                  className="h-14 px-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Rocket className="w-6 h-6 mr-3" />
                  Create Your Community Token
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
                <p className="text-sm text-slate-500 mt-3">
                  Join thousands of community leaders building the future
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Form Section */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-4"
          >
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  currentStep >= step.number
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-300 text-slate-400"
                )}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-4 transition-all duration-300",
                    currentStep > step.number ? "bg-blue-600" : "bg-slate-300"
                  )} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2">Community Details</h2>
                      <p className="text-slate-600 dark:text-slate-300">
                        Give your community a unique identity
                      </p>
                    </div>

                    {/* Community Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Community Name *
                      </label>
                      <Input
                        placeholder="e.g., Crypto Builders, NFT Artists, DeFi Traders"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={cn(
                          "h-12 text-lg",
                          errors.name ? "border-red-500 focus:ring-red-500" : ""
                        )}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.name}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {formData.name.length}/50 characters
                      </p>
                    </div>

                    {/* Ticker */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Token Ticker *
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="e.g., BUILD, ART, DEFI"
                          value={formData.ticker}
                          onChange={(e) => handleInputChange('ticker', e.target.value)}
                          className={cn(
                            "h-12 text-lg font-mono pr-10",
                            errors.ticker ? "border-red-500 focus:ring-red-500" : "",
                            tickerValidation.isAvailable === true ? "border-green-500 focus:ring-green-500" : "",
                            tickerValidation.isAvailable === false ? "border-red-500 focus:ring-red-500" : ""
                          )}
                          maxLength={15}
                        />
                        {/* Ticker validation indicator */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {tickerValidation.isChecking && (
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          )}
                          {!tickerValidation.isChecking && tickerValidation.isAvailable === true && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {!tickerValidation.isChecking && tickerValidation.isAvailable === false && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      {/* Ticker validation messages */}
                      {errors.ticker && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.ticker}
                        </p>
                      )}
                      {!errors.ticker && tickerValidation.message && (
                        <p className={cn(
                          "text-sm flex items-center gap-1",
                          tickerValidation.isAvailable === true ? "text-green-600" : "text-red-500"
                        )}>
                          {tickerValidation.isAvailable === true ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          {tickerValidation.message}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        A-Z and 0-9 only, {formData.ticker.length}/15 characters
                      </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Community Description (Optional)
                      </label>
                      <Textarea
                        placeholder="Describe your community's mission, values, and what makes it special. What will members gain by joining?"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className={cn(
                          "min-h-[120px] text-base",
                          errors.description ? "border-red-500 focus:ring-red-500" : ""
                        )}
                        maxLength={500}
                      />
                      {errors.description && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {formData.description.length}/500 characters
                      </p>
                    </div>

                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!formData.name.trim() || !formData.ticker.trim() || errors.name || errors.ticker || errors.description}
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Continue to Visual Identity
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2">Visual Identity</h2>
                      <p className="text-slate-600 dark:text-slate-300">
                        Upload an image that represents your community
                      </p>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Community Image (Optional)
                      </label>
                      
                      <div className="flex flex-col items-center">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Community preview"
                              className={cn(
                                "w-32 h-32 rounded-full object-cover border-4 transition-all",
                                uploadedImage ? "border-green-200" : "border-blue-200"
                              )}
                            />
                            
                            {/* Upload success indicator */}
                            {uploadedImage && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                            
                            {/* Upload loading indicator */}
                            {isUploadingImage && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            
                            <button
                              onClick={() => {
                                setImagePreview(null);
                                setFormData(prev => ({ ...prev, image: null }));
                                setUploadedImage(null);
                              }}
                              className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-full flex flex-col items-center justify-center hover:border-blue-500 transition-colors">
                              <Upload className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-sm text-slate-500">Upload Image</span>
                            </div>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.svg,.webp,image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {errors.image && (
                        <p className="text-red-500 text-sm flex items-center justify-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.image}
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-500 text-center">
                        Supported: JPG, JPEG, PNG, SVG, WebP • Square image recommended • Max 5MB
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 h-12"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Continue to Economics
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2">Token Economics</h2>
                      <p className="text-slate-600 dark:text-slate-300">
                        Configure your community's economic model
                      </p>
                    </div>

                    {/* Reward Pool Percentage */}
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Reward Pool Allocation: {formData.rewardPoolPercent}%
                      </label>
                      
                      <div className="px-4">
                        <Slider
                          value={[formData.rewardPoolPercent]}
                          onValueChange={(value) => handleInputChange('rewardPoolPercent', value[0])}
                          max={50}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                          <span>0%</span>
                          <span>50%</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              What is Reward Pool?
                            </p>
                            <div className="text-blue-800 dark:text-blue-200 space-y-1">
                              <p>• Reward pool is the community DAO wallet where your community can decide on how to use these funds via a vote</p>
                              <p>• Apart from the {formData.rewardPoolPercent}% token allocation you decide above, 0.5% of all trading fees would go to community reward pool</p>
                              <p>• You earn 0.25% on every token trade as the founder</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Initial ETH Investment */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Initial Investment (ETH) *
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.01"
                          value={formData.ethAmount}
                          onChange={(e) => handleInputChange('ethAmount', e.target.value)}
                          className={cn(
                            "h-12 text-lg pl-12",
                            errors.ethAmount ? "border-red-500 focus:ring-red-500" : ""
                          )}
                          min="0.0001"
                          max="1"
                          step="0.0001"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          Ξ
                        </div>
                      </div>
                      {errors.ethAmount && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.ethAmount}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Minimum: 0.0001 ETH • Maximum: 1 ETH
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-lg border">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        Launch Summary
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-300">Community: <span className="font-semibold">{formData.name || 'Your Community'}</span></p>
                          <p className="text-slate-600 dark:text-slate-300">Token: <span className="font-semibold">{formData.ticker || 'TICKER'} (ERC20)</span></p>
                          <p className="text-slate-600 dark:text-slate-300">Total Supply: <span className="font-semibold">1,000,000,000 tokens</span></p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-300">Your Investment: <span className="font-semibold">{formData.ethAmount || '0'} ETH</span></p>
                          <p className="text-slate-600 dark:text-slate-300">Reward Pool: <span className="font-semibold">{formData.rewardPoolPercent}% ({(formData.rewardPoolPercent * 10000000).toLocaleString()} tokens)</span></p>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                              Incubation Period (First 30 Minutes)
                            </p>
                            <p className="text-amber-800 dark:text-amber-200">
                              Your token will be available for purchase at a flat rate during the first 30 minutes or until 1 ETH is collected, whichever comes first. After incubation ends, your token will graduate to Uniswap V4 for open market trading.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1 h-12"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid() || isSubmitting}
                        className="flex-1 h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating Token...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Rocket className="w-5 h-5" />
                            Launch Community Token
                          </div>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <CommunityCreationSuccess
        isVisible={showSuccess}
        onComplete={handleSuccessComplete}
        communityName={createdTokenData?.name || formData.name || 'Your Community'}
        ticker={createdTokenData?.ticker || formData.ticker || 'TOKEN'}
        ethAmount={formData.ethAmount || '0.001'}
        rewardPercent={formData.rewardPoolPercent}
        tokenData={createdTokenData}
      />
    </div>
  );
};

export default CreateCommunityTokenPage;
