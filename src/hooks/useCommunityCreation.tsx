import { useState, useCallback } from 'react';
import { 
  CreateCommunityConfig, 
  createCommunity, 
  createCommunityConfig, 
  validateCommunityConfig 
} from '../utils/communityApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getUserApiKey } from '../utils/apiBase';

export type CommunityTypeOption = 'general' | 'niche' | 'advanced';

interface CommunityState {
  name: string;
  handle: string;
  description: string;
  isEncrypted: boolean;
  communityType: CommunityTypeOption;
  advancedConfig: {
    k: number;
    alpha: number;
    basePrice: number;
    rewardPercentage: number;
    adminEarningPercentage: number;
  };
  advancedConfigError?: string;
}

interface CommunityCreationErrors {
  name?: string;
  handle?: string;
  description?: string;
  totalPercentage?: string;
  'advancedConfig.k'?: string;
  'advancedConfig.alpha'?: string;
  'advancedConfig.basePrice'?: string;
  'advancedConfig.rewardPercentage'?: string;
  'advancedConfig.adminEarningPercentage'?: string;
  advancedConfigError?: string;
}

interface GasEstimate {
  gasCostInEth: string;
  gasCostInWei: string;
  gasCostInUsd: string;
}

interface CommunityTypeResponse {
  success: boolean;
  message?: string;
  gasEstimate?: GasEstimate;
  communityType?: {
    id: number;
    type: number;
    basePrice: string;
    alpha: string;
    k: number;
    adminFees: string;
    rewardFees: string;
    platformFees: string;
  };
}

interface CommunityValidateResponse {
  status: string;
  name: string;
  type: number;
  message?: string;
  gas?: {
    estimatedGasFee: string;
    createCost: number;
    totalCost: number;
  };
  community_setup?: {
    alpha: number;
    base: number;
    k: number;
    admin_fees: number;
    reward_fees: number;
    platform_fees: number;
  };
  error?: string;
}

interface CommunityConfirmResponse {
  status: string;
  community?: {
    name: string;
    type: number;
    encrypted: number;
    transaction: string;
  };
  error?: string;
}

interface TransactionData {
  estimatedGasFee: string;
  totalCost: number;
  createCost: number;
}

interface AdvancedTypeGasEstimate {
  estimatedGasFee?: string;
  totalCost?: number;
  success: boolean;
  error?: string;
}

const initialState: CommunityState = {
  name: '',
  handle: '',
  description: '',
  isEncrypted: false,
  communityType: 'general',
  advancedConfig: {
    k: 1,
    alpha: 0.1,
    basePrice: 0.01,
    rewardPercentage: 2.5,
    adminEarningPercentage: 2.5,
  }
};

