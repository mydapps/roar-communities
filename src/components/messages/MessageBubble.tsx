import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Eye, CheckCircle2, Play, Reply, MoreHorizontal, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useImageViewer } from '@/components/contexts/ImageViewerContext';
import { type Message, type ReplyToMessage } from '@/utils/messagingApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId: number;
  onReply?: (message: Message) => void;
  onReplyClick?: (messageId: number) => void;
  replyToMessage?: ReplyToMessage | null;
}

const customEmojisConfig = [
    { id: 'angry', names: ['angry'], imgUrl: '/emojis/angry.png' },
    { id: 'bitcoin', names: ['bitcoin'], imgUrl: '/emojis/bitcoin.png' },
    { id: 'cool', names: ['cool'], imgUrl: '/emojis/cool.png' },
    { id: 'ethereum', names: ['ethereum'], imgUrl: '/emojis/ethereum.png' },
    { id: 'happy', names: ['happy'], imgUrl: '/emojis/happy.png' },
    { id: 'mindblown', names: ['mindblown'], imgUrl: '/emojis/mindblown.png' },
    { id: 'party', names: ['party'], imgUrl: '/emojis/party.png' },
    { id: 'sad', names: ['sad'], imgUrl: '/emojis/sad.png' },
    { id: 'scared', names: ['scared'], imgUrl: '/emojis/scared.png' },
    { id: 'sleepy', names: ['sleepy'], imgUrl: '/emojis/sleepy.png' },
    { id: 'solana', names: ['solana'], imgUrl: '/emojis/solana.png' },
    { id: 'thinking', names: ['thinking'], imgUrl: '/emojis/thinking.png' },
    { id: 'angelic', names: ['angelic'], imgUrl: '/emojis/angelic.png' },
    { id: 'devilish', names: ['devilish'], imgUrl: '/emojis/devilish.png' },
    { id: 'inlove', names: ['inlove'], imgUrl: '/emojis/inlove.png' },
    { id: 'pleading', names: ['pleading'], imgUrl: '/emojis/pleading.png' },
    { id: 'surprised', names: ['surprised'], imgUrl: '/emojis/surprised.png' },
];

