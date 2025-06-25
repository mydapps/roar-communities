import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Message, DMPaymentStatusResponse, OnlineStatusResponse } from '@/utils/messagingApi';
import { SpecialCommand, EffectType } from '@/utils/specialCommands';
import { MediaUploadResponse } from '@/components/ui/media-upload';

export const useConversationState = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [conversationTitle, setConversationTitle] = useState('Unknown User');
  const [conversationAvatar, setConversationAvatar] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // UI state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isMediaPopoverOpen, setIsMediaPopoverOpen] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // User state
  const [currentUserHandle, setCurrentUserHandle] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [otherUserHandle, setOtherUserHandle] = useState<string>('');
  
  // Blocking state
  const [isUserBlocked, setIsUserBlocked] = useState<boolean>(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [isBlocking, setIsBlocking] = useState<boolean>(false);
  
  // Payment state
  const [paymentStatus, setPaymentStatus] = useState<DMPaymentStatusResponse | null>(null);
  const [isLoadingPaymentStatus, setIsLoadingPaymentStatus] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Effects state
  const [currentEffect, setCurrentEffect] = useState<EffectType | null>(null);
  const [isFloatingMessages, setIsFloatingMessages] = useState<boolean>(false);
  
  // Online status
  const [isOtherUserOnline, setIsOtherUserOnline] = useState<boolean>(false);
  
  // Refs
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize user data
  useEffect(() => {
    const userHandle = localStorage.getItem('dapps_user_handle');
    const userId = localStorage.getItem('dapps_user_id');
    setCurrentUserHandle(userHandle || '');
    setCurrentUserId(parseInt(userId || '0'));
  }, []);
  
  // Handle location state
  useEffect(() => {
    if (location.state?.otherUser) {
      setConversationTitle(location.state.otherUser.handle);
      setConversationAvatar(location.state.otherUser.avatar);
      setOtherUserHandle(location.state.otherUser.handle);
    }
  }, [location.state]);
  
  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  const handleBack = useCallback(() => {
    navigate('/messages');
  }, [navigate]);
  
  const handleTyping = useCallback(() => {
    // Typing indicators have been removed from the SSE implementation
    // This function is kept for compatibility but does nothing
  }, []);
  
  const handleEffectComplete = useCallback(() => {
    setCurrentEffect(null);
  }, []);
  
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);
  
  const removeMedia = useCallback(() => {
    setUploadedMedia(null);
  }, []);
  
  return {
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
    
    // Refs
    messageRefs,
    typingTimeoutRef,
    
    // Handlers
    handleBack,
    handleTyping,
    handleEffectComplete,
    cancelReply,
    removeMedia,
  };
}; 