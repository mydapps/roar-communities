import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTitle } from '@/hooks/useTitle';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDropzone } from 'react-dropzone';
import { EmojiClickData } from 'emoji-picker-react';
import * as apiBase from '@/utils/apiBase';

// Component imports
import ConversationHeader from '@/components/messages/ConversationHeader';
import PaymentStatusBanner from '@/components/messages/PaymentStatusBanner';
import ConversationMessages, { ConversationMessagesRef } from '@/components/messages/ConversationMessages';
import MessageInput, { MessageInputRef } from '@/components/messages/MessageInput';
import BlockedUserInterface from '@/components/messages/BlockedUserInterface';
import ConversationModals from '@/components/messages/ConversationModals';
import SpecialEffects from '@/components/animations/SpecialEffects';

// API and utility imports
import { 
  fetchMessages, 
  sendMessage, 
  markAllMessagesAsRead, 
  markMessageAsRead, 
  checkUserBlockStatus, 
  checkDMPaymentStatus, 
  checkOnlineStatus,
  type Message,
  type ConversationParticipants,
  type DMPaymentStatusResponse,
  type OnlineStatusResponse 
} from '@/utils/messagingApi';
import { MediaUploadResponse } from '@/components/ui/media-upload';
import { getUserProfile } from '@/utils/userApi';
import { 
  isSpecialCommand, 
  extractCommand, 
  getEffectType, 
  type SpecialCommand, 
  type EffectType 
} from '@/utils/specialCommands';

// Hooks
import { useConversationState } from '@/hooks/useConversationState';

