class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;

  constructor() {
    // Auto-connect when client is created
    this.connect();
  }

  connect() {
    // Disconnect existing connection first
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const isDev = import.meta.env.DEV;
    
    // In development, use Vite proxy; in production, connect directly to API
    const baseUrl = isDev 
      ? '/api/sse/messages'  // Will be proxied by Vite
      : `${import.meta.env.VITE_API_URL || 'https://api.dapps.co'}/api/sse/messages`;
    
    // Add cache-busting parameter to ensure fresh connection
    const url = `${baseUrl}?t=${Date.now()}`;
    
    console.log('🔗 Connecting to SSE:', url, { isDev });
    
    this.eventSource = new EventSource(url, {
      withCredentials: true // Important for cookie auth
    });

    this.eventSource.onopen = () => {
      console.log('✅ SSE connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ SSE error:', error);
      this.isConnected = false;
      this.handleReconnect();
    };
  }

  private handleMessage(data: any) {
    console.log('📨 SSE message received:', data);
    
    switch (data.type) {
      case 'connection_established':
        console.log('✅ SSE connection established for user:', data.userId);
        break;
      case 'new_message':
        console.log('📨 New message via SSE:', data);
        this.onNewMessage?.(data.message || data);
        break;
      case 'message_read':
        console.log('✅ Message read via SSE:', data);
        this.onMessageRead?.(data);
        break;
      case 'heartbeat':
        // Connection is alive
        break;
      default:
        console.log('📨 Unknown SSE message type:', data.type, data);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`🔄 Reconnecting SSE (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
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

export const sseClient = new SSEClient(); 