export const useCommunityCreation = () => {
  const [state, setState] = useState<CommunityState>(initialState);
  const [errors, setErrors] = useState<CommunityCreationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'transaction' | 'advanced' | 'complete'>('form');
  const [transactionStep, setTransactionStep] = useState<'initialize' | 'confirm' | 'complete'>('initialize');
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [advancedTypeId, setAdvancedTypeId] = useState<string | null>(null);
  const [advancedTypeGasEstimate, setAdvancedTypeGasEstimate] = useState<AdvancedTypeGasEstimate | null>(null);
  const navigate = useNavigate();

  const updateField = (field: keyof CommunityState, value: any) => {
    setState(prev => {
      // If changing communityType, clear any advanced config errors
      const updates: Partial<CommunityState> = { [field]: value };
      if (field === 'communityType') {
        updates.advancedConfigError = undefined;
      }
      
      return { ...prev, ...updates };
    });
    
    // Clear any errors for this field
    if (errors[field as keyof CommunityCreationErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof CommunityCreationErrors];
        return newErrors;
      });
    }
  };

  const updateAdvancedConfig = (field: keyof CommunityState['advancedConfig'], value: any) => {
    setState(prev => ({
      ...prev,
      advancedConfig: {
        ...prev.advancedConfig,
        [field]: value,
      },
      // Clear any advanced config error when the user makes changes
      advancedConfigError: undefined
    }));
    
    // Clear any errors for this field
    const errorKey = `advancedConfig.${field}` as keyof CommunityCreationErrors;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const calculateSharePrice = (shareCount: number): number | null => {
    if (state.advancedConfig.basePrice === undefined || state.advancedConfig.alpha === undefined || state.advancedConfig.k === undefined) {
      return null;
    }
    
    const { basePrice, alpha, k } = state.advancedConfig;
    // Updated formula: basePrice + alpha * (shareCount-1)^k
    return basePrice + alpha * Math.pow(Math.max(shareCount - 1, 0), k);
  };

  const validateForm = (): boolean => {
    const newErrors: CommunityCreationErrors = {};
    
    // Validate name
    if (!state.name.trim()) {
      newErrors.name = 'Community name is required';
    }
    
    // Validate handle
    if (!state.handle.trim()) {
      newErrors.handle = 'Community handle is required';
    } else if (!/^[a-z0-9-]+$/.test(state.handle)) {
      newErrors.handle = 'Handle can only contain lowercase letters, numbers, and hyphens';
    }
    
    // Description is optional, so no validation needed
    
    // Validate description - make it required
    if (!state.description.trim()) {
      newErrors.description = 'Community description is required';
    }
    
    // Validate advanced config if applicable
    if (state.communityType === 'advanced') {
      if (state.advancedConfig.k < 1 || state.advancedConfig.k > 3) {
        newErrors['advancedConfig.k'] = 'k must be between 1 and 3';
      }
      
      if (state.advancedConfig.alpha <= 0) {
        newErrors['advancedConfig.alpha'] = 'Alpha must be greater than 0';
      }
      
      if (state.advancedConfig.basePrice < 0) {
        newErrors['advancedConfig.basePrice'] = 'Base price cannot be negative';
      }
      
      if (state.advancedConfig.rewardPercentage < 0 || state.advancedConfig.rewardPercentage > 5) {
        newErrors['advancedConfig.rewardPercentage'] = 'Reward percentage must be between 0 and 5';
      }
      
      if (state.advancedConfig.adminEarningPercentage < 0 || state.advancedConfig.adminEarningPercentage > 5) {
        newErrors['advancedConfig.adminEarningPercentage'] = 'Admin earning percentage must be between 0 and 5';
      }
      
      const totalPercentage = state.advancedConfig.rewardPercentage + state.advancedConfig.adminEarningPercentage;
      if (totalPercentage > 5) {
        newErrors.totalPercentage = 'Total percentage cannot exceed 5%';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getAdvancedTypeGasEstimate = async (): Promise<AdvancedTypeGasEstimate> => {
    try {
      const { k, alpha, basePrice, rewardPercentage, adminEarningPercentage } = state.advancedConfig;
      
      // Convert percentages to basis points (e.g., 1.5% = 150 bps)
      const adminFeeBps = Math.round(adminEarningPercentage * 100);
      const memberRewardsBps = Math.round(rewardPercentage * 100);
      
      // Get user API key from localStorage
      const userKey = getUserApiKey();
      if (!userKey) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      console.log('Requesting gas estimate with params:', {
        basePrice: basePrice.toString(),
        alpha: alpha.toString(),
        k: k.toString(),
        adminFeeBps: adminFeeBps.toString(),
        memberRewardsBps: memberRewardsBps.toString(),
      });
      
      // Use the correct endpoint
      const response = await fetch('https://api.dapps.co/community_type_gas_estimator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-key': userKey
        },
        body: JSON.stringify({
          basePrice: basePrice.toString(),
          alpha: alpha.toString(),
          k: k.toString(),
          adminFeeBps: adminFeeBps.toString(),
          memberRewardsBps: memberRewardsBps.toString(),
        }),
      });
      
      // If the API endpoint is not found (404) or any other error, use fallback values
      if (!response.ok) {
        console.warn(`API returned ${response.status}: ${response.statusText}`);
        
        // If it's a 404, the endpoint might not be implemented yet, use fallback values
        if (response.status === 404) {
          console.info('Using fallback gas estimate values');
          return {
            success: true,
            estimatedGasFee: "0.001", // Fallback value
            totalCost: 0.002          // Fallback value
          };
        }
        
        // For other errors, try to parse the response to get the error message
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Failed to get gas estimate: ${response.statusText}`);
        } catch (e) {
          // If we can't parse the response, use the status text
          throw new Error(`Failed to get gas estimate: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('Gas estimate response:', data);
      
      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to get gas estimate');
      }
      
      // Parse the response according to the sample API format
      return {
        success: true,
        estimatedGasFee: data.gasEstimate?.gasCostInEth || "0.001", 
        totalCost: parseFloat(data.gasEstimate?.gasCostInEth || "0.002")
      };
    } catch (error) {
      console.error('Error getting gas estimate:', error);
      
      // For specific known errors, we can use fallback values
      if (error instanceof Error && error.message.includes('404')) {
        return {
          success: true,
          estimatedGasFee: "0.001", // Fallback value
          totalCost: 0.002          // Fallback value
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const prepareAdvancedTypeCreation = async (): Promise<AdvancedTypeGasEstimate> => {
    // Validate form before proceeding
    if (!validateForm()) {
      return {
        success: false,
        error: 'Please fix the form errors before continuing'
      };
    }
    
    // First, get a gas estimate
    try {
      // Get the gas estimate for the advanced type
      const gasEstimate = await getAdvancedTypeGasEstimate();
      if (!gasEstimate.success) {
        return gasEstimate; // Return the error from gas estimation
      }
      
      console.log('Got gas estimate for advanced type:', gasEstimate);
      return gasEstimate;
      
    } catch (error) {
      console.error('Error preparing advanced type creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare advanced type creation'
      };
    }
  };

  const initializeCommunityType = async (): Promise<boolean> => {
    try {
      const { k, alpha, basePrice, rewardPercentage, adminEarningPercentage } = state.advancedConfig;
      
      // Convert percentages to basis points (e.g., 1.5% = 150 bps)
      const adminFeeBps = Math.round(adminEarningPercentage * 100);
      const memberRewardsBps = Math.round(rewardPercentage * 100);
      
      // Get user API key from localStorage
      const userKey = getUserApiKey();
      if (!userKey) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      console.log('Initializing community type with params:', {
        basePrice: basePrice.toString(),
        alpha: alpha.toString(),
        k: k.toString(),
        adminFeeBps: adminFeeBps.toString(),
        memberRewardsBps: memberRewardsBps.toString(),
      });
      
      // Call the initialize_community_type API
      const response = await fetch('https://api.dapps.co/initialize_community_type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-key': userKey
        },
        body: JSON.stringify({
          basePrice: basePrice.toString(),
          alpha: alpha.toString(),
          k: k.toString(),
          adminFeeBps: adminFeeBps.toString(),
          memberRewardsBps: memberRewardsBps.toString(),
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error (${response.status}): ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the error text
          if (errorText) errorMessage = errorText;
        }
        
        console.error('Error initializing community type:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Initialize community type response:', data);
      
      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to initialize community type');
      }
      
      // Save the advanced community type ID for later use
      const advancedTypeId = data.communityType?.id?.toString();
      if (advancedTypeId) {
        setAdvancedTypeId(advancedTypeId);
        console.log('Set advanced community type ID:', advancedTypeId);
      } else {
        console.error('Missing community type ID in response:', data);
        throw new Error('Failed to get community type ID from response');
      }
      
      return true;
    } catch (error) {
      console.error('Error during community type initialization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initialize community type');
      return false;
    }
  };

  const validateCommunityCreation = async () => {
    if (!validateForm()) {
      return false;
    }
    
    setIsLoading(true);
    setTransactionStep('initialize');
    
    try {
      // For advanced type, use the ID returned from initialize_community_type
      // Otherwise use general (0) or niche (1)
      const typeValue = state.communityType === 'general' 
        ? '0' 
        : state.communityType === 'niche' 
          ? '1' 
          : advancedTypeId || '2'; // Fallback to '2' if for some reason we don't have the ID
      
      // Get user API key from localStorage
      const userKey = getUserApiKey();
      if (!userKey) {
        setErrors({ name: 'Authentication required. Please log in again.' });
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Fix the payload to use correct field names and values
      const requestPayload = {
        communityName: state.name, // Use the community NAME not handle
        name: state.handle, // Keep name for backward compatibility
        description: state.description || '', // Ensure description is at least an empty string
        type: typeValue,
        encrypt: state.isEncrypted ? '1' : '0',
      };
      
      console.log('Validation request payload:', requestPayload);
      
      const response = await fetch('https://api.dapps.co/create_community_validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-key': userKey
        },
        body: JSON.stringify(requestPayload),
      });
      
      console.log('Validation response status:', response.status);
      const responseText = await response.text();
      console.log('Validation response text:', responseText);
      
      let data: CommunityValidateResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
        setErrors({ name: 'Invalid response format from server' });
        throw new Error('Invalid response format from server');
      }
      
      console.log('Parsed validation response:', data);
      
      if (data.status !== 'SUCCESS') {
        // Set specific error from the API or fallback to a general error
        const errorMessage = data.message || data.error || 'Failed to validate community creation';
        
        // If it's a name conflict, set the error specifically on the name field
        if (errorMessage.toLowerCase().includes('name already exists')) {
          setErrors({ name: errorMessage });
          setStep('form'); // Make sure we're back on the form
        } else if (errorMessage.toLowerCase().includes('name must be between')) {
          // If it's a name length error, set it on the name field
          setErrors({ name: errorMessage });
          setStep('form');
        } else {
          // Otherwise set it as a general error
          setErrors({ name: errorMessage });
        }
        
        throw new Error(errorMessage);
      }
      
      if (data.gas) {
        setTransactionData({
          estimatedGasFee: data.gas.estimatedGasFee,
          createCost: data.gas.createCost,
          totalCost: data.gas.totalCost,
        });
      }
      
      // Clear any existing errors
      setErrors({});
      return true;
    } catch (error) {
      console.error('Error validating community creation:', error);
      
      // Only show a toast if we haven't already set specific field errors
      if (Object.keys(errors).length === 0) {
        toast.error(error instanceof Error ? error.message : 'Failed to validate community creation');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCommunityCreation = async () => {
    if (!validateForm()) {
      return false;
    }
    
    setIsLoading(true);
    setTransactionStep('confirm');
    
    try {
      // For advanced type, use the ID returned from initialize_community_type
      // Otherwise use general (0) or niche (1)
      const typeValue = state.communityType === 'general' 
        ? '0' 
        : state.communityType === 'niche' 
          ? '1' 
          : advancedTypeId || '2'; // Fallback to '2' if missing
      
      // Get user API key
      const userKey = getUserApiKey();
      if (!userKey) {
        setErrors({ name: 'Authentication required. Please log in again.' });
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Fix the payload structure to match what the API expects
      const requestPayload = {
        communityName: state.name, // Use the community NAME not handle
        name: state.handle, // Keep name for backward compatibility
        description: state.description || '', // Ensure description is at least an empty string
        type: typeValue,
        encrypt: state.isEncrypted ? '1' : '0',
      };
      
      console.log('Confirmation request payload:', requestPayload);
      
      const response = await fetch('https://api.dapps.co/create_community_confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-key': userKey
        },
        body: JSON.stringify(requestPayload),
      });
      
      console.log('Confirmation response status:', response.status);
      const responseText = await response.text();
      console.log('Confirmation response text:', responseText);
      
      let data: CommunityConfirmResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
        throw new Error('Invalid response format from server');
      }
      
      console.log('Parsed confirmation response:', data);
      
      if (data.status !== 'DONE') {
        throw new Error(data.error || 'Failed to confirm community creation');
      }
      
      if (data.community?.transaction) {
        setTxHash(data.community.transaction);
      }
      
      setTransactionStep('complete');
      setStep('complete');
      
      return true;
    } catch (error) {
      console.error('Error confirming community creation:', error);
      toast.error('Failed to create community. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAdvancedConfig = useCallback(async () => {
    if (state.communityType === 'advanced') {
      const success = await initializeCommunityType();
      if (success) {
        setStep('advanced');
      }
    }
  }, [state.communityType, state.advancedConfig]);

  const handleCreateCommunity = async (): Promise<void> => {
    console.log('handleCreateCommunity called, current step:', step);
    console.log('communityType:', state.communityType);
    console.log('advancedTypeId:', advancedTypeId);
    
    // For advanced community type, we need to check if the advanced type has been created
    if (state.communityType === 'advanced') {
      // If we're already in the advanced step, it means the advanced type was created
      if (step === 'advanced') {
        // Continue with community creation
        console.log('Advanced config completed, proceeding with community creation');
        const isValid = await validateCommunityCreation();
        if (isValid) {
          setStep('transaction');
        }
        return;
      }
      
      // Check if we have an advanced type ID (meaning it was created)
      if (advancedTypeId) {
        console.log('Advanced type ID exists:', advancedTypeId);
        // Continue with community creation
        const isValid = await validateCommunityCreation();
        if (isValid) {
          setStep('transaction');
        }
        return;
      }
      
      // If we get here, advanced type hasn't been created yet
      console.log('Advanced type not configured yet');
      // Show message and trigger the advanced config transaction
      setErrors({ 
        advancedConfigError: 'Please complete advanced configurations first by clicking the "Configure Advanced Settings" button' 
      });
      toast.error('Please complete advanced configurations first');
      return;
    }
    
    // For non-advanced community types, just validate and proceed
    console.log('Regular community type, proceeding with validation');
    const isValid = await validateCommunityCreation();
    if (isValid) {
      setStep('transaction');
    }
  };

  const resetForm = () => {
    setState(initialState);
    setErrors({});
    setStep('form');
    setTransactionStep('initialize');
    setTransactionData(null);
    setTxHash(null);
  };

  // Add a new function to handle the actual creation of the advanced type
  const confirmAdvancedTypeCreation = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Start the transaction steps
      setTransactionStep('initialize');
      
      // Now initialize the community type
      const success = await initializeCommunityType();
      if (!success) {
        throw new Error('Failed to initialize community type');
      }
      
      // If successful, set the state to show the advanced config completed screen
      setStep('advanced');
      setTransactionStep('complete');
      
      return true;
    } catch (error) {
      console.error('Error during advanced type creation:', error);
      setErrors({ 
        advancedConfigError: error instanceof Error ? error.message : 'Failed to create advanced type'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state,
    errors,
    isLoading,
    step,
    transactionStep,
    transactionData,
    txHash,
    advancedTypeId,
    advancedTypeGasEstimate,
    updateField,
    updateAdvancedConfig,
    validateForm,
    handleSubmitAdvancedConfig,
    handleCreateCommunity,
    resetForm,
    calculateSharePrice,
    validateCommunityCreation,
    confirmCommunityCreation,
    prepareAdvancedTypeCreation,
    confirmAdvancedTypeCreation,
  };
}; 