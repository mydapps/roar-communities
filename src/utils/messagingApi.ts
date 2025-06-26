import { toast } from 'sonner';
import { createAuthHeaders, debugLog } from './apiBase';

// 🛡️ Enhanced Error Handling for V3
const handleXMTPError = (error: Error, context: string) => {
  // V3-specific error messages
  const v3ErrorMap: Record<string, string> = {
    'XMTP V3 Client not yet loaded': 'XMTP service is starting up, please try again in a moment',
    'Target user is not available for messaging': 'This user cannot receive messages yet',
    'You cannot initiate a conversation with this user': 'This user has blocked you or messaging is restricted'
  };
  
  const userFriendlyMessage = v3ErrorMap[error.message] || error.message;
  
  console.error(`XMTP V3 Error in ${context}:`, {
    original: error.message,
    userFriendly: userFriendlyMessage,
    timestamp: new Date().toISOString()
  });
  
  return userFriendlyMessage;
};

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
  version?: string; // 🆕 V3 version tracking
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  message?: string;
  version?: string; // 🆕 V3 version tracking
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
    debugLog('Fetching conversations via XMTP V3');
    
    // ✅ V3 (WORKING) - Updated endpoint
    const response = await fetch('/api/xmtp/v3/conversations', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('V3 Conversations fetched successfully', data);
    
    return data;
  } catch (error) {
    const friendlyMessage = handleXMTPError(error as Error, 'fetchConversations');
    console.error('Error fetching V3 conversations:', error);
    toast.error(friendlyMessage);
    return {
      success: false,
      conversations: [],
      message: friendlyMessage
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
    debugLog('Starting conversation via XMTP V3 with user', handle);
    
    // ✅ V3 (WORKING) - Updated endpoint
    const response = await fetch('/api/xmtp/v3/conversations', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify({ handle }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('V3 Conversation started successfully', data);
    
    return {
      success: data.success,
      conversation: data.conversation,
      isNew: data.isNew,
      message: data.message
    };
  } catch (error) {
    const friendlyMessage = handleXMTPError(error as Error, 'startConversation');
    console.error('Error starting V3 conversation:', error);
    toast.error(friendlyMessage);
    return {
      success: false,
      error: friendlyMessage
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
  xmtp_version?: string; // 🆕 V3 version field
  // For optimistic UI updates
  isOptimistic?: boolean;
  // For compatibility with existing components
  content?: string;
  sender?: MessageSender;
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
  version?: string; // 🆕 V3 version tracking
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
    xmtp_version?: string; // 🆕 V3 version field
    xmtp_message_id?: string; // 🆕 V3 XMTP ID
  };
  error?: string;
  version?: string; // 🆕 V3 version tracking
}

export interface UnreadCountResponse {
  success: boolean;
  unread_count: number;
  version?: string; // 🆕 V3 version tracking
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
      // ✅ V3 (WORKING) - Updated endpoint
      const response = await fetch(`/api/xmtp/v3/conversations/${conversationId}/messages?page=${page}`, {
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

      debugLog(`V3 Messages fetched successfully for conversation ${conversationId}`, {
        messageCount: data.messages?.length || 0,
        page,
        version: data.version // 🆕 V3 version logging
      });

      // Transform messages to ensure compatibility
      const transformedMessages = data.messages.map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_handle: msg.sender_handle,
        sender_avatar: msg.sender_avatar,
        message_content: msg.message_content,
        xmtp_message_id: msg.xmtp_message_id,
        message_type: msg.message_type,
        is_read: msg.is_read,
        created_at: msg.created_at,
        metadata: msg.metadata,
        reply_to: msg.reply_to,
        xmtp_version: msg.xmtp_version || 'v3', // 🆕 V3 version field
        // Compatibility fields
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
        pagination: {
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          totalMessages: data.pagination.total
        }
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`V3 fetchMessages attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  console.error('All V3 fetchMessages attempts failed:', lastError);
  toast.error('Failed to load messages');
  
  return {
    success: false,
    messages: [],
    participants: {
      currentUser: { id: 0, handle: '', username: '', avatar: '' },
      otherUser: { id: 0, handle: '', username: '', avatar: '' }
    },
    pagination: {
      page: 1,
      totalPages: 0,
      totalMessages: 0
    },
    error: lastError?.message || 'Failed to fetch messages'
  };
};

/**
 * Send a message to a conversation
 */
export const sendMessage = async (conversationId: string, content: string, replyToMessageId?: number): Promise<{
  success: boolean;
  message?: any;
  error?: string;
}> => {
  try {
    debugLog('Sending message via XMTP V3', { conversationId, contentLength: content.length, replyToMessageId });
    
    // ✅ V3 (WORKING) - Updated endpoint
    const response = await fetch(`/api/xmtp/v3/conversations/${conversationId}/messages`, {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to send message');
    }

    debugLog('V3 Message sent successfully', {
      messageId: data.message?.id,
      xmtpId: data.message?.xmtp_message_id, // 🆕 V3 XMTP ID
      version: data.version // 🆕 Version tracking
    });

    return {
      success: true,
      message: data.message
    };
  } catch (error) {
    console.error('V3 sendMessage failed:', error);
    toast.error('Failed to send message');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (messageId: number): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    debugLog('Marking message as read via XMTP V3', messageId);
    
    // ✅ V3 (WORKING) - Updated endpoint
    const response = await fetch(`/api/xmtp/v3/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to mark message as read');
    }

    debugLog('V3 Message marked as read successfully', {
      messageId,
      version: data.version // 🆕 Version tracking
    });

    return { success: true };
  } catch (error) {
    console.error('V3 markMessageAsRead failed:', error);
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
    debugLog('Marking all messages as read via XMTP V3 for conversation', conversationId);
    
    // ✅ V3 (WORKING) - Updated endpoint
    const response = await fetch(`/api/xmtp/v3/conversations/${conversationId}/mark-all-read`, {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('V3 All messages marked as read successfully', data);
    
    return data;
  } catch (error) {
    console.error('Error marking all V3 messages as read:', error);
    return {
      success: false,
      message: 'Failed to mark messages as read'
    };
  }
};

/**
 * Fetch unread message count
 */
export const fetchUnreadCount = async (): Promise<UnreadCountResponse> => {
  try {
    debugLog('Fetching unread count via XMTP V3');
    
    // ✅ V3 (WORKING) - Updated endpoint
    const response = await fetch('/api/xmtp/v3/unread-count', {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('V3 Unread count fetched successfully', {
      count: data.unread_count,
      version: data.version // 🆕 Version tracking
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching V3 unread count:', error);
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

export interface DMPaymentStatusResponse {
  success: boolean;
  has_paid: boolean;
  is_current_user_eth_recipient: boolean;
  recipient_id?: number;
  recipient_handle?: string;
  payment_info?: {
    payment_transaction_id: number;
    amount: number;
    status: string;
    detailed_status: string;
    status_description: string;
    txn_hash: string;
    conversation_id?: number;
    payment_deadline: string;
    hours_until_deadline: number;
    is_expired: boolean;
    has_replied: boolean;
    replied_at: string | null;
    refund_eligible?: boolean;
    refund_amount?: number;
    refund_txn_hash?: string | null;
    distribution_txn_hash?: string | null;
    platform_fee?: number | null;
    recipient_amount?: number | null;
    created_at: string;
    updated_at: string;
  };
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
    debugLog('DM payment initiation response', data);
    
    return data;
  } catch (error) {
    console.error('Error initiating DM payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate DM payment'
    };
  }
};

/**
 * Check DM payment status for a conversation with a user
 */
export const checkDMPaymentStatus = async (recipientHandle: string): Promise<DMPaymentStatusResponse> => {
  try {
    debugLog('Checking DM payment status for recipient', recipientHandle);
    
    // Use GET method with recipient handle in URL path as per API documentation
    const response = await fetch(`/api/dm-payment/status/${encodeURIComponent(recipientHandle)}`, {
      method: 'GET',
      headers: createAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('DM payment status response', data);
    
    return data;
  } catch (error) {
    console.error('Error checking DM payment status:', error);
    return {
      success: false,
      has_paid: false,
      is_current_user_eth_recipient: false,
      error: error instanceof Error ? error.message : 'Failed to check DM payment status'
    };
  }
}; 

/**
 * Check online status for a user
 */
export interface OnlineStatusResponse {
  success: boolean;
  handle: string;
  user_id: number;
  is_online: boolean;
  active_connections: number;
  last_seen: string;
  error?: string;
}

export const checkOnlineStatus = async (handle: string): Promise<OnlineStatusResponse | null> => {
  try {
    debugLog('Checking online status for user', handle);
    
    const response = await fetch(`/api/chat-auth/online-status/${encodeURIComponent(handle)}`, {
      method: 'GET',
      credentials: 'include',
      headers: createAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Online status check result', data);
    
    return data;
  } catch (error) {
    console.error('Error checking online status:', error);
    return null;
  }
};

/**
 * Chat key interfaces
 */
export interface ChatKeyResponse {
  success: boolean;
  message: string;
  chat_key: string;
  key_id: number;
  websocket_url: string;
  error?: string;
}

/**
 * Generate a chat key for WebSocket authentication
 */
export const generateChatKey = async (): Promise<ChatKeyResponse | null> => {
  try {
    debugLog('Generating chat key');
    
    const response = await fetch('/api/chat-auth/generate-key', {
      method: 'POST',
      credentials: 'include',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        key_name: 'WebSocket Chat Key',
        expires_in_days: 30
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Chat key generated successfully', data);
    
    // Store chat key in localStorage for future use
    if (data.success && data.chat_key) {
      localStorage.setItem('dapps_chat_key', data.chat_key);
      localStorage.setItem('dapps_chat_key_expires', (Date.now() + (30 * 24 * 60 * 60 * 1000)).toString());
    }
    
    return data;
  } catch (error) {
    console.error('Error generating chat key:', error);
    return null;
  }
};

/**
 * Get stored chat key or generate a new one
 */
export const getChatKey = async (): Promise<string | null> => {
  try {
    // Check if we have a valid stored chat key
    const storedKey = localStorage.getItem('dapps_chat_key');
    const expiresAt = localStorage.getItem('dapps_chat_key_expires');
    
    if (storedKey && expiresAt) {
      const expirationTime = parseInt(expiresAt, 10);
      if (Date.now() < expirationTime) {
        debugLog('Using stored chat key');
        return storedKey;
      } else {
        debugLog('Stored chat key expired, generating new one');
        // Clear expired key
        localStorage.removeItem('dapps_chat_key');
        localStorage.removeItem('dapps_chat_key_expires');
      }
    }
    
    // Generate new chat key
    const response = await generateChatKey();
    if (response && response.success && response.chat_key) {
      return response.chat_key;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting chat key:', error);
    return null;
  }
}; 