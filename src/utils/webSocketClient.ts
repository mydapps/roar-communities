import { getChatKey } from './messagingApi';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private chatKey: string | null = null;
  private currentConversationId: number | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-connect when client is created
    this.connect();
  }

  async connect() {
    try {
      // Disconnect existing connection first
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      // Get chat key (from localStorage or generate new one)
      this.chatKey = await getChatKey();
      if (!this.chatKey) {
        console.error('❌ Failed to get chat key for WebSocket connection');
        return;
      }

      // Use /api/ws for both development and production (proxy handles routing)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws?chat_key=${this.chatKey}`;
      
      console.log('🔗 Connecting to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send ping to maintain connection
        this.sendPing();
        
        // Join current conversation if we have one
        if (this.currentConversationId) {
          this.joinConversation(this.currentConversationId);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnected = false;
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.handleReconnect();
      };

    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
      this.handleReconnect();
    }
  }

  private handleMessage(data: WebSocketMessage) {
    console.log('📨 WebSocket message received:', data);
    
    switch (data.type) {
      case 'connected':
        console.log('✅ WebSocket connection established for user:', data.userId);
        break;
      case 'pong':
        // Connection is alive
        break;
      case 'new_message':
        console.log('📨 New message via WebSocket:', data);
        this.onNewMessage?.(data.message || data);
        break;
      case 'message_read':
        console.log('✅ Message read via WebSocket:', data);
        this.onMessageRead?.(data);
        break;
      case 'conversation_joined':
        console.log('✅ Joined conversation:', data.conversationId);
        break;
      case 'error':
        console.error('❌ WebSocket error from server:', data.error);
        break;
      default:
        console.log('📨 Unknown WebSocket message type:', data.type, data);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      
      console.log(`🔄 Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max WebSocket reconnection attempts reached');
    }
  }

  private sendMessage(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      console.error('❌ WebSocket not connected, cannot send message');
      return false;
    }
  }

  // Public methods
  sendPing() {
    return this.sendMessage({ type: 'ping' });
  }

  joinConversation(conversationId: number) {
    this.currentConversationId = conversationId;
    return this.sendMessage({
      type: 'join_conversation',
      conversationId: conversationId
    });
  }

  leaveConversation(conversationId: number) {
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
    return this.sendMessage({
      type: 'leave_conversation',
      conversationId: conversationId
    });
  }

  sendChatMessage(conversationId: number, content: string, replyToMessageId?: number) {
    return this.sendMessage({
      type: 'send_message',
      conversationId: conversationId,
      content: content,
      replyToMessageId: replyToMessageId || null
    });
  }

  markMessageAsRead(messageId: number, conversationId: number) {
    return this.sendMessage({
      type: 'mark_read',
      messageId: messageId,
      conversationId: conversationId
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  // Event handlers (set these from your components)
  onNewMessage?: (message: any) => void;
  onMessageRead?: (data: any) => void;
}

export const webSocketClient = new WebSocketClient(); 