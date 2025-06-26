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
}, ref) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: force ? 'auto' : 'smooth' });
    }
  };

  const scrollToMessage = (messageId: number) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement && messagesContainerRef.current) {
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

  return (
    <div className="flex-1 overflow-hidden">
      <div
        ref={messagesContainerRef}
        className={`h-full overflow-y-auto p-4 space-y-4 mobile-messages-container ${
          isFloatingMessages ? 'floating-messages' : ''
        }`}
        style={{
          scrollBehavior: 'smooth',
          paddingBottom: '120px' // Extra space for mobile input
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
                {/* Reply indicator */}
                {message.reply_to && (
                  <div className="mb-2 ml-12">
                    <button
                      onClick={() => onReplyClick(message.reply_to!.id)}
                      className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <Reply className="h-3 w-3" />
                      <span>Replying to message</span>
                    </button>
                  </div>
                )}

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
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Reply preview */}
        {replyingTo && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky bottom-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mx-4"
          >
            <div className="flex items-center space-x-2 text-sm">
              <Reply className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 font-medium">
                Replying to {replyingTo.sender?.handle}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 truncate">
              {replyingTo.message_content}
            </p>
          </motion.div>
        )}

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