import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Settings, MessageCircle, Search, Sparkles, Zap, Lock, 
    Users, ChevronRight, Clock, Mail, ImageIcon, VideoIcon, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { fetchConversations, checkOnlineStatus, type Conversation, type OnlineStatusResponse, type ConversationsPagination } from '@/utils/messagingApi';
import { useTitle } from '@/hooks/useTitle';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import NewMessageDialog from '@/components/messages/NewMessageDialog';
import MessageSettingsDialog from '@/components/messages/MessageSettingsDialog';
import { tagSession } from '@/utils/inspectlet';

const MessagesPage = () => {
  useTitle('Messages - dapps.co');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<ConversationsPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadConversations(1, true); // Reset on initial load
  }, []);

  const loadConversations = async (page: number = 1, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const response = await fetchConversations(page, 20);
      if (response.success) {
        const newConversations = response.conversations;
        
        if (reset) {
          // Reset conversations for first page
          setConversations(newConversations);
        } else {
          // Append conversations for pagination (avoiding duplicates)
          setConversations(prev => {
            const existingIds = new Set(prev.map(conv => conv.id));
            const uniqueNew = newConversations.filter(conv => !existingIds.has(conv.id));
            return [...prev, ...uniqueNew];
          });
        }
        
        setPagination(response.pagination || null);
        setCurrentPage(page);
        
        // Calculate total unread from all loaded conversations
        const allConversations = reset ? newConversations : [...conversations, ...newConversations];
        setTotalUnread(allConversations.reduce((sum, conv) => sum + conv.unread_count, 0));
        
        // Load online statuses for new conversations
        if (newConversations.length > 0) {
          loadOnlineStatuses(newConversations);
        }

        // Track pagination analytics
        tagSession({
          event: 'messages_pagination',
          action: reset ? 'initial_load' : 'load_more',
          page: page,
          conversations_loaded: newConversations.length,
          total_conversations: response.pagination?.total || 0,
          has_unread: allConversations.some(conv => conv.unread_count > 0),
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreConversations = () => {
    if (pagination && currentPage < pagination.pages && !loadingMore) {
      loadConversations(currentPage + 1, false);
    }
  };

  const loadOnlineStatuses = async (conversations: Conversation[]) => {
    try {
      const statusPromises = conversations.map(async (conv) => {
        const status = await checkOnlineStatus(conv.other_user.handle);
        return {
          handle: conv.other_user.handle,
          isOnline: status?.success ? status.is_online : false
        };
      });

      const results = await Promise.all(statusPromises);
      const statusMap: Record<string, boolean> = {};
      
      results.forEach(result => {
        statusMap[result.handle] = result.isOnline;
      });
      
      setOnlineStatuses(prev => ({ ...prev, ...statusMap }));
      console.log('🟢 Online statuses loaded:', statusMap);
    } catch (error) {
      console.error('Error loading online statuses:', error);
    }
  };

  // Refresh online statuses periodically
  useEffect(() => {
    if (conversations.length > 0) {
      const interval = setInterval(() => {
        loadOnlineStatuses(conversations);
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [conversations]);

  const handleConversationClick = (conversation: Conversation) => {
    // Navigate to individual conversation using internal database ID
    navigate(`/messages/${conversation.id}`);
  };

  const getInitials = (handle: string) => {
    return handle.slice(0, 2).toUpperCase();
  };
  
  const renderLastMessage = (message: string) => {
    const imageRegex = /!\[\]\(https?:\/\/img\.dapps\.co\/[^)]+\)/;
    const videoRegex = /!\[video\]\(https?:\/\/img\.dapps\.co\/[^)]+\)/;

    if (imageRegex.test(message)) {
      return (
        <div className="flex items-center text-muted-foreground">
          <ImageIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Photo</span>
        </div>
      );
    }
    if (videoRegex.test(message)) {
      return (
        <div className="flex items-center text-muted-foreground">
          <VideoIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Video</span>
        </div>
      );
    }
    return <p className="text-sm text-muted-foreground truncate">{message}</p>;
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 200 }}
      >
        <div className="relative">
          <div
            className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full flex items-center justify-center"
          >
            <MessageCircle className="w-16 h-16 text-primary" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-4 mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Your inbox is zen 🧘‍♀️
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Time to break the ice! Start meaningful conversations that could change everything.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center space-x-3 mb-8 p-4 bg-secondary/50 rounded-lg border border-border/50"
      >
        <Lock className="w-5 h-5 text-green-500" />
        <div className="flex items-center space-x-2">
          <img 
            src="/xmtp.png" 
            alt="XMTP" 
            className="w-6 h-6"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-sm font-medium">End-to-end encrypted by XMTP</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button
          onClick={() => setShowNewMessage(true)}
          size="lg"
          className="relative overflow-hidden group"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.05 }}
          />
          <Plus className="w-5 h-5 mr-2 relative z-10" />
          <span className="relative z-10">Start Your First Chat</span>
          <Zap className="w-4 h-4 ml-2 relative z-10 group-hover:animate-pulse" />
        </Button>
        
        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          size="lg"
          className="group"
        >
          <Settings className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Message Settings
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-12 grid grid-cols-3 gap-6 w-full max-w-md"
      >
        {[
          { icon: Users, label: "Ready to Connect", value: "∞" },
          { icon: Zap, label: "Instant Delivery", value: "⚡" },
          { icon: Lock, label: "Privacy First", value: "🔒" }
        ].map((stat, index) => (
          <motion.div
            key={index}
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );

  const ConversationsList = () => (
    <div className="space-y-3">
      <AnimatePresence>
        {conversations.map((conversation, index) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            layout
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/30 group"
              onClick={() => handleConversationClick(conversation)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-background group-hover:ring-primary/30 transition-all">
                      <AvatarImage src={conversation.other_user.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                        {getInitials(conversation.other_user.handle)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator - only show if user is online */}
                    {onlineStatuses[conversation.other_user.handle] && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        @{conversation.other_user.handle}
                      </h3>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1 animate-pulse">
                            {conversation.unread_count}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {(() => {
                            try {
                              // Handle various timestamp formats
                              const timestamp = conversation.last_message_at;
                              if (!timestamp) return 'Unknown';
                              
                              // Parse timestamp - handle both string and number formats
                              const date = new Date(timestamp);
                              
                              // Check if date is valid
                              if (isNaN(date.getTime())) {
                                console.warn('Invalid timestamp:', timestamp);
                                return 'Unknown';
                              }
                              
                              return formatDistanceToNow(date, { addSuffix: true });
                            } catch (error) {
                              console.error('Error formatting timestamp:', error);
                              return 'Unknown';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                    {renderLastMessage(conversation.last_message_preview)}
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center space-y-4 pt-6"
        >
          {/* Pagination Info */}
          <div className="text-sm text-muted-foreground text-center">
            Showing {conversations.length} of {pagination.total} conversations
            {pagination.pages > 1 && (
              <span className="block mt-1">
                Page {pagination.page} of {pagination.pages}
              </span>
            )}
          </div>
          
          {/* Load More Button */}
          {currentPage < pagination.pages && (
            <Button
              onClick={loadMoreConversations}
              variant="outline"
              disabled={loadingMore}
              className="min-w-[140px]"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Load More
                </>
              )}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );

  const handleNewMessageSuccess = (conversationId: string, otherUser: any) => {
    setShowNewMessage(false);
    // Refresh conversations list to ensure proper sorting after new conversation
    loadConversations(1, true);
    navigate(`/messages/${conversationId}`, { state: { otherUser } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b pt-12">
        <motion.h1 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-2xl font-bold flex items-center"
        >
          <MessageCircle className="w-7 h-7 mr-3 text-primary" />
          Messages
          {totalUnread > 0 && (
            <Badge className="ml-3 bg-primary text-primary-foreground animate-pulse">
              {totalUnread}
            </Badge>
          )}
        </motion.h1>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowNewMessage(true)}
            size={isMobile ? "sm" : "default"}
            className="relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <Plus className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">{isMobile ? "New" : "New Message"}</span>
          </Button>
          
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="group"
          >
            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            {!isMobile && <span className="ml-2">Settings</span>}
          </Button>
        </div>
      </header>

      <Separator className="mb-8" />

      {/* Content */}
      {conversations.length === 0 ? <EmptyState /> : <ConversationsList />}

      {/* Dialogs */}
      <NewMessageDialog
        open={showNewMessage}
        onOpenChange={setShowNewMessage}
        onSuccess={handleNewMessageSuccess}
      />
      <MessageSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
};

export default MessagesPage; 