const emojiMap = new Map(customEmojisConfig.map(emoji => [ `:${emoji.id}:` , emoji.imgUrl]));

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  onReply,
  onReplyClick,
  replyToMessage,
}) => {
  const imageViewerContext = useImageViewer();
  const { openImageViewer } = imageViewerContext;
  const navigate = useNavigate();
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const renderMessageStatus = () => {
    if (!isOwn) return null;

    // Show "Sending..." for optimistic messages
    if (message.isOptimistic) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-1 text-gray-400"
        >
          <div className="animate-pulse">
            <CheckCircle2 className="h-3 w-3" />
          </div>
          <span className="text-xs">Sending...</span>
        </motion.div>
      );
    }

    if (message.is_read) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-1 text-green-500"
        >
          <Eye className="h-3 w-3" />
          <span className="text-xs">Seen</span>
        </motion.div>
      );
    } else {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-1 text-blue-500"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span className="text-xs">Sent</span>
        </motion.div>
      );
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const renderContentWithEmojis = (text: string) => {
    const parts = text.split(/(:[a-z_]+:)/g);
    return parts.map((part, index) => {
      if (emojiMap.has(part)) {
        return <img key={index} src={emojiMap.get(part)} alt={part} className="inline-block h-5 w-5 mx-0.5" />;
      }
      return part;
    });
  };

  // New function to render clickable mentions and community links
  const renderTextWithMentions = (text: string) => {
    // Combined regex for @mentions and /c/community patterns
    const mentionRegex = /(@[a-zA-Z0-9_-]+)|(?:^|\s)(\/c\/[a-zA-Z0-9_-]+)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Handle @username mentions
      if (part.startsWith('@')) {
        const username = part.slice(1); // Remove @ symbol
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/u/${username}`);
            }}
            className={`inline font-medium hover:underline transition-colors ${
              isOwn 
                ? 'text-blue-100 hover:text-white' 
                : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {part}
          </button>
        );
      }

      // Handle /c/community links
      if (part.startsWith('/c/')) {
        const communityName = part.slice(3); // Remove /c/ prefix
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/c/${communityName}`);
            }}
            className={`inline font-medium hover:underline transition-colors ${
              isOwn 
                ? 'text-green-100 hover:text-white' 
                : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {part}
          </button>
        );
      }

      // Process emojis in regular text parts
      return <span key={index}>{renderContentWithEmojis(part)}</span>;
    });
  };

  const detectAndRenderMedia = (content: string | undefined | null) => {
    if (!content) {
      return <p className="text-sm leading-relaxed break-words text-gray-500 italic">No content</p>;
    }
    
    const imageRegex = /!\[\]\((https?:\/\/img\.dapps\.co\/[^)]+\.(?:png|jpg|jpeg|gif|webp|svg))\)/g;
    const videoRegex = /!\[video\]\((https?:\/\/img\.dapps\.co\/[^)]+\.(?:mp4|webm|mov))\)/g;

    const parts = content.split(/(!\[(?:video)?\]\((?:https?:\/\/img\.dapps\.co\/[^)]+)\))/g);

    return (
      <div className="space-y-2">
        {parts.map((part, index) => {
          if (!part) return null;

          const imageMatch = imageRegex.exec(part); 
          if (imageMatch) {
            const url = imageMatch[1];
            return (
              <div 
                key={index} 
                className="relative"
                data-media-container="true"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  try {
                    openImageViewer([url], 0);
                  } catch (error) {
                    console.error('Error opening ImageViewer:', error);
                  }
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  try {
                    openImageViewer([url], 0);
                  } catch (error) {
                    console.error('Error opening ImageViewer:', error);
                  }
                }}
                style={{ 
                  touchAction: 'manipulation',
                  cursor: 'pointer',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                <img
                  src={url}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg hover:opacity-90 transition-opacity pointer-events-none"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            );
          }

          const videoMatch = videoRegex.exec(part);
          if (videoMatch) {
            const url = videoMatch[1];
            return (
              <div 
                key={index} 
                className="relative"
                data-media-container="true"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setSelectedVideoUrl(url);
                  setShowVideoDialog(true);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  // Store the touch start to ensure it's a tap, not a scroll
                  (e.currentTarget as any).touchStartTime = Date.now();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // Only trigger if it's a quick tap (not a long press or scroll)
                  const touchStartTime = (e.currentTarget as any).touchStartTime;
                  const touchDuration = Date.now() - (touchStartTime || 0);
                  
                  if (touchDuration < 500) { // Less than 500ms = tap
                    setSelectedVideoUrl(url);
                    setShowVideoDialog(true);
                  }
                }}
                style={{ 
                  touchAction: 'manipulation',
                  cursor: 'pointer',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                <div className="relative pointer-events-none">
                  <video
                    src={url}
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '200px' }}
                    controls={false}
                    poster={`${url}?poster=true`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg hover:bg-opacity-40 transition-all">
                    <div className="bg-white bg-opacity-80 rounded-full p-3">
                      <Play className="h-6 w-6 text-black" />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (part.trim()) {
            return <p key={index} className="text-sm leading-relaxed break-words">{renderTextWithMentions(part)}</p>;
          }
          
          return null;
        })}
      </div>
    );
  };

  const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default only for mouse events to avoid conflicts
    if (e.type === 'mousedown') {
      e.preventDefault();
    }
    
    const timer = setTimeout(() => {
      setShowActions(true);
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 25, 50]); // More noticeable vibration pattern
      }
    }, 300); // Reduced to 300ms for better mobile responsiveness
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
    setShowActions(false);
  };

  const handleCopy = async () => {
    try {
      const textToCopy = message.content || message.message_content || '';
      // Remove markdown patterns for cleaner copy
      const cleanText = textToCopy
        .replace(/!\[\]\(https?:\/\/img\.dapps\.co\/[^)]+\)/g, '[Image]')
        .replace(/!\[video\]\(https?:\/\/img\.dapps\.co\/[^)]+\)/g, '[Video]')
        .trim();
      
      await navigator.clipboard.writeText(cleanText);
      setIsCopied(true);
      toast.success('Message copied to clipboard');
      
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      
      setShowActions(false);
    } catch (error) {
      console.error('Failed to copy message:', error);
      toast.error('Failed to copy message');
    }
  };

  const renderReplyPreview = () => {
    // Use the reply_to from the message itself (from API)
    const replyData = message.reply_to || replyToMessage;
    if (!replyData) return null;

    const replyContent = replyData.content || '';
    const replyAuthor = replyData.sender_handle || 'Unknown';

    // Check if the reply content is an image or video
    const imageRegex = /!\[\]\((https?:\/\/img\.dapps\.co\/[^)]+\.(?:png|jpg|jpeg|gif|webp|svg))\)/;
    const videoRegex = /!\[video\]\((https?:\/\/img\.dapps\.co\/[^)]+\.(?:mp4|webm|mov))\)/;
    
    const imageMatch = replyContent.match(imageRegex);
    const videoMatch = replyContent.match(videoRegex);

    const handleReplyPreviewClick = () => {
      if (onReplyClick && replyData.id) {
        onReplyClick(replyData.id);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className={`mb-2 p-2 rounded-lg border-l-4 cursor-pointer hover:bg-opacity-80 transition-colors ${
          isOwn 
            ? 'bg-white/20 border-white/50 hover:bg-white/30' 
            : 'bg-gray-100 dark:bg-gray-700 border-blue-500 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        onClick={handleReplyPreviewClick}
      >
        <div className="flex items-center space-x-1 mb-1">
          <Reply className="h-3 w-3 text-gray-500 dark:text-gray-300" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
            {replyAuthor}
          </span>
        </div>
        
        {imageMatch ? (
          <div className="flex items-center space-x-2">
            <img 
              src={imageMatch[1]} 
              alt="Reply preview" 
              className="w-8 h-8 rounded object-cover"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">Photo</span>
          </div>
        ) : videoMatch ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
              <Play className="h-3 w-3 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Video</span>
          </div>
        ) : (
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {replyContent.length > 50 ? `${replyContent.substring(0, 50)}...` : replyContent}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}
      onClick={(e) => {
        // Only toggle details if the click is not on media content
        const target = e.target as HTMLElement;
        const isMediaClick = target.closest('[data-media-container="true"]');
        if (!isMediaClick) {
          setShowDetails(!showDetails);
        }
      }}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : 'mr-auto'} relative`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 mobile-message-bubble ${
            isOwn
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-md'
          }`}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            const isMediaClick = target.closest('[data-media-container="true"]');
            if (!isMediaClick) {
              handleLongPressStart(e);
            }
          }}
          onTouchStart={(e) => {
            const target = e.target as HTMLElement;
            const isMediaClick = target.closest('[data-media-container="true"]');
            if (!isMediaClick) {
              handleLongPressStart(e);
            }
          }}
          onMouseUp={(e) => {
            const target = e.target as HTMLElement;
            const isMediaClick = target.closest('[data-media-container="true"]');
            if (!isMediaClick) {
              handleLongPressEnd();
            }
          }}
          onTouchEnd={(e) => {
            const target = e.target as HTMLElement;
            const isMediaClick = target.closest('[data-media-container="true"]');
            if (!isMediaClick) {
              handleLongPressEnd();
            }
          }}
          onMouseLeave={handleLongPressEnd}
          style={{ 
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none' // Prevent iOS callout menu
          }}
        >
          {renderReplyPreview()}
          {detectAndRenderMedia(message.content || message.message_content)}
        </motion.div>

        {/* Quick Actions Button */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute -top-12 ${isOwn ? 'right-0' : 'left-0'} z-[9999]`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-1 flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReply}
                  className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Reply className="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 rounded-full hover:bg-green-100 dark:hover:bg-green-900"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop hover actions */}
        <div className={`absolute top-1/2 transform -translate-y-1/2 ${isOwn ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block`}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1 z-[8888]" side={isOwn ? 'left' : 'right'}>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReply}
                className="w-full justify-start text-left"
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="w-full justify-start text-left"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center space-x-2 mt-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatMessageTime(message.created_at)}
              </span>
              {renderMessageStatus()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setShowActions(false)}
        />
      )}

      {/* Video Dialog - Images now use the global ImageViewer */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          {selectedVideoUrl && (
            <div className="flex items-center justify-center bg-black">
              <video
                src={selectedVideoUrl}
                className="max-w-full max-h-[90vh] object-contain"
                controls
                autoPlay
                playsInline
                onLoadStart={(event) => {
                  // Ensure video can play on mobile
                  const video = event.target as HTMLVideoElement;
                  if (video) {
                    video.muted = true; // Start muted for autoplay policies
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MessageBubble;