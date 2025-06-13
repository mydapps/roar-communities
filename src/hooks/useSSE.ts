import { useCallback } from 'react';
import { sseClient } from '../utils/sseClient';

export function useSSE() {
  const markAsRead = useCallback(async (conversationId: number, messageId: number) => {
    try {
      const isDev = import.meta.env.DEV;
      const url = isDev 
        ? '/api/sse/mark-read'  // Will be proxied by Vite
        : `${import.meta.env.VITE_API_URL || 'https://api.dapps.co'}/api/sse/mark-read`;
        
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ conversationId, messageId })
      });
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }, []);

  const getConnectionStatus = useCallback(() => {
    return sseClient.getConnectionStatus();
  }, []);

  return {
    markAsRead,
    getConnectionStatus
  };
} 