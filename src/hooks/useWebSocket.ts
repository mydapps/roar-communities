import { useCallback, useEffect } from 'react';
import { webSocketClient } from '../utils/webSocketClient';

export function useWebSocket() {
  const connect = useCallback(async () => {
    try {
      console.log('🔗 Initiating WebSocket connection');
      await webSocketClient.connect();
    } catch (error) {
      console.error('❌ Error connecting WebSocket:', error);
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: number, messageId: number) => {
    try {
      console.log('📖 Marking message as read via WebSocket:', { conversationId, messageId });
      
      // Use WebSocket to mark message as read
      const success = webSocketClient.markMessageAsRead(messageId, conversationId);
      
      if (!success) {
        console.error('❌ Failed to send mark-as-read via WebSocket');
      }
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }, []);

  const joinConversation = useCallback((conversationId: number) => {
    console.log('🔗 Joining conversation via WebSocket:', conversationId);
    return webSocketClient.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    console.log('🔌 Leaving conversation via WebSocket:', conversationId);
    return webSocketClient.leaveConversation(conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: number, content: string, replyToMessageId?: number) => {
    console.log('📤 Sending message via WebSocket:', { conversationId, content, replyToMessageId });
    return webSocketClient.sendChatMessage(conversationId, content, replyToMessageId);
  }, []);

  const getConnectionStatus = useCallback(() => {
    return webSocketClient.getConnectionStatus();
  }, []);

  // Setup message handlers
  const setMessageHandlers = useCallback((
    onNewMessage?: (message: any) => void,
    onMessageRead?: (data: any) => void
  ) => {
    webSocketClient.onNewMessage = onNewMessage;
    webSocketClient.onMessageRead = onMessageRead;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect WebSocket when component unmounts
      // as it should persist across page navigation
    };
  }, []);

  return {
    connect,
    markAsRead,
    joinConversation,
    leaveConversation,
    sendMessage,
    getConnectionStatus,
    setMessageHandlers
  };
} 