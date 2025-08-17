# Server-Sent Events (SSE) Integration Guide

## Why SSE Instead of WebSocket?

Server-Sent Events (SSE) is much simpler and more reliable than WebSocket for real-time messaging:

✅ **No authentication issues** - Uses regular HTTP with cookies  
✅ **Automatic reconnection** - Built into the browser  
✅ **Simpler implementation** - Just HTTP requests  
✅ **Better error handling** - Standard HTTP error codes  
✅ **Works with proxies** - No special proxy configuration needed  

## Backend Endpoints

### Real-time Connection
```
GET /sse/messages
```
- Establishes SSE connection for real-time updates
- Uses cookie authentication (dapps_session)
- Automatically handles reconnection

### Additional Endpoints
```
POST /sse/typing          - Send typing indicators
POST /sse/mark-read       - Mark messages as read
GET  /sse/status          - Check connection status (debug)
```

## Frontend Integration

### 1. Basic SSE Connection

```typescript
// utils/sseClient.ts
class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    const url = `${process.env.REACT_APP_API_URL}/sse/messages`;
    
    this.eventSource = new EventSource(url, {
      withCredentials: true // Important for cookie auth
    });

    this.eventSource.onopen = () => {
      console.log('SSE connected');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.handleReconnect();
    };
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'connection_established':
        console.log('SSE connection established for user:', data.userId);
        break;
      case 'new_message':
        this.onNewMessage?.(data.message);
        break;
      case 'message_read':
        this.onMessageRead?.(data);
        break;
      case 'user_typing':
        this.onUserTyping?.(data);
        break;
      case 'heartbeat':
        // Connection is alive
        break;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting SSE (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Event handlers (set these from your components)
  onNewMessage?: (message: any) => void;
  onMessageRead?: (data: any) => void;
  onUserTyping?: (data: any) => void;
}

export const sseClient = new SSEClient();
```

### 2. React Hook for SSE

```typescript
// hooks/useSSE.ts
import { useEffect, useCallback } from 'react';
import { sseClient } from '../utils/sseClient';

export function useSSE() {
  const connect = useCallback(() => {
    sseClient.connect();
  }, []);

  const disconnect = useCallback(() => {
    sseClient.disconnect();
  }, []);

  const sendTyping = useCallback(async (conversationId: number, isTyping: boolean) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/sse/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ conversationId, isTyping })
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: number, messageId: number) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/sse/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ conversationId, messageId })
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  useEffect(() => {
    // Auto-connect when hook is used
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
    sendTyping,
    markAsRead
  };
}
```

### 3. Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  // ... other config
  server: {
    proxy: {
      '/sse': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        // Important for SSE
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward cookies for authentication
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
          });
        }
      }
    }
  }
});
```

## Testing SSE Connection

### Browser Console Test

```javascript
// Test SSE connection in browser console
const eventSource = new EventSource('http://localhost:3003/sse/messages', {
  withCredentials: true
});

eventSource.onopen = () => console.log('SSE connected');
eventSource.onmessage = (event) => console.log('SSE message:', JSON.parse(event.data));
eventSource.onerror = (error) => console.error('SSE error:', error);

// Close when done testing
// eventSource.close();
```

## Advantages Over WebSocket

1. **No Authentication Issues**: Uses standard HTTP cookies
2. **Automatic Reconnection**: Built into EventSource API
3. **Simpler Error Handling**: Standard HTTP status codes
4. **Better Proxy Support**: Works with standard HTTP proxies
5. **Easier Debugging**: Can see requests in Network tab
6. **Less Complex**: No need for custom connection management

## Alternative Options

If you still want other alternatives to WebSocket:

### Option 2: Polling with Smart Intervals
- Simple HTTP requests every few seconds
- Increase interval when no activity
- Very reliable, works everywhere

### Option 3: Long Polling
- HTTP request that waits for new data
- Server holds connection until new message
- Falls back gracefully

### Option 4: Push Notifications
- For mobile apps and PWAs
- Works even when app is closed
- Good for important messages

**Recommendation: Start with SSE - it's the perfect middle ground between WebSocket complexity and polling inefficiency.** 