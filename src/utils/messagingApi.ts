import { toast } from 'sonner';
import { createAuthHeaders, debugLog } from './apiBase';

// Conversation interfaces
export interface ConversationUser {
  id: number;
  handle: string;
  username: string;
  avatar: string;
}

export interface Conversation {
  id: number;
  conversation_id: string;
  other_user: ConversationUser;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  message?: string;
}

// DM Pricing interfaces
export interface DMPricingConfig {
  id: number;
  uid: number;
  followers_price: number;
  following_price: number;
  others_price: number;
  created_at: string;
  updated_at: string;
}

export interface DMPricingDefaults {
  followers_price: number;
  following_price: number;
  others_price: number;
}

export interface DMPricingResponse {
  success: boolean;
  config: DMPricingConfig;
  defaults: DMPricingDefaults;
  message?: string;
}

export interface UpdateDMPricingRequest {
  followers_price: number;
  following_price: number;
  others_price: number;
}

export interface UpdateDMPricingResponse {
  success: boolean;
  message: string;
  config: DMPricingConfig;
}

/**
 * Fetch user's conversations
 */
export const fetchConversations = async (): Promise<ConversationsResponse> => {
  try {
    debugLog('Fetching conversations');
    
    const response = await fetch('/api/xmtp/conversations', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Conversations fetched successfully', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    toast.error('Failed to load conversations');
    return {
      success: false,
      conversations: [],
      message: 'Failed to load conversations'
    };
  }
};

/**
 * Fetch DM pricing configuration
 */
export const fetchDMPricingConfig = async (): Promise<DMPricingResponse | null> => {
  try {
    debugLog('Fetching DM pricing config');
    
    const response = await fetch('/api/dm-pricing/config', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('DM pricing config fetched successfully', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching DM pricing config:', error);
    toast.error('Failed to load messaging settings');
    return null;
  }
};

/**
 * Update DM pricing configuration
 */
export const updateDMPricingConfig = async (config: UpdateDMPricingRequest): Promise<UpdateDMPricingResponse | null> => {
  try {
    debugLog('Updating DM pricing config', config);
    
    const response = await fetch('/api/dm-pricing/config', {
      method: 'PUT',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('DM pricing config updated successfully', data);
    
    toast.success('Messaging settings updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating DM pricing config:', error);
    toast.error('Failed to update messaging settings');
    return null;
  }
};

/**
 * Check if a user is blocked
 */
export const checkUserBlockStatus = async (targetHandle: string): Promise<{
  success: boolean;
  isBlocked: boolean;
  error?: string;
}> => {
  try {
    debugLog('Checking block status for user', targetHandle);
    
    const response = await fetch('/api/blocked_users_list', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch blocked users');
    }

    const isBlocked = data.blocked_users.some((user: any) => user.handle === targetHandle);
    
    debugLog('Block status check result', { targetHandle, isBlocked });
    
    return {
      success: true,
      isBlocked
    };
  } catch (error) {
    console.error('Error checking block status:', error);
    return {
      success: false,
      isBlocked: false,
      error: error instanceof Error ? error.message : 'Failed to check block status'
    };
  }
};

/**
 * Start a new conversation with a user
 */
export interface StartConversationResponse {
  success: boolean;
  conversation?: {
    id: number;
    conversation_id: string;
    other_user: {
      id: number;
      handle: string;
      avatar: string;
    };
  };
  isNew?: boolean;
  message?: string;
  error?: string;
}

export const startConversation = async (handle: string): Promise<StartConversationResponse> => {
  try {
    debugLog('Starting conversation with user', handle);
    
    const response = await fetch('/api/xmtp/conversations', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify({ handle }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific error cases
      if (response.status === 403) {
        const errorMessage = errorData.message || 'You cannot initiate a conversation with this user';
        if (errorMessage.toLowerCase().includes('block')) {
          throw new Error('This user has blocked you or you have blocked them. You cannot start a conversation.');
        } else {
          throw new Error('You cannot initiate a conversation with this user. They may have restricted messaging.');
        }
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    debugLog('Conversation started successfully', data);
    
    // Ensure the response matches our expected structure
    if (data.success && data.conversation) {
      return {
        success: true,
        conversation: data.conversation,
        isNew: data.isNew || false,
        message: data.message
      };
    } else {
      return {
        success: false,
        error: data.error || data.message || 'Failed to start conversation'
      };
    }
  } catch (error) {
    console.error('Error starting conversation:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to start conversation');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start conversation'
    };
  }
};

// Updated Message interfaces to match new API format
export interface MessageSender {
  id: number;
  handle: string;
  avatar: string;
}

export interface ConversationParticipants {
  currentUser: ConversationUser;
  otherUser: ConversationUser;
}

export interface ReplyToMessage {
  id: number;
  content: string;
  sender_id: number;
  sender_handle: string;
}

export interface Message {
  id: number;
  conversation_id: string;
  sender_id: number;
  sender_handle: string;
  sender_avatar: string;
  message_content: string;
  xmtp_message_id: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
  reply_to?: ReplyToMessage | null;
  // For optimistic UI updates
  isOptimistic?: boolean;
  // For compatibility with existing components
  content?: string;
  sender?: MessageSender;
  // Stable key for React rendering
  optimisticKey?: string;
}

export interface MessagesPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessagesResponse {
  success: boolean;
  conversation_id: string;
  participants: ConversationParticipants;
  messages: Message[];
  pagination: MessagesPagination;
  message?: string;
}

export interface SendMessageRequest {
  message_content: string;
  message_type?: string;
  reply_to_message_id?: number;
}

export interface SendMessageResponse {
  success: boolean;
  message?: {
    id: number;
    conversation_id: number;
    sender_id: number;
    message_content: string;
    message_type: string;
    created_at: string;
    reply_to?: number;
  };
  error?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  unread_count: number;
}

/**
 * Fetch messages for a conversation
 */
export const fetchMessages = async (conversationId: string, page: number = 1): Promise<{
  success: boolean;
  messages: Message[];
  participants: ConversationParticipants;
  pagination: {
    page: number;
    totalPages: number;
    totalMessages: number;
  };
  error?: string;
}> => {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`/api/xmtp/conversations/${conversationId}/messages?page=${page}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status >= 500 && attempt < maxRetries) {
          // Server error, retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch messages');
      }

      // Transform API response to match our interface
      const transformedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id?.toString() || conversationId,
        sender_id: msg.sender_id,
        sender_handle: msg.sender_handle,
        sender_avatar: msg.sender_avatar,
        message_content: msg.message_content,
        xmtp_message_id: msg.xmtp_message_id,
        message_type: msg.message_type || 'text',
        is_read: msg.is_read || false,
        created_at: msg.created_at,
        reply_to: msg.reply_to ? {
          id: msg.reply_to.id,
          content: msg.reply_to.content,
          sender_id: msg.reply_to.sender_id,
          sender_handle: msg.reply_to.sender_handle
        } : null,
        // Compatibility fields for existing components
        content: msg.message_content,
        sender: {
          id: msg.sender_id,
          handle: msg.sender_handle,
          avatar: msg.sender_avatar
        }
      }));

      return {
        success: true,
        messages: transformedMessages,
        participants: data.participants,
        pagination: data.pagination
      };

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    messages: [],
    participants: {
      currentUser: { id: 0, handle: '', username: '', avatar: '' },
      otherUser: { id: 0, handle: '', username: '', avatar: '' }
    },
    pagination: { page: 1, totalPages: 1, totalMessages: 0 },
    error: lastError?.message || 'Failed to fetch messages after multiple attempts'
  };
};

/**
 * Send a message in a conversation with optional reply
 */
export const sendMessage = async (conversationId: string, content: string, replyToMessageId?: number): Promise<{
  success: boolean;
  message?: any;
  error?: string;
}> => {
  const maxRetries = 2; // Fewer retries for sending to avoid duplicate messages
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`/api/xmtp/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message_content: content,
          message_type: 'text',
          reply_to_message_id: replyToMessageId
        }),
      });

      if (!response.ok) {
        if (response.status >= 500 && attempt < maxRetries) {
          // Server error, retry with shorter backoff for sending
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        // Handle specific error cases
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || 'You cannot send messages to this user';
          if (errorMessage.toLowerCase().includes('block')) {
            throw new Error('This user has blocked you and you cannot send messages to them.');
          } else {
            throw new Error('You cannot send messages to this user. They may have restricted messaging or blocked you.');
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      return {
        success: true,
        message: data.message
      };

    } catch (error) {
      lastError = error as Error;
      console.error(`Send attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to send message after multiple attempts'
  };
};

/**
 * Mark a specific message as read
 */
export const markMessageAsRead = async (messageId: number): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const response = await fetch(`/api/xmtp/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to mark message as read');
    }

    return { success: true };

  } catch (error) {
    console.error('Error marking message as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark message as read'
    };
  }
};

/**
 * Mark all messages in a conversation as read
 */
export const markAllMessagesAsRead = async (conversationId: string): Promise<{ success: boolean; message?: string; updated_count?: number }> => {
  try {
    debugLog('Marking all messages as read for conversation', conversationId);
    
    const response = await fetch(`/api/xmtp/conversations/${conversationId}/mark-all-read`, {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('All messages marked as read successfully', data);
    
    return data;
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return {
      success: false,
      message: 'Failed to mark messages as read'
    };
  }
};

/**
 * Fetch total unread messages count
 */
export const fetchUnreadCount = async (): Promise<UnreadCountResponse> => {
  try {
    debugLog('Fetching unread count');
    
    const response = await fetch('/api/xmtp/unread-count', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Unread count fetched successfully', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return {
      success: false,
      unread_count: 0
    };
  }
};

/**
 * Fetch WebSocket authentication token for fallback authentication
 */
// WebSocket token function removed - SSE uses cookie authentication instead

// Paid conversation interfaces and functions
export interface DMPriceInfo {
  price: number;
  priceCategory: string;
  isFree: boolean;
  senderFollowsRecipient: boolean;
  recipientFollowsSender: boolean;
}

export interface DMPriceCalculationResponse {
  success: boolean;
  price_info?: DMPriceInfo;
  recipient?: {
    id: number;
    handle: string;
  };
  error?: string;
}

export interface DMPaymentEstimate {
  amount: number;
  estimated_gas: string;
  gas_price: string;
  estimated_fee: number;
  total_cost: number;
  recipient_gets: number;
  platform_fee: number;
}

export interface DMPaymentEstimateResponse {
  success: boolean;
  estimate?: DMPaymentEstimate;
  recipient?: {
    id: number;
    handle: string;
  };
  error?: string;
}

export interface DMPayment {
  id: number;
  sender_uid: number;
  recipient_uid: number;
  amount: number;
  payment_status: string;
  txn_hash: string;
  payment_deadline: string;
  created_at: string;
}

export interface DMPaymentInitiateResponse {
  success: boolean;
  message?: string;
  payment?: DMPayment;
  payment_transaction_id?: number;
  transaction?: {
    hash: string;
    amount: number;
    sender_id: number;
    recipient_id: number;
  };
  conversation_enabled?: boolean;
  error?: string;
}

/**
 * Calculate the price for starting a conversation with a user
 */
export const calculateDMPrice = async (recipientHandle: string): Promise<DMPriceCalculationResponse> => {
  try {
    debugLog('Calculating DM price for recipient', recipientHandle);
    
    const response = await fetch('/api/dm-pricing/calculate', {
      method: 'POST',
      headers: createAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        recipient_handle: recipientHandle
      }),
    });

    console.log('📡 DM pricing API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DM pricing API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 DM price calculation response:', data);
    debugLog('DM price calculation response', data);
    
    // Transform API response to match expected interface
    if (data.success && data.price_info && data.recipient_handle && data.recipient_id) {
      console.log('🔄 Transforming API response to expected format');
      const transformedResponse = {
        success: true,
        price_info: data.price_info,
        recipient: {
          id: data.recipient_id,
          handle: data.recipient_handle
        }
      };
      console.log('✅ Transformed response:', transformedResponse);
      return transformedResponse;
    }
    
    console.log('⚠️ API response does not match expected format, returning as-is');
    return data;
  } catch (error) {
    console.error('Error calculating DM price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate DM price'
    };
  }
};

/**
 * Get payment estimate for DM
 */
export const estimateDMPayment = async (recipientHandle: string, amount: number): Promise<DMPaymentEstimateResponse> => {
  try {
    debugLog('Estimating DM payment', { recipientHandle, amount });
    
    const response = await fetch('/api/dm-payment/estimate', {
      method: 'POST',
      headers: createAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        recipient_handle: recipientHandle,
        amount: amount
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('DM payment estimate response', data);
    
    // Transform API response to match expected interface
    if (data.success && data.totalCost && data.estimatedGasFee) {
      console.log('🔄 Transforming payment estimate API response to expected format');
      const transformedResponse = {
        success: true,
        estimate: {
          amount: data.amount || amount,
          estimated_gas: data.estimatedGasFee,
          gas_price: data.estimatedGasFee, // Using same value for compatibility
          estimated_fee: parseFloat(data.estimatedGasFee),
          total_cost: parseFloat(data.totalCost),
          recipient_gets: data.amount ? parseFloat(data.amount) * 0.9 : amount * 0.9, // Assuming 10% platform fee
          platform_fee: data.amount ? parseFloat(data.amount) * 0.1 : amount * 0.1
        }
      };
      console.log('✅ Transformed payment estimate response:', transformedResponse);
      return transformedResponse;
    }
    
    console.log('⚠️ Payment estimate API response does not match expected format, returning as-is');
    return data;
  } catch (error) {
    console.error('Error estimating DM payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to estimate DM payment'
    };
  }
};

/**
 * Initiate DM payment
 */
export const initiateDMPayment = async (recipientHandle: string, amount: number): Promise<DMPaymentInitiateResponse> => {
  try {
    debugLog('Initiating DM payment', { recipientHandle, amount });
    
    const response = await fetch('/api/dm-payment/initiate', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        recipient_handle: recipientHandle,
        amount: amount
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('DM payment initiated successfully', data);
    
    return data;
  } catch (error) {
    console.error('Error initiating DM payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate payment'
    };
  }
};

// Paid conversation status interfaces
export interface PaymentInfo {
  payment_transaction_id: number;
  amount: number;
  status: string;
  detailed_status: string;
  status_description: string;
  txn_hash: string;
  conversation_id: number;
  payment_deadline: string;
  hours_until_deadline: number;
  is_expired: boolean;
  has_replied: boolean;
  replied_at: string | null;
  refund_eligible: boolean;
  refund_amount: number;
  refund_txn_hash: string | null;
  distribution_txn_hash: string | null;
  platform_fee: number | null;
  recipient_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface DMPaymentStatusResponse {
  success: boolean;
  has_paid: boolean;
  recipient_handle: string;
  recipient_id: number;
  is_current_user_eth_recipient?: boolean; // True if current user will receive ETH by replying
  payment_info?: PaymentInfo;
  message?: string;
  error?: string;
}

/**
 * Check payment status for a conversation with a specific user
 * This works for both sender and receiver perspectives
 */
export const checkDMPaymentStatus = async (otherUserHandle: string): Promise<DMPaymentStatusResponse> => {
  try {
    debugLog('Checking DM payment status', { otherUserHandle });
    
    // First, check if current user has paid to message the other user (sender perspective)
    const senderResponse = await fetch(`/api/dm-payment/status/${otherUserHandle}`, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (senderResponse.ok) {
      const senderData = await senderResponse.json();
      debugLog('DM payment status (sender perspective)', senderData);
      
      if (senderData.success && senderData.has_paid) {
        return senderData;
      }
    }

    // If no payment found from sender perspective, check receiver perspective
    // Get all received payments and find one from this specific user
    const receiverResponse = await fetch('/api/dm-payment/received-payments?status=paid', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (receiverResponse.ok) {
      const receiverData = await receiverResponse.json();
      debugLog('DM payment status (receiver perspective)', receiverData);
      
      if (receiverData.success && receiverData.received_payments) {
        // Find payment from the specific user we're chatting with
        const paymentFromUser = receiverData.received_payments.find(
          (payment: any) => payment.sender_handle === otherUserHandle
        );
        
        if (paymentFromUser) {
          // Transform the received payment data to match the expected format
          return {
            success: true,
            has_paid: true,
            recipient_handle: otherUserHandle,
            recipient_id: paymentFromUser.sender_id,
            is_current_user_eth_recipient: true, // Current user will receive ETH if they reply
            payment_info: {
              payment_transaction_id: paymentFromUser.payment_transaction_id || paymentFromUser.id,
              amount: paymentFromUser.amount,
              status: paymentFromUser.status,
              detailed_status: paymentFromUser.status,
              status_description: paymentFromUser.status === 'paid' 
                ? `💰 Reply now to earn ETH! Only ${paymentFromUser.hours_until_deadline || 0}h left or you lose the payment!`
                : 'Payment received',
              txn_hash: paymentFromUser.txn_hash,
              conversation_id: paymentFromUser.conversation_id,
              payment_deadline: paymentFromUser.payment_deadline,
              hours_until_deadline: paymentFromUser.hours_until_deadline || 0,
              is_expired: paymentFromUser.is_expired || false,
              has_replied: paymentFromUser.has_replied || false,
              replied_at: paymentFromUser.replied_at,
              refund_eligible: paymentFromUser.refund_eligible || false,
              refund_amount: paymentFromUser.refund_amount || 0,
              refund_txn_hash: paymentFromUser.refund_txn_hash,
              distribution_txn_hash: paymentFromUser.distribution_txn_hash,
              platform_fee: paymentFromUser.platform_fee,
              recipient_amount: paymentFromUser.recipient_amount,
              created_at: paymentFromUser.created_at,
              updated_at: paymentFromUser.updated_at
            }
          };
        }
      }
    }

    // No payment found from either perspective
    return {
      success: true,
      has_paid: false,
      recipient_handle: otherUserHandle,
      recipient_id: 0,
      message: 'No payment found between these users'
    };
    
  } catch (error) {
    console.error('Error checking DM payment status:', error);
    return {
      success: false,
      has_paid: false,
      recipient_handle: otherUserHandle,
      recipient_id: 0,
      error: error instanceof Error ? error.message : 'Failed to check payment status'
    };
  }
}; 