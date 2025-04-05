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
      
      const response = await fetch('https://api.dapps.co/estimate_community_type_gas', {
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
      
      return {
        success: true,
        estimatedGasFee: data.estimatedGasFee || "0.001", // Fallback values if API doesn't provide them
        totalCost: data.totalCost || 0.002
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
    if (!validateForm()) {
      return { success: false, error: 'Validation failed' };
    }
    
    try {
      const gasEstimate = await getAdvancedTypeGasEstimate();
      setAdvancedTypeGasEstimate(gasEstimate);
      return gasEstimate;
    } catch (error) {
      console.error('Error preparing advanced type creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const initializeCommunityType = async () => {
    if (!validateForm()) {
      return false;
    }
    
    setIsLoading(true);
    
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
      
      const data: CommunityTypeResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize community type');
      }
      
      // Store the community type ID for later use
      if (data.communityType && data.communityType.id) {
        // Convert to string as we use string values in our API calls
        setAdvancedTypeId(data.communityType.id.toString());
        console.log(`Advanced community type ID set to: ${data.communityType.id}`);
      }
      
      setStep('advanced');
      return true;
    } catch (error) {
      console.error('Error initializing community type:', error);
      toast.error('Failed to initialize community type. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
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
      
      const requestPayload = {
        name: state.handle,
        description: state.description,
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
        
        // If it's a name/handle conflict, set the error specifically on the handle field
        if (errorMessage.toLowerCase().includes('name already exists')) {
          setErrors({ handle: errorMessage });
          setStep('form'); // Make sure we're back on the form
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
          : advancedTypeId || '2'; // Fallback to '2' if for some reason we don't have the ID
      
      // Get user API key from localStorage
      const userKey = getUserApiKey();
      if (!userKey) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const requestPayload = {
        name: state.handle,
        description: state.description,
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

  const handleCreateCommunity = useCallback(async () => {
    if (state.communityType === 'advanced' && step !== 'advanced') {
      toast.error('Please complete the advanced configuration first.');
      return;
    }
    
    setStep('transaction');
    const validationSuccess = await validateCommunityCreation();
    
    // Don't automatically call confirmCommunityCreation
    // Let the user confirm the transaction in the modal
  }, [state, step]);

  const resetForm = () => {
    setState(initialState);
    setErrors({});
    setStep('form');
    setTransactionStep('initialize');
    setTransactionData(null);
    setTxHash(null);
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
  };
}; 