const ConversationPage = () => {
  const {
    // State
    conversationId,
    messages,
    setMessages,
    loading,
    setLoading,
    sending,
    setSending,
    messageText,
    setMessageText,
    conversationTitle,
    setConversationTitle,
    conversationAvatar,
    setConversationAvatar,
    page,
    setPage,
    hasMore,
    setHasMore,
    isEmojiPickerOpen,
    setIsEmojiPickerOpen,
    isMediaPopoverOpen,
    setIsMediaPopoverOpen,
    uploadedMedia,
    setUploadedMedia,
    replyingTo,
    setReplyingTo,
    currentUserHandle,
    setCurrentUserHandle,
    currentUserId,
    setCurrentUserId,
    otherUserHandle,
    setOtherUserHandle,
    isUserBlocked,
    setIsUserBlocked,
    isBlockModalOpen,
    setIsBlockModalOpen,
    isBlocking,
    setIsBlocking,
    paymentStatus,
    setPaymentStatus,
    isLoadingPaymentStatus,
    setIsLoadingPaymentStatus,
    timeRemaining,
    setTimeRemaining,
    currentEffect,
    setCurrentEffect,
    isFloatingMessages,
    setIsFloatingMessages,
    isOtherUserOnline,
    setIsOtherUserOnline,
    messageRefs,
    typingTimeoutRef,
    // Handlers
    handleBack,
    handleTyping,
    handleEffectComplete,
    cancelReply,
    removeMedia,
  } = useConversationState();

  // Additional refs for child components
  const messagesRef = useRef<ConversationMessagesRef>(null);
  const messageInputRef = useRef<MessageInputRef>(null);
  const [participants, setParticipants] = useState<ConversationParticipants | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);

  // WebSocket integration
  const { markAsRead, joinConversation, leaveConversation, sendMessage: sendWebSocketMessage, setMessageHandlers } = useWebSocket();

  // Set page title
  useTitle(`Chat with ${conversationTitle} - dapps.co`);

  // Drag and drop for file uploads
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

  // Handle paste events for images
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

  // File upload handler
  const handleFileUpload = async (file: File) => {
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
      setUploadedMedia(result);
      toast.success('Media ready to be sent');
    } catch (error) {
        toast.error('Failed to upload media.');
        console.error(error);
    }
  };

  // WebSocket message handlers
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (message: Message) => {
      console.log('📨 WebSocket onNewMessage called:', message);
      const messageConvId = String(message.conversation_id);
      const currentConvId = String(conversationId);
      
      if (messageConvId === currentConvId) {
        // Handle special commands
        if (message.message_content && isSpecialCommand(message.message_content)) {
          const command = extractCommand(message.message_content);
          if (command && message.sender_handle !== currentUserHandle) {
            const effectType = getEffectType(command);
            setCurrentEffect(effectType);
            
            if (command === 'magic') {
              setTimeout(() => {
                setIsFloatingMessages(true);
                setTimeout(() => setIsFloatingMessages(false), 2500);
              }, 2000);
            }
            }
                  }
        
        // Skip our own messages to prevent optimistic replacement
        if (message.sender_handle === currentUserHandle) {
          return;
        }
        
        setMessages(prev => {
          const existingMessage = prev.find(m => m.id === message.id);
          if (existingMessage) return prev;
        
          // Add new message and sort in ascending order (oldest first, newest last)
          const newMessages = [...prev, { ...message, isOptimistic: false }].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          return newMessages;
        });
        
        setTimeout(() => messagesRef.current?.scrollToBottom(), 100);
          markAsRead(parseInt(conversationId), message.id);
          
          if (paymentStatus?.has_paid) {
          setTimeout(() => loadPaymentStatus(), 500);
          }
        }
      };

      const handleMessageRead = (data: any) => {
        if (data.conversationId === parseInt(conversationId)) {
        setMessages(prev => 
          prev.map(msg => 
              msg.id === data.messageId 
              ? { ...msg, is_read: true }
              : msg
          )
        );
      }
    };

    setMessageHandlers(handleNewMessage, handleMessageRead);

    if (conversationId) {
      joinConversation(parseInt(conversationId));
    }

    return () => {
      if (conversationId) {
        leaveConversation(parseInt(conversationId));
      }
      setMessageHandlers(undefined, undefined);
    };
  }, [conversationId, currentUserHandle, paymentStatus?.has_paid]);

  // Load messages on mount
  useEffect(() => {
    if (conversationId && currentUserHandle) {
      loadMessages();
      markAllMessagesAsRead(conversationId);
    }
  }, [conversationId, currentUserHandle]);

  // Payment status and online status refresh
  useEffect(() => {
    if (otherUserHandle && currentUserHandle && otherUserHandle !== currentUserHandle) {
      loadPaymentStatus();
      loadOnlineStatus();
    }
  }, [otherUserHandle, currentUserHandle]);

  // Payment timer
  useEffect(() => {
    if (paymentStatus?.payment_info?.payment_deadline) {
      const updateTimer = () => {
        const remaining = calculateTimeRemaining(paymentStatus.payment_info.payment_deadline);
        setTimeRemaining(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus?.payment_info?.payment_deadline]);

  // Load messages function
  const loadMessages = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      const result = await fetchMessages(conversationId, page);
      
      if (result.success) {
        // Sort messages in ascending order (oldest first, newest last) for proper conversation flow
        const sortedMessages = result.messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
        setParticipants(result.participants);
        setHasMore(result.pagination.page < result.pagination.totalPages);
        
        // Set other user info
        const otherUser = result.participants.otherUser;
        setConversationTitle(otherUser.handle);
        setConversationAvatar(otherUser.avatar);
        setOtherUserHandle(otherUser.handle);
        
        // Check if user is blocked
        const blockStatus = await checkUserBlockStatus(otherUser.handle);
        if (blockStatus.success) {
          setIsUserBlocked(blockStatus.isBlocked);
        }
        
        setTimeout(() => messagesRef.current?.scrollToBottom(true), 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Load payment status
  const loadPaymentStatus = async () => {
    if (!otherUserHandle) return;
    
    setIsLoadingPaymentStatus(true);
    try {
      const status = await checkDMPaymentStatus(otherUserHandle);
      setPaymentStatus(status);
    } catch (error) {
      console.error('Error loading payment status:', error);
    } finally {
      setIsLoadingPaymentStatus(false);
    }
  };

  // Load online status
  const loadOnlineStatus = async () => {
    if (!otherUserHandle) return;
    
    try {
      const status = await checkOnlineStatus(otherUserHandle);
      if (status) {
        setIsOtherUserOnline(status.is_online);
      }
    } catch (error) {
      console.error('Error loading online status:', error);
    }
  };

  // Calculate time remaining
  const calculateTimeRemaining = (deadline: string): string => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();

    if (diffMs <= 0) return '0h 0m';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m`;
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!messageText.trim() && !uploadedMedia) return;
    if (!conversationId) return;

    const messageToSend = messageText.trim();
    const userAvatar = localStorage.getItem('dapps_user_avatar');
    const avatarUrl = userAvatar ? `https://img.dapps.co/avatar/${userAvatar}.svg` : 'https://img.dapps.co/avatar/default.svg';
        
    // 🎯 Check if this is a special command and trigger animation immediately for sender
    if (isSpecialCommand(messageToSend)) {
      const command = extractCommand(messageToSend);
          if (command) {
              const effectType = getEffectType(command);
              setCurrentEffect(effectType);
        
        if (command === 'magic') {
        setTimeout(() => {
            setIsFloatingMessages(true);
            setTimeout(() => setIsFloatingMessages(false), 2500);
          }, 2000);
        }
      }
    }

    // Create optimistic message
    const optimisticMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: currentUserId,
        sender_handle: currentUserHandle,
      sender_avatar: avatarUrl,
      message_content: messageToSend,
      xmtp_message_id: '',
        message_type: 'text',
        is_read: false,
        created_at: new Date().toISOString(),
      isOptimistic: true,
        sender: {
        id: currentUserId,
          handle: currentUserHandle,
        avatar: avatarUrl
      }
    };

    // Add optimistic message (sorted in ascending order - oldest first, newest last)
    setMessages(prev => [...prev, optimisticMessage].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));
    setMessageText('');
    setUploadedMedia(null);
    setReplyingTo(null);
    setSending(true);

    setTimeout(() => messagesRef.current?.scrollToBottom(), 50);

    try {
      const result = await sendMessage(conversationId, messageToSend, replyingTo?.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      if (paymentStatus?.has_paid) {
        setTimeout(() => loadPaymentStatus(), 500);
          }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restore message text
      setMessageText(messageToSend);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      if (errorMessage.includes('You cannot initiate a conversation with this user')) {
        toast.error('🚫 You cannot message this user');
        } else {
        toast.error(errorMessage);
      }
    } finally {
      setSending(false);
    }
  };
        
  // Handle emoji click
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    setMessageText(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
    messageInputRef.current?.focus();
  };

  // Handle media upload
  const handleMediaUploaded = (media: MediaUploadResponse) => {
    setUploadedMedia(media);
    setIsMediaPopoverOpen(false);
    toast.success('Media uploaded successfully');
  };

  // Handle reply to message
  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  // Handle reply click
  const handleReplyClick = (replyToMessageId: number) => {
    messagesRef.current?.scrollToMessage(replyToMessageId);
  };

  // Handle block user
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

  // Handle unblock user
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

  // Special command click handler
  const handleSpecialCommandClick = async (command: SpecialCommand) => {
    if (!conversationId) return;

    const effectType = getEffectType(command);
    setCurrentEffect(effectType);
    
    if (command === 'magic') {
      setTimeout(() => {
        setIsFloatingMessages(true);
        setTimeout(() => setIsFloatingMessages(false), 2500);
      }, 2000);
    }
    
    // Send the command message directly without setting messageText state
    const commandMessage = `/${command}`;
    const userAvatar = localStorage.getItem('dapps_user_avatar');
    const avatarUrl = userAvatar ? `https://img.dapps.co/avatar/${userAvatar}.svg` : 'https://img.dapps.co/avatar/default.svg';

    // Create optimistic message for the command
    const optimisticMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_handle: currentUserHandle,
      sender_avatar: avatarUrl,
      message_content: commandMessage,
      xmtp_message_id: '',
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      sender: {
        id: currentUserId,
        handle: currentUserHandle,
        avatar: avatarUrl
      }
    };

    // Add optimistic message
    setMessages(prev => [...prev, optimisticMessage].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));

    setTimeout(() => messagesRef.current?.scrollToBottom(), 50);

    try {
      const result = await sendMessage(conversationId, commandMessage);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send command');
      }
    } catch (error) {
      console.error('Error sending special command:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  // Load more messages
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  if (!conversationId) {
    return <div>Invalid conversation</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 mobile-conversation-container" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Header */}
      <ConversationHeader
        conversationTitle={conversationTitle}
        conversationAvatar={conversationAvatar}
        isOtherUserOnline={isOtherUserOnline}
        otherUserHandle={otherUserHandle}
        isUserBlocked={isUserBlocked}
        onBack={handleBack}
        onBlockUser={() => setIsBlockModalOpen(true)}
        onUnblockUser={handleUnblockUser}
      />

      {/* Content container with proper spacing for fixed mobile header */}
      <div className="flex flex-col flex-1 md:mt-0 mt-[140px]">
        {/* Payment Status Banner */}
        {paymentStatus?.has_paid && (
          <PaymentStatusBanner
            paymentStatus={paymentStatus}
            timeRemaining={timeRemaining}
          />
        )}
            
        {/* Messages */}
        <ConversationMessages
          ref={messagesRef}
          messages={messages}
          loading={loading}
          hasMore={hasMore}
          currentUserHandle={currentUserHandle}
          replyingTo={replyingTo}
          isFloatingMessages={isFloatingMessages}
          messageRefs={messageRefs}
          onReplyToMessage={handleReplyToMessage}
                    onReplyClick={handleReplyClick}
          onSpecialCommandClick={handleSpecialCommandClick}
          onLoadMore={handleLoadMore}
        />

        {/* Input Area or Blocked Interface */}
      {isUserBlocked ? (
          <BlockedUserInterface
            otherUserHandle={otherUserHandle}
            isBlocking={isBlocking}
            onUnblockUser={handleUnblockUser}
          />
      ) : (
          <MessageInput
            ref={messageInputRef}
            messageText={messageText}
            sending={sending}
            replyingTo={replyingTo}
            uploadedMedia={uploadedMedia}
            isEmojiPickerOpen={isEmojiPickerOpen}
            isMediaPopoverOpen={isMediaPopoverOpen}
            onMessageTextChange={setMessageText}
            onSendMessage={handleSendMessage}
            onEmojiClick={handleEmojiClick}
                  onMediaUploaded={handleMediaUploaded}
            onRemoveMedia={removeMedia}
            onCancelReply={cancelReply}
            onSetEmojiPickerOpen={setIsEmojiPickerOpen}
            onSetMediaPopoverOpen={setIsMediaPopoverOpen}
            onFileUpload={handleFileUpload}
            onTyping={handleTyping}
          />
              )}
        </div>
      
      {/* Modals */}
      <ConversationModals
        isBlockModalOpen={isBlockModalOpen}
        otherUserHandle={otherUserHandle}
        isBlocking={isBlocking}
        onSetBlockModalOpen={setIsBlockModalOpen}
        onBlockUser={handleBlockUser}
      />
      
      {/* Special Effects */}
      <SpecialEffects 
        effect={currentEffect} 
        onComplete={handleEffectComplete} 
      />
    </div>
  );
};

export default ConversationPage; 