import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Loader2, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from '@/components/messages/MessageBubble';
import SpecialCommandBubble from '@/components/messages/SpecialCommandBubble';
import { Message } from '@/utils/messagingApi';
import { isSpecialCommand, extractCommand, type SpecialCommand } from '@/utils/specialCommands';

interface ConversationMessagesProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  currentUserHandle: string;
  replyingTo: Message | null;
  isFloatingMessages: boolean;
  messageRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  onReplyToMessage: (message: Message) => void;
  onReplyClick: (messageId: number) => void;
  onSpecialCommandClick: (command: SpecialCommand) => void;
  onLoadMore: () => void;
  isMobile?: boolean;
}

export interface ConversationMessagesRef {
  scrollToBottom: (force?: boolean) => void;
  scrollToMessage: (messageId: number) => void;
}

const ConversationMessages = forwardRef<ConversationMessagesRef, ConversationMessagesProps>(({
  messages,
  loading,
  hasMore,
  currentUserHandle,
  replyingTo,
  isFloatingMessages,
  messageRefs,
  onReplyToMessage,
  onReplyClick,
  onSpecialCommandClick,
  onLoadMore,
  isMobile = false,
}, ref) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (force = false) => {
    if (isMobile) {
      // On mobile, scrolling is handled by the parent container
      // This function shouldn't be called directly on mobile
      return;
    }
    
    if (messagesEndRef.current) {
      // For desktop, use scrollIntoView
      const behavior = force ? 'auto' : 'smooth';
      messagesEndRef.current.scrollIntoView({ 
        behavior, 
        block: 'end',
        inline: 'nearest'
      });
      
      // Additional scroll attempt for desktop timing issues
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'auto', 
            block: 'end' 
          });
        }
      }, 50);
    }
  };

  const scrollToMessage = (messageId: number) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
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

  useImperativeHandle(ref, () => ({
    scrollToBottom,
    scrollToMessage,
  }));

  // Intersection Observer for loading more messages
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const container = messagesContainerRef.current;
    if (container && hasMore) {
      observer.observe(container.firstElementChild as Element);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Mobile layout - no nested scroll container
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Load more indicator */}
        {hasMore && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more messages...</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isFromCurrentUser = message.sender?.handle === currentUserHandle;
            const showAvatar = !isFromCurrentUser && (
              index === 0 || 
              messages[index - 1]?.sender?.handle !== message.sender?.handle
            );

            return (
              <motion.div
                key={`${message.id}-${message.isOptimistic ? 'optimistic' : 'confirmed'}`}
                ref={(el) => {
                  if (el && message.id) {
                    messageRefs.current.set(message.id, el);
                  }
                }}
                data-message-id={message.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="message-container"
              >


                {isSpecialCommand(message.message_content) ? (
                  <SpecialCommandBubble
                    message={message.message_content}
                    isOwn={isFromCurrentUser}
                    onClick={(command: SpecialCommand) => onSpecialCommandClick(command)}
                  />
                ) : (
                  <MessageBubble
                    message={message}
                    isOwn={isFromCurrentUser}
                    currentUserId={message.sender_id}
                    showAvatar={showAvatar}
                    onReply={onReplyToMessage}
                    onReplyClick={onReplyClick}
                    replyToMessage={message.reply_to}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>



        {/* Loading indicator for sending */}
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Loading conversation...</span>
            </div>
          </div>
        )}

        {/* Mobile scroll anchor - positioned at the very bottom */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    );
  }

  // Desktop layout - with scroll container
  return (
    <div className="h-full">
      <div
        ref={messagesContainerRef}
        className={`h-full overflow-y-auto p-4 space-y-4 ${
          isFloatingMessages ? 'floating-messages' : ''
        }`}
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more messages...</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isFromCurrentUser = message.sender?.handle === currentUserHandle;
            const showAvatar = !isFromCurrentUser && (
              index === 0 || 
              messages[index - 1]?.sender?.handle !== message.sender?.handle
            );

            return (
              <motion.div
                key={`${message.id}-${message.isOptimistic ? 'optimistic' : 'confirmed'}`}
                ref={(el) => {
                  if (el && message.id) {
                    messageRefs.current.set(message.id, el);
                  }
                }}
                data-message-id={message.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="message-container"
              >


                {isSpecialCommand(message.message_content) ? (
                  <SpecialCommandBubble
                    message={message.message_content}
                    isOwn={isFromCurrentUser}
                    onClick={(command: SpecialCommand) => onSpecialCommandClick(command)}
                  />
                ) : (
                  <MessageBubble
                    message={message}
                    isOwn={isFromCurrentUser}
                    currentUserId={message.sender_id}
                    showAvatar={showAvatar}
                    onReply={onReplyToMessage}
                    onReplyClick={onReplyClick}
                    replyToMessage={message.reply_to}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>



        {/* Loading indicator for sending */}
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Loading conversation...</span>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

ConversationMessages.displayName = 'ConversationMessages';

export default ConversationMessages; 