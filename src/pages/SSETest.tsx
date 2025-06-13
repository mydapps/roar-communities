import React, { useState, useCallback, useEffect } from 'react';
import { useSSE } from '../hooks/useSSE';
import { sseClient } from '../utils/sseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchConversations } from '@/utils/messagingApi';

interface SSEMessage {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export const SSETest: React.FC = () => {
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: 'pending' | 'success' | 'error' }>({
    connection: 'pending',
    authentication: 'pending',
    messaging: 'pending'
  });

  const { markAsRead } = useSSE();

  // Set up SSE event handlers
  useEffect(() => {
    // Set up message handlers
    sseClient.onNewMessage = (message) => {
      console.log('📨 SSE Test: New message received:', message);
      setMessages(prev => [...prev, { 
        type: 'new_message', 
        timestamp: new Date().toISOString(),
        ...message 
      }]);
      setTestResults(prev => ({ ...prev, messaging: 'success' }));
    };

    sseClient.onMessageRead = (data) => {
      console.log('✅ SSE Test: Message read:', data);
      setMessages(prev => [...prev, { 
        type: 'message_read', 
        timestamp: new Date().toISOString(),
        ...data 
      }]);
    };

    return () => {
      // Clean up handlers
      sseClient.onNewMessage = undefined;
      sseClient.onMessageRead = undefined;
    };
  }, []);

  // Typing functionality removed - not supported by SSE backend

  const testMarkRead = async () => {
    if (!conversationId) {
      alert('Please select a conversation first');
      return;
    }

    try {
      await markAsRead(parseInt(conversationId), 123);
      setMessages(prev => [...prev, { 
        type: 'mark_read_test_sent', 
        timestamp: new Date().toISOString(),
        conversationId: parseInt(conversationId),
        messageId: 123,
        message: 'Mark as read test sent'
      }]);
    } catch (error) {
      console.error('Error testing mark as read:', error);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const resetTests = () => {
    setTestResults({
      connection: 'pending',
      authentication: 'pending',
      messaging: 'pending'
    });
    setMessages([]);
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await fetchConversations();
      setConversations(response.conversations || []);
      if (response.conversations && response.conversations.length > 0) {
        setConversationId(response.conversations[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Server-Sent Events (SSE) Connection Test</CardTitle>
            <CardDescription>
              Test SSE connection, authentication, and real-time messaging functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <label htmlFor="conversationId" className="text-sm font-medium">Conversation:</label>
                {conversations.length > 0 ? (
                  <Select value={conversationId} onValueChange={setConversationId}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select a conversation" />
                    </SelectTrigger>
                    <SelectContent>
                      {conversations.map((conv) => (
                        <SelectItem key={conv.id} value={conv.id.toString()}>
                          @{conv.other_user?.handle || `User ${conv.other_user?.id}`} (ID: {conv.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="conversationId"
                    value={conversationId}
                    onChange={(e) => setConversationId(e.target.value)}
                    className="w-32"
                    placeholder="Enter ID"
                  />
                )}
                
                <Button onClick={loadConversations} disabled={loadingConversations} size="sm">
                  {loadingConversations ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={testMarkRead} disabled={!conversationId}>
                Test Mark as Read
              </Button>
              <Button onClick={clearMessages} variant="outline">
                Clear Messages
              </Button>
              <Button onClick={resetTests} variant="outline">
                Reset Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSE Messages Log</CardTitle>
            <CardDescription>
              Real-time messages received via Server-Sent Events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages received yet. Select a conversation and start testing!
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {message.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(message, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 