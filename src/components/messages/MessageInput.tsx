import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { Send, Smile, Plus, ImageIcon, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import EmojiPicker, { EmojiClickData, EmojiStyle, Categories } from 'emoji-picker-react';
import { Message } from '@/utils/messagingApi';
import { useDropzone } from 'react-dropzone';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard';
import { isIOSApp } from '@/utils/deviceUtils';

// Custom emoji configuration
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

const emojiPickerCategoryConfig = [
  { category: Categories.SMILEYS_PEOPLE, name: 'Smileys & People' },
  { category: Categories.CUSTOM, name: 'Roar Emojis' },
  { category: Categories.ANIMALS_NATURE, name: 'Animals & Nature' },
  { category: Categories.FOOD_DRINK, name: 'Food & Drink' },
  { category: Categories.ACTIVITIES, name: 'Activities' },
  { category: Categories.TRAVEL_PLACES, name: 'Travel & Places' },
  { category: Categories.OBJECTS, name: 'Objects' },
  { category: Categories.SYMBOLS, name: 'Symbols' },
  { category: Categories.FLAGS, name: 'Flags' },
];

interface MessageInputProps {
  messageText: string;
  sending: boolean;
  replyingTo: Message | null;
  uploadedMedia: MediaUploadResponse | null;
  isEmojiPickerOpen: boolean;
  isMediaPopoverOpen: boolean;
  onMessageTextChange: (value: string) => void;
  onSendMessage: () => void;
  onEmojiClick: (emojiData: EmojiClickData) => void;
  onMediaUploaded: (media: MediaUploadResponse) => void;
  onRemoveMedia: () => void;
  onCancelReply: () => void;
  onSetEmojiPickerOpen: (open: boolean) => void;
  onSetMediaPopoverOpen: (open: boolean) => void;
  onFileUpload: (file: File) => void;
  onTyping: () => void;
}

export interface MessageInputRef {
  focus: () => void;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({
  messageText,
  sending,
  replyingTo,
  uploadedMedia,
  isEmojiPickerOpen,
  isMediaPopoverOpen,
  onMessageTextChange,
  onSendMessage,
  onEmojiClick,
  onMediaUploaded,
  onRemoveMedia,
  onCancelReply,
  onSetEmojiPickerOpen,
  onSetMediaPopoverOpen,
  onFileUpload,
  onTyping,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const isIOS = isIOSApp();
  
  // Mobile keyboard detection
  const { isKeyboardVisible, safeViewportHeight } = useMobileKeyboard(true);
  
  // State for managing input focus and scroll behavior
  const [inputFocused, setInputFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
  }));

  // Handle mobile keyboard appearance
  useEffect(() => {
    if (isMobile && isKeyboardVisible && inputFocused && inputRef.current) {
      // Scroll input into view when keyboard appears
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [isKeyboardVisible, inputFocused, isMobile]);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': [],
    },
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      onSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMessageTextChange(e.target.value);
    onTyping();
  };

  const handleInputFocus = () => {
    setInputFocused(true);
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };

  // Dynamic styling based on mobile keyboard state
  const getContainerStyle = () => {
    if (!isMobile) {
      return {
        position: 'sticky' as const,
        bottom: 0,
        zIndex: 20
      };
    }

    return {
      position: 'fixed' as const,
      bottom: isKeyboardVisible ? '0px' : '0px',
      left: '0px',
      right: '0px',
      zIndex: 30,
      transform: isKeyboardVisible ? 'translateY(0)' : 'translateY(0)',
      transition: 'transform 0.2s ease-in-out',
      ...(isIOS && {
        paddingBottom: isKeyboardVisible ? '0px' : 'env(safe-area-inset-bottom, 0px)'
      })
    };
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`
        p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg 
        border-t border-gray-200 dark:border-gray-700 flex-shrink-0
        ${isMobile ? 'mobile-input-container' : ''}
        ${isKeyboardVisible ? 'keyboard-visible' : ''}
      `}
      style={getContainerStyle()}
    >
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-blue-600 font-medium">
                  Replying to {replyingTo.sender?.handle}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 truncate">
                {replyingTo.message_content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancelReply}
              className="h-6 w-6 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Media Preview */}
      {uploadedMedia && (
        <div className="mb-3">
          <MediaPreview media={uploadedMedia} onRemove={onRemoveMedia} />
        </div>
      )}

      <div className="flex items-center space-x-3">
        <Popover open={isMediaPopoverOpen} onOpenChange={onSetMediaPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px]"
              style={{ touchAction: 'manipulation' }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 z-[9999] shadow-xl border-2" 
            side="top" 
            align="start"
            sideOffset={8}
            collisionPadding={16}
          >
            <div className="grid gap-2">
              <MediaUpload
                onMediaUploaded={onMediaUploaded}
                acceptedTypes="image"
                disabled={!!uploadedMedia}
              >
                <Button 
                  variant="ghost" 
                  className="w-full justify-start min-h-[44px] touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </Button>
              </MediaUpload>
              <MediaUpload
                onMediaUploaded={onMediaUploaded}
                acceptedTypes="video"
                disabled={!!uploadedMedia}
              >
                <Button 
                  variant="ghost" 
                  className="w-full justify-start min-h-[44px] touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
              </MediaUpload>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="flex-1 relative" {...getRootProps()}>
          <input {...getInputProps()} />
          <Input
            ref={inputRef}
            value={messageText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={
              replyingTo 
                ? `Reply to ${replyingTo.sender?.handle}...`
                : isDragActive 
                  ? "Drop the image here..." 
                  : "Type a message..."
            }
            className={`
              pr-12 rounded-full border-gray-300 dark:border-gray-600 
              focus:ring-2 focus:ring-blue-500 dark:bg-gray-800
              ${isMobile ? 'text-base' : 'text-sm'}
              ${isKeyboardVisible ? 'bg-white dark:bg-gray-800' : ''}
            `}
            style={{
              fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
              minHeight: isMobile ? '44px' : '40px'
            }}
          />
          
          {/* Emoji Picker */}
          <Popover open={isEmojiPickerOpen} onOpenChange={onSetEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px]"
                disabled={sending}
                style={{ touchAction: 'manipulation' }}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-full p-0 border-0 shadow-lg z-[9999]" 
              side="top" 
              align="end"
              sideOffset={8}
              collisionPadding={16}
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                autoFocusSearch={false}
                emojiStyle={EmojiStyle.NATIVE}
                height={isMobile && isKeyboardVisible ? 250 : 400}
                customEmojis={customEmojisConfig}
                categories={emojiPickerCategoryConfig}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSendMessage();
            }}
            size="icon"
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg min-h-[44px] min-w-[44px]"
          >
            {sending ? (
              <div className="flex items-center justify-center">
                <svg className="animate-pulse w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput; 