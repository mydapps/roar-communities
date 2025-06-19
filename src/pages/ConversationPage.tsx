import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MoreVertical, 
  Send, 
  Smile,
  Paperclip,
  Shield,
  Image as ImageIcon,
  Video,
  Plus,
  Reply,
  X,
  Wifi,
  WifiOff,
  UserX,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { fetchMessages, sendMessage, markAllMessagesAsRead, markMessageAsRead, checkUserBlockStatus, checkDMPaymentStatus, checkOnlineStatus, type Message, type ConversationParticipants, type DMPaymentStatusResponse, type OnlineStatusResponse } from '@/utils/messagingApi';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import EmojiPicker, { EmojiClickData, EmojiStyle, Categories } from 'emoji-picker-react';
import { toast } from 'sonner';
import { useTitle } from '@/hooks/useTitle';
import MessageBubble from '@/components/messages/MessageBubble';
import SpecialCommandBubble from '@/components/messages/SpecialCommandBubble';
import SpecialEffects from '@/components/animations/SpecialEffects';
import { getUserProfile } from '@/utils/userApi';
import { useDropzone } from 'react-dropzone';
import { useWebSocket } from '@/hooks/useWebSocket';
import { webSocketClient } from '@/utils/webSocketClient';
import * as apiBase from '@/utils/apiBase';
import { isSpecialCommand, extractCommand, getEffectType, type SpecialCommand, type EffectType } from '@/utils/specialCommands';

// Custom emoji configuration
const customEmojisConfig = [
  { id: 'angry', names: ['angry'], imgUrl: '/emojis/angry.png' },
  { id: 'bitcoin', names: ['bitcoin'], imgUrl: '/emojis/bitcoin.png' },
  { id: 'cool', names: ['cool'], imgUrl: '/emojis/cool.png' },
  { id: 'ethereum', names: ['ethereum'], imgUrl: '/emojis/ethereum.png' },
  { id: 'happy', names: ['happy'], imgUrl: '/emojis/happy.png' },
  { id: 'mindblown', names: ['mindblown'], imgUrl: '/emojis/mindblown.png' },
  { id: 'party', names: ['party'], imgUrl: '/emojis/party.png' },
  { id: 'sad', names: ['sad'], imgUrl: '/emojis/sad.png' },
  { id: 'scared', names: ['scared'], imgUrl: '/emojis/scared.png' },
  { id: 'sleepy', names: ['sleepy'], imgUrl: '/emojis/sleepy.png' },
  { id: 'solana', names: ['solana'], imgUrl: '/emojis/solana.png' },
  { id: 'thinking', names: ['thinking'], imgUrl: '/emojis/thinking.png' },
  { id: 'angelic', names: ['angelic'], imgUrl: '/emojis/angelic.png' },
  { id: 'devilish', names: ['devilish'], imgUrl: '/emojis/devilish.png' },
  { id: 'inlove', names: ['inlove'], imgUrl: '/emojis/inlove.png' },
  { id: 'pleading', names: ['pleading'], imgUrl: '/emojis/pleading.png' },
  { id: 'surprised', names: ['surprised'], imgUrl: '/emojis/surprised.png' },
];

const emojiPickerCategoryConfig = [
  { category: Categories.SMILEYS_PEOPLE, name: 'Smileys & People' },
  { category: Categories.CUSTOM, name: 'Roar Emojis' },
  { category: Categories.ANIMALS_NATURE, name: 'Animals & Nature' },
  { category: Categories.FOOD_DRINK, name: 'Food & Drink' },
  { category: Categories.ACTIVITIES, name: 'Activities' },
  { category: Categories.TRAVEL_PLACES, name: 'Travel & Places' },
  { category: Categories.OBJECTS, name: 'Objects' },
  { category: Categories.SYMBOLS, name: 'Symbols' },
  { category: Categories.FLAGS, name: 'Flags' },
];

const ConversationPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [conversationTitle, setConversationTitle] = useState('Unknown User');
  const [conversationAvatar, setConversationAvatar] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isMediaPopoverOpen, setIsMediaPopoverOpen] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse | null>(null);
  const [currentUserHandle, setCurrentUserHandle] = useState('');
  const [participants, setParticipants] = useState<ConversationParticipants | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  // Typing indicators removed - no longer supported
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [apiToken, setApiToken] = useState<string | null>(null);

  // Blocking functionality state
  const [isUserBlocked, setIsUserBlocked] = useState<boolean>(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [isBlocking, setIsBlocking] = useState<boolean>(false);
  const [otherUserHandle, setOtherUserHandle] = useState<string>('');

  // Paid conversation state
  const [paymentStatus, setPaymentStatus] = useState<DMPaymentStatusResponse | null>(null);
  const [isLoadingPaymentStatus, setIsLoadingPaymentStatus] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Special effects state
  const [currentEffect, setCurrentEffect] = useState<EffectType | null>(null);

  // Online status state
  const [isOtherUserOnline, setIsOtherUserOnline] = useState<boolean>(false);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': [],
    },
  });

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              handleFileUpload(file);
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

    // Typing indicators removed (no longer supported by SSE backend)
  const handleTyping = () => {
    // Typing indicators have been removed from the SSE implementation
    // This function is kept for compatibility but does nothing
  };

  const handleFileUpload = async (file: File) => {
    // This logic needs to be fully implemented to handle the upload
    // and then call onMediaUploaded.
    // We can extract the logic from `MediaUpload` component to a shared function.
    
    const onMediaUploaded = (media: MediaUploadResponse) => {
      setUploadedMedia(media);
      toast.success('Media ready to be sent');
    };

    // Replicating upload logic from MediaUpload component
    const formData = new FormData();
    formData.append('media', file);

    try {
        const response = await fetch('/api/upload_media', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const result = await response.json();
        onMediaUploaded(result);
    } catch (error) {
        toast.error('Failed to upload media.');
        console.error(error);
    }
  };

  // WebSocket message handler
  const { markAsRead, joinConversation, leaveConversation, sendMessage: sendWebSocketMessage, setMessageHandlers } = useWebSocket();

  // Debug logging for WebSocket
  useEffect(() => {
    console.log('🔍 ConversationPage - conversationId from URL params:', conversationId);
    console.log('🔍 ConversationPage - currentUserHandle:', currentUserHandle);
    console.log('🔍 ConversationPage - WebSocket will connect automatically');
  }, [conversationId, currentUserHandle]);

  // Debug logging for conversation ID
  useEffect(() => {
    console.log('🆔 ConversationPage conversationId from useParams:', conversationId);
    console.log('🆔 ConversationPage conversationId type:', typeof conversationId);
  }, [conversationId]);

    // Set up SSE event handlers for this conversation
  useEffect(() => {
    if (!conversationId) return;

    console.log('🔗 Setting up WebSocket handlers for conversation:', conversationId);

    // Set up WebSocket event handlers
    const handleNewMessage = (message: Message) => {
      console.log('📨 WebSocket onNewMessage called:', message);
      console.log('🆔 Message conversation_id:', message.conversation_id, 'Current conversationId:', conversationId);
      
      // Handle both string and numeric conversation IDs
      const messageConvId = String(message.conversation_id);
      const currentConvId = String(conversationId);
      
      if (messageConvId === currentConvId) {
        console.log('✅ Message is for current conversation, checking if it\'s our own message');
        
        // Check if it's a special command message from another user (for animations)
        if (message.message_content && isSpecialCommand(message.message_content)) {
          const command = extractCommand(message.message_content);
          console.log('⚡ Special command detected:', command, 'from:', message.sender_handle);
          
          if (command && message.sender_handle !== currentUserHandle) {
            console.log('🎬 Triggering effect for receiver:', command);
            // Trigger effect for receiver when message is received
            const effectType = getEffectType(command);
            setCurrentEffect(effectType);
          }
        }
        
        // CRITICAL FIX: Don't process our own messages from WebSocket
        // This prevents the annoying replacement of optimistic messages
        if (message.sender_handle === currentUserHandle) {
          console.log('🚫 Ignoring our own message from WebSocket to prevent optimistic replacement');
          return;
        }
        
        // Store current input focus state before updating messages
        const wasInputFocused = inputRef.current === document.activeElement;
        
      setMessages(prev => {
          // Simple duplicate check - only prevent true duplicates
          const existingMessage = prev.find(m => m.id === message.id);
          
          if (existingMessage) {
            console.log('⚠️ Message already exists, skipping duplicate from WebSocket');
            return prev;
          }
        
        // Add new message and sort by timestamp
          const newMessages = [...prev, { ...message, isOptimistic: false }].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
          
          console.log('✅ Added new message via WebSocket, total messages:', newMessages.length);
        
        return newMessages;
      });
      
      // Restore input focus if it was focused before the update
      if (wasInputFocused && inputRef.current) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 10);
      }
      
      // Auto-scroll to bottom when new message arrives
      setTimeout(() => scrollToBottom(), 100);
      
        // Auto-mark as read if conversation is active
        markAsRead(parseInt(conversationId), message.id);
        
        // Refresh payment status when ANY message is received
        if (paymentStatus?.has_paid) {
          console.log('💰 New message received, refreshing payment status...');
          setTimeout(() => {
            loadPaymentStatus();
          }, 500); // Faster refresh
        }
        
        // No toast for new messages - user can see them in real-time
        // Toasts can be annoying during active conversations
      } else {
        console.log('⚠️ Message is for different conversation, ignoring');
      }
    };

    const handleMessageRead = (data: any) => {
      console.log('✅ WebSocket onMessageRead called:', data);
      if (data.conversationId === parseInt(conversationId)) {
        // Store current input focus state before updating messages
        const wasInputFocused = inputRef.current === document.activeElement;
        
        setMessages(prev => 
          prev.map(msg => 
              msg.id === data.messageId 
              ? { ...msg, is_read: true }
              : msg
          )
        );
        
        // Restore input focus if it was focused before the update
        if (wasInputFocused && inputRef.current) {
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 10);
        }
      }
    };

    // Set up WebSocket handlers
    setMessageHandlers(handleNewMessage, handleMessageRead);

    // Join the conversation when component mounts
    if (conversationId) {
      joinConversation(parseInt(conversationId));
    }

    console.log('🔗 WebSocket handlers set up successfully');

    return () => {
      // Clean up handlers and leave conversation
      console.log('🧹 Cleaning up WebSocket handlers');
      if (conversationId) {
        leaveConversation(parseInt(conversationId));
      }
      setMessageHandlers(undefined, undefined);
    };
  }, [conversationId, currentUserHandle]);

  // Initialize user data once on mount
  useEffect(() => {
    const userHandle = localStorage.getItem('dapps_user_handle');
    const userId = localStorage.getItem('dapps_user_id');
    setCurrentUserHandle(userHandle || '');
    setCurrentUserId(parseInt(userId || '0'));
  }, []); // Only run once on mount

  // Handle location state separately
  useEffect(() => {
    if (location.state?.otherUser) {
      setConversationTitle(location.state.otherUser.handle);
      setConversationAvatar(location.state.otherUser.avatar);
    }
  }, [location.state]);

  useTitle(`Chat with ${conversationTitle} - dapps.co`);

  useEffect(() => {
    if (conversationId && currentUserHandle) {
      loadMessages();
      markAllMessagesAsRead(conversationId);
    }

    // Cleanup typing timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserHandle]); // Need both dependencies for loadMessages to work

  // Refresh payment status and online status on page load/reload (separate from loadMessages)
  useEffect(() => {
    if (otherUserHandle && currentUserHandle && otherUserHandle !== currentUserHandle) {
      console.log('🔄 Page load - refreshing payment status for:', otherUserHandle);
      const refreshPaymentStatus = async () => {
        try {
          const status = await checkDMPaymentStatus(otherUserHandle);
          setPaymentStatus(status);
          console.log('💰 Payment status refreshed on page load:', status);
        } catch (error) {
          console.error('❌ Error refreshing payment status on page load:', error);
        }
      };
      refreshPaymentStatus();
      
      // Load online status
      loadOnlineStatus();
      
      // Set up interval to check online status every 30 seconds
      const onlineStatusInterval = setInterval(loadOnlineStatus, 30000);
      
      return () => {
        clearInterval(onlineStatusInterval);
      };
    }
  }, [otherUserHandle, currentUserHandle]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (force = false) => {
    if (force) {
      // Immediate scroll for optimistic messages
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadPaymentStatus = async () => {
    if (!otherUserHandle) return;
    
    setIsLoadingPaymentStatus(true);
    try {
      console.log('🔍 Checking payment status for conversation with:', otherUserHandle);
      const status = await checkDMPaymentStatus(otherUserHandle);
      console.log('💰 Payment status for conversation:', status);
      setPaymentStatus(status);
    } catch (error) {
      console.error('Error loading payment status:', error);
    } finally {
      setIsLoadingPaymentStatus(false);
    }
  };

  const loadOnlineStatus = async () => {
    if (!otherUserHandle) return;
    
    try {
      console.log('🔍 Checking online status for:', otherUserHandle);
      const status = await checkOnlineStatus(otherUserHandle);
      console.log('🟢 Online status for user:', status);
      if (status && status.success) {
        setIsOtherUserOnline(status.is_online);
      }
    } catch (error) {
      console.error('Error loading online status:', error);
    }
  };

  const calculateTimeRemaining = (deadline: string): string => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const timeDiff = deadlineTime - now;

    if (timeDiff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Update countdown timer every minute AND refresh payment status
  useEffect(() => {
    if (!paymentStatus?.payment_info?.payment_deadline || paymentStatus.payment_info.is_expired) {
      return;
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining(paymentStatus.payment_info!.payment_deadline);
      setTimeRemaining(remaining);
      
      // If payment has expired, refresh the payment status to get updated info
      if (remaining === 'Expired' && !paymentStatus.payment_info.is_expired) {
        console.log('💰 Payment expired, refreshing status...');
        loadPaymentStatus();
      }
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [paymentStatus]);

  // Refresh payment status when user sends a message (to detect replies)
  const refreshPaymentStatusAfterMessage = async () => {
    if (paymentStatus?.has_paid) {
      console.log('💰 Refreshing payment status after message...');
      setTimeout(() => {
        loadPaymentStatus();
      }, 2000); // Wait 2 seconds for backend to process the reply
    }
  };

  // Periodic refresh of payment status (every 5 minutes) to catch external changes
  useEffect(() => {
    if (!paymentStatus?.has_paid) return;

    const interval = setInterval(() => {
      console.log('💰 Periodic payment status refresh...');
      loadPaymentStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [paymentStatus?.has_paid]);

  const loadMessages = async () => {
    if (!conversationId || !currentUserHandle) return;
    
    try {
      setLoading(true);
      const response = await fetchMessages(conversationId, page);
      
      if (response.success) {
        // Sort messages chronologically (oldest first)
        const sortedMessages = response.messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        setMessages(sortedMessages);
        setParticipants(response.participants);
        setHasMore(response.pagination.page < response.pagination.totalPages);
        
        // Check for unread special commands from other users and trigger animations
        const unreadSpecialCommands = sortedMessages.filter(msg => 
          !msg.is_read && 
          msg.sender_handle !== currentUserHandle &&
          msg.message_content && 
          isSpecialCommand(msg.message_content)
        );
        
        if (unreadSpecialCommands.length > 0) {
          // Trigger animation for the most recent unread special command
          const latestCommand = unreadSpecialCommands[unreadSpecialCommands.length - 1];
          const command = extractCommand(latestCommand.message_content);
          if (command) {
            console.log('🎬 Triggering historical animation for offline user:', command);
            setTimeout(() => {
              const effectType = getEffectType(command);
              setCurrentEffect(effectType);
            }, 1000); // Small delay to let the UI load first
          }
        }
        
        // Set conversation info from participants
        if (response.participants) {
          setConversationTitle(response.participants.otherUser.username || response.participants.otherUser.handle);
          setConversationAvatar(response.participants.otherUser.avatar);
          // Set other user handle for blocking functionality
          setOtherUserHandle(response.participants.otherUser.handle);
          
          // Check if the current user has blocked the other user
          const blockStatus = await checkUserBlockStatus(response.participants.otherUser.handle);
          if (blockStatus.success) {
            setIsUserBlocked(blockStatus.isBlocked);
          }
          
          // Check payment status for this conversation
          const status = await checkDMPaymentStatus(response.participants.otherUser.handle);
          setPaymentStatus(status);
        }
        
        // Auto-scroll to bottom and focus input after loading messages
        setTimeout(() => {
          scrollToBottom(true);
          inputRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() && !uploadedMedia) return;
    if (sending) return;
    
    setSending(true);

    const optimisticId = Date.now();
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId!,
      sender_id: currentUserId,
      sender_handle: currentUserHandle,
      sender_avatar: '',
      message_content: messageText,
      xmtp_message_id: `optimistic_${optimisticId}`,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      reply_to: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content || replyingTo.message_content || '',
        sender_id: replyingTo.sender_id || 0,
        sender_handle: replyingTo.sender?.handle || replyingTo.sender_handle || 'Unknown'
      } : undefined,
      isOptimistic: true,
      // Compatibility fields
      content: messageText,
      sender: {
        id: currentUserId,
        handle: currentUserHandle,
        avatar: ''
      }
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input immediately for better UX
    const messageToSend = messageText;
    const mediaToSend = uploadedMedia;
    const replyToSend = replyingTo;
    
    setMessageText('');
    setUploadedMedia(null);
    setReplyingTo(null);
    
    // Keep input focused on mobile to prevent keyboard from closing
    if (inputRef.current) {
      // Small delay to ensure input is cleared first
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
    }
    
    // Scroll to bottom
    scrollToBottom(true);

    // Send message in background (non-blocking)
    const sendMessageAsync = async () => {
      try {
        let messageContent = messageToSend;
        
        if (mediaToSend) {
          if (mediaToSend.type === 'image') {
            messageContent = `![](${mediaToSend.url})${messageToSend ? '\n' + messageToSend : ''}`;
          } else if (mediaToSend.type === 'video') {
            messageContent = `![video](${mediaToSend.url})${messageToSend ? '\n' + messageToSend : ''}`;
          }
        }

        const response = await sendMessage(
          conversationId!,
          messageContent,
          replyToSend?.id
        );

        if (response.success && response.message) {
          // Transform the response message to our interface
          const serverMessage: Message = {
            id: response.message.id,
            conversation_id: response.message.conversation_id.toString(),
            sender_id: response.message.sender_id,
            sender_handle: currentUserHandle,
            sender_avatar: '',
            message_content: response.message.message_content,
            xmtp_message_id: `msg_${response.message.id}`,
            message_type: response.message.message_type,
            is_read: false,
            created_at: response.message.created_at,
            reply_to: replyToSend ? {
              id: replyToSend.id,
              content: replyToSend.content || replyToSend.message_content || '',
              sender_id: replyToSend.sender_id || 0,
              sender_handle: replyToSend.sender?.handle || 'Unknown'
            } : undefined,
            isOptimistic: false,
            content: response.message.message_content,
            sender: {
              id: response.message.sender_id,
              handle: currentUserHandle,
              avatar: ''
            }
          };

          // Store current input focus state before updating messages
          const wasInputFocused = inputRef.current === document.activeElement;
          
          // Replace optimistic message with real message
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticId ? serverMessage : msg
          ));
          
          // Restore input focus if it was focused before the update
          if (wasInputFocused && inputRef.current) {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }, 10);
          }
        } else {
          // Store current input focus state before updating messages
          const wasInputFocused = inputRef.current === document.activeElement;
          
          // Remove failed optimistic message and show error
          setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
          toast.error(response.error || 'Failed to send message');
          
          // Restore input focus if it was focused before the update
          if (wasInputFocused && inputRef.current) {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }, 10);
          }
        }
      } catch (error) {
        console.error('Send message error:', error);
        
        // Store current input focus state before updating messages
        const wasInputFocused = inputRef.current === document.activeElement;
        
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        toast.error('Failed to send message');
        
        // Restore input focus if it was focused before the update
        if (wasInputFocused && inputRef.current) {
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 10);
        }
      }
    };

    // Execute send in background
    sendMessageAsync().finally(() => {
      setSending(false);
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    let emojiToInsert = '';
    if (customEmojisConfig.some(emoji => emoji.id === emojiData.emoji)) {
      // It's a custom emoji, insert with colons
      emojiToInsert = ` :${emojiData.emoji}: `;
    } else {
      emojiToInsert = emojiData.emoji;
    }
    setMessageText(prev => prev + emojiToInsert);
    setIsEmojiPickerOpen(false);
  };

  const handleMediaUploaded = (media: MediaUploadResponse) => {
    if (uploadedMedia) {
      toast.error('Please remove the current media before uploading a new one');
      setIsMediaPopoverOpen(false); // Close popover even on error
      return;
    }
    setUploadedMedia(media);
    setIsMediaPopoverOpen(false); // Close the popover after successful upload
    toast.success('Media uploaded successfully');
  };

  const removeMedia = () => {
    setUploadedMedia(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    handleTyping();
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    // Focus on input (optional UX enhancement)
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleReplyClick = (replyToMessageId: number) => {
    scrollToMessage(replyToMessageId);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Blocking functionality
  const handleBlockUser = async () => {
    if (!otherUserHandle) return;
    
    setIsBlocking(true);
    try {
      const headers = apiBase.createAuthHeaders();
      const response = await fetch('/api/set_user_block_status', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          handle: otherUserHandle,
          action: 'block',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to block ${otherUserHandle}.` }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `User ${otherUserHandle} has been blocked.`);
        setIsUserBlocked(true);
        setIsBlockModalOpen(false);
      } else {
        throw new Error(data.message || `Failed to block ${otherUserHandle}.`);
      }
    } catch (error: any) {
      const message = error.message || `An error occurred while blocking ${otherUserHandle}.`;
      console.error("Block user failed:", error);
      toast.error(message);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!otherUserHandle) return;
    
    setIsBlocking(true);
    try {
      const headers = apiBase.createAuthHeaders();
      const response = await fetch('/api/set_user_block_status', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          handle: otherUserHandle,
          action: 'unblock',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to unblock ${otherUserHandle}.` }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `User ${otherUserHandle} has been unblocked.`);
        setIsUserBlocked(false);
      } else {
        throw new Error(data.message || `Failed to unblock ${otherUserHandle}.`);
      }
    } catch (error: any) {
      const message = error.message || `An error occurred while unblocking ${otherUserHandle}.`;
      console.error("Unblock user failed:", error);
      toast.error(message);
    } finally {
      setIsBlocking(false);
    }
  };

  // Intersection Observer for marking messages as read
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
          const message = messages.find(m => m.id === messageId);
          
          if (entry.isIntersecting && message) {
            // Mark message as read if it's from another user and not already read
            if (message.sender?.handle !== currentUserHandle && !message.is_read) {
              markMessageAsRead(messageId).then((result) => {
                if (result.success) {
                  // Update the message in state to reflect read status
                  setMessages(prev => prev.map(msg => 
                    msg.id === messageId ? { ...msg, is_read: true } : msg
                  ));
                }
              });
            }
          }
        });
      },
      {
        threshold: 0.5, // Message is considered "read" when 50% visible
        rootMargin: '0px 0px -50px 0px' // Account for input area at bottom
      }
    );

    // Observe all message elements
    messageRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [messages, currentUserHandle]); // Removed visibleMessages dependency to prevent infinite loop

  const scrollToMessage = (messageId: number) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement && messagesContainerRef.current) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the message briefly
      messageElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  // Handle special command clicks - auto-send immediately
  const handleSpecialCommandClick = async (command: SpecialCommand) => {
    if (!conversationId) return;

    const effectType = getEffectType(command);
    
    // Trigger immediate effect for sender
    setCurrentEffect(effectType);
    
    // Send the command message directly
    const commandMessage = `/${command}`;
    const userAvatar = localStorage.getItem('dapps_user_avatar');
    const avatarUrl = userAvatar ? `https://img.dapps.co/avatar/${userAvatar}.svg` : 'https://img.dapps.co/avatar/default.svg';

    // Create optimistic message
    const optimisticId = Date.now();
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_handle: currentUserHandle,
      sender_avatar: avatarUrl,
      message_content: commandMessage,
      xmtp_message_id: `optimistic_${optimisticId}`,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      reply_to: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content || replyingTo.message_content || '',
        sender_id: replyingTo.sender_id,
        sender_handle: replyingTo.sender_handle || replyingTo.sender?.handle || ''
      } : null,
      content: commandMessage,
      sender: {
        id: currentUserId,
        handle: currentUserHandle,
        avatar: avatarUrl,
      }
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      // Send the actual message
      await sendMessage(
        conversationId,
        commandMessage,
        replyingTo?.id || undefined
      );

      // Clear reply state
      setReplyingTo(null);
      
      // Refresh payment status if needed
      refreshPaymentStatusAfterMessage();
    } catch (error) {
      console.error('Error sending special command:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      toast.error('Failed to send message');
    }
  };

  // Handle effect completion
  const handleEffectComplete = () => {
    setCurrentEffect(null);
  };



  // Additional aggressive payment status refresh
  useEffect(() => {
    if (!paymentStatus?.has_paid) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic payment status refresh...');
      loadPaymentStatus();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [paymentStatus?.has_paid, loadPaymentStatus]);

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 pt-16">
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full shadow-lg"
          >
            <Send className="h-8 w-8 text-blue-500" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 dark:text-gray-400 font-medium"
          >
            Loading conversation...
          </motion.p>
        </div>
      </div>
    );
  }

      return (
        <div className="flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 
                     h-screen md:h-[calc(100vh-4rem)] 
                     fixed md:relative top-0 md:top-16 left-0 right-0 bottom-0 md:left-auto md:right-auto md:bottom-auto
                     z-[1000] md:z-auto overflow-hidden mobile-conversation-container md:relative"
    >
      {/* iOS Safe Area Top Padding */}
      <div className="h-safe-top md:h-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg"></div>
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 flex-shrink-0 sticky top-0 md:top-0 z-20"
      >
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/messages')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              {conversationAvatar ? (
                <img
                  src={conversationAvatar}
                  alt={conversationTitle}
                  className="w-10 h-10 rounded-full object-cover shadow-lg border-2 border-white dark:border-gray-900"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {conversationTitle ? conversationTitle.slice(0, 2).toUpperCase() : '??'}
                </div>
              )}
              {/* Online status indicator */}
              {isOtherUserOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{conversationTitle}</h2>
              <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <Shield className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="hidden sm:inline">End-to-end encrypted by</span>
                <span className="sm:hidden">Encrypted</span>
                <img src="/xmtp.png" alt="XMTP" className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-semibold hidden sm:inline">XMTP</span>
                <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation min-h-[44px] min-w-[44px]"
                style={{ touchAction: 'manipulation' }}
              >
            <MoreVertical className="h-5 w-5" />
          </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-48 z-[9999] shadow-xl border-2" 
              side="bottom" 
              align="end"
              sideOffset={8}
              collisionPadding={16}
            >
              <div className="grid gap-1">
                {!isUserBlocked ? (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[44px] touch-manipulation"
                    onClick={() => setIsBlockModalOpen(true)}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Block User
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 min-h-[44px] touch-manipulation"
                    onClick={handleUnblockUser}
                    disabled={isBlocking}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {isBlocking ? 'Unblocking...' : 'Unblock User'}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      {/* Paid Conversation Status */}
      {paymentStatus?.success && paymentStatus.has_paid && paymentStatus.payment_info && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-purple-200 dark:border-purple-700 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Paid Conversation • {paymentStatus.payment_info.amount} ETH
                  </span>
                  <span className="px-2 py-1 bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 text-xs font-medium rounded-full">
                    {paymentStatus.payment_info.detailed_status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-purple-600 dark:text-purple-300 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {/* Show different messages for sender vs receiver */}
                    {paymentStatus.is_current_user_eth_recipient ? (
                      // Current user will receive ETH if they reply
                      paymentStatus.payment_info.has_replied 
                        ? "✅ You've replied and earned the payment!"
                        : `💰 Reply now to earn ETH! Only ${timeRemaining || `${paymentStatus.payment_info.hours_until_deadline}h`} left!`
                    ) : (
                      // Current user is the payment sender
                      paymentStatus.payment_info.has_replied
                        ? "Recipient has replied - payment complete"
                        : `50% refund if no reply within ${timeRemaining || `${paymentStatus.payment_info.hours_until_deadline}h`}`
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Countdown Timer - Hide when payment is distributed, refunded, or expired */}
            {!paymentStatus.payment_info.is_expired && 
             timeRemaining && 
             timeRemaining !== 'Expired' && 
             !['distributed', 'refunded', 'expired'].includes(paymentStatus.payment_info.status) && (
              <div className="text-right">
                <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  {timeRemaining} remaining
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-300">
                  {paymentStatus.payment_info.has_replied ? 'Payment complete' : 
                    (paymentStatus.is_current_user_eth_recipient ? '⚡ Reply to claim ETH!' : 'Awaiting reply')
                  }
                </div>
              </div>
            )}
            
            {/* Expired Status */}
            {paymentStatus.payment_info.is_expired && (
              <div className="text-right">
                <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Expired</span>
                </div>
                {paymentStatus.payment_info.refund_eligible && (
                  <div className="text-xs text-orange-500">
                    {paymentStatus.is_current_user_eth_recipient ? '💸 Payment lost - too late to reply!' : 'Refund available'}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide mobile-messages-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y', // Allow vertical scrolling on touch devices
          overscrollBehavior: 'contain', // Prevent overscroll from affecting parent
          height: '100%', // Ensure proper height
          minHeight: 0 // Allow flex child to shrink
        }}
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-500 dark:text-gray-400 py-8"
            >
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">Start your conversation</h3>
            </motion.div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender?.handle === currentUserHandle;
              const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender?.handle !== message.sender?.handle);
              
              // Optimistic messages should appear instantly with no animation delay
              const shouldAnimate = message.isOptimistic === true;
              
              return (
                <motion.div
                  key={message.id}
                  ref={(el) => {
                    if (el) {
                      messageRefs.current.set(message.id, el);
                    }
                  }}
                  data-message-id={message.id}
                  initial={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={shouldAnimate ? { duration: 0 } : { duration: 0 }}
                >
                  {/* Render special command bubble or regular message bubble */}
                  {isSpecialCommand(message.message_content || message.content || '') ? (
                    <SpecialCommandBubble
                      message={message.message_content || message.content || ''}
                      isOwn={isOwn}
                      onClick={handleSpecialCommandClick}
                    />
                  ) : (
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                      showAvatar={showAvatar}
                      currentUserId={currentUserId}
                    onReply={handleReplyToMessage}
                    onReplyClick={handleReplyClick}
                    replyToMessage={message.reply_to}
                  />
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 mx-4 rounded-r-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Reply className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Replying to {replyingTo.sender?.handle === currentUserHandle ? 'yourself' : replyingTo.sender?.handle}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelReply}
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
              {replyingTo.content || replyingTo.message_content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input or Blocked User Message */}
      {isUserBlocked ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-6 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800"
        >
          <div className="text-center">
            <UserX className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
              You have blocked this user
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">
              You cannot send or receive messages from @{otherUserHandle}
            </p>
            <Button 
              variant="outline" 
              onClick={handleUnblockUser}
              disabled={isBlocking}
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              {isBlocking ? 'Unblocking...' : 'Unblock User'}
            </Button>
          </div>
        </motion.div>
      ) : (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 flex-shrink-0 sticky bottom-0 md:relative md:bottom-auto z-20 mobile-input-container"
        style={{
          // Ensure input area stays in place on mobile keyboards
          position: 'sticky',
          bottom: 0,
          zIndex: 20
        }}
      >
        {/* Media Preview */}
        {uploadedMedia && (
          <div className="mb-3">
            <MediaPreview media={uploadedMedia} onRemove={removeMedia} />
          </div>
        )}

        <div className="flex items-center space-x-3">
          <Popover open={isMediaPopoverOpen} onOpenChange={setIsMediaPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px]"
                style={{ touchAction: 'manipulation' }}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-48 z-[9999] shadow-xl border-2" 
              side="top" 
              align="start"
              sideOffset={8}
              collisionPadding={16}
            >
              <div className="grid gap-2">
                <MediaUpload
                  onMediaUploaded={handleMediaUploaded}
                  acceptedTypes="image"
                  disabled={!!uploadedMedia}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start min-h-[44px] touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                </MediaUpload>
                <MediaUpload
                  onMediaUploaded={handleMediaUploaded}
                  acceptedTypes="video"
                  disabled={!!uploadedMedia}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start min-h-[44px] touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                </MediaUpload>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="flex-1 relative" {...getRootProps()}>
            <input {...getInputProps()} />
            <Input
              ref={inputRef}
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                replyingTo 
                  ? `Reply to ${replyingTo.sender?.handle}...`
                  : isDragActive 
                    ? "Drop the image here..." 
                    : "Type a message..."
              }
              className="pr-12 rounded-full border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
            
            {/* Emoji Picker */}
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px]"
                  disabled={sending}
                  style={{ touchAction: 'manipulation' }}
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-full p-0 border-0 shadow-lg z-[9999]" 
                side="top" 
                align="end"
                sideOffset={8}
                collisionPadding={16}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  autoFocusSearch={false}
                  emojiStyle={EmojiStyle.NATIVE}
                  height={400}
                  customEmojis={customEmojisConfig}
                  categories={emojiPickerCategoryConfig}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSendMessage();
              }}
              size="icon"
              className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              {sending ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-pulse w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
      )}
      
      {/* Block User Confirmation Modal */}
      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              Block User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to block <span className="font-semibold">@{otherUserHandle}</span>?
              <br /><br />
              Once blocked, you will no longer be able to message each other.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsBlockModalOpen(false)}
              disabled={isBlocking}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBlockUser}
              disabled={isBlocking}
            >
              {isBlocking ? 'Blocking...' : 'Block User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Special Effects Overlay */}
      <SpecialEffects 
        effect={currentEffect} 
        onComplete={handleEffectComplete} 
      />
    </div>
  );
};

export default ConversationPage; 