import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { Send, Plus, ImageIcon, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import { Message } from '@/utils/messagingApi';
import { useDropzone } from 'react-dropzone';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard';
import { isIOSApp } from '@/utils/deviceUtils';



interface MessageInputProps {
  messageText: string;
  sending: boolean;
  replyingTo: Message | null;
  uploadedMedia: MediaUploadResponse | null;
  isMediaPopoverOpen: boolean;
  onMessageTextChange: (value: string) => void;
  onSendMessage: () => void;
  onMediaUploaded: (media: MediaUploadResponse) => void;
  onRemoveMedia: () => void;
  onCancelReply: () => void;
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
  isMediaPopoverOpen,
  onMessageTextChange,
  onSendMessage,
  onMediaUploaded,
  onRemoveMedia,
  onCancelReply,
  onSetMediaPopoverOpen,
  onFileUpload,
  onTyping,
}, ref) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const isIOS = isIOSApp();
  
  // Mobile keyboard detection
  const { isKeyboardVisible, keyboardHeight, safeViewportHeight } = useMobileKeyboard(true);
  
  // State for managing input focus and scroll behavior
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(44); // Minimum height

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
  }));

  // Handle mobile keyboard appearance and auto-resize
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

  // Auto-resize on content change
  useEffect(() => {
    if (messageText.trim() === '') {
      // Reset to single line when empty (after sending)
      resetTextareaHeight();
    } else {
      autoResizeTextarea();
    }
  }, [messageText]);

  // Initial auto-resize setup
  useEffect(() => {
    if (inputRef.current) {
      resetTextareaHeight();
    }
  }, []);

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

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      const minHeight = 44;
      const maxHeight = isMobile ? 120 : 100; // Limit max height
      
      // Reset height to measure scrollHeight
      textarea.style.height = `${minHeight}px`;
      
      // Calculate new height based on content
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      
      textarea.style.height = `${newHeight}px`;
      setInputHeight(newHeight);
    }
  };

  // Reset textarea to single line
  const resetTextareaHeight = () => {
    if (inputRef.current) {
      const minHeight = 44;
      inputRef.current.style.height = `${minHeight}px`;
      setInputHeight(minHeight);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      onSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageTextChange(e.target.value);
    onTyping();
    autoResizeTextarea();
  };

  const handleInputFocus = () => {
    setInputFocused(true);
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };

  // WhatsApp-like mobile positioning with keyboard attachment
  const getContainerStyle = () => {
    if (!isMobile) {
      return {
        position: 'sticky' as const,
        bottom: 0,
        zIndex: 20
      };
    }

    // Use visualViewport for precise keyboard positioning
    const visualViewport = window.visualViewport;
    const keyboardOffset = visualViewport ? visualViewport.height : safeViewportHeight;
    
    return {
      position: 'fixed' as const,
      bottom: '0px',
      left: '0px',
      right: '0px',
      zIndex: 50,
      // Attach to keyboard level when visible
      transform: isKeyboardVisible 
        ? `translateY(-${keyboardHeight > 0 ? keyboardHeight : 0}px)` 
        : 'translateY(0px)',
      transition: 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // WhatsApp-like easing
      ...(isIOS && {
        paddingBottom: isKeyboardVisible ? '0px' : 'env(safe-area-inset-bottom, 20px)'
      })
    };
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`
        ${isMobile 
          ? 'p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700' 
          : 'p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700'
        } 
        flex-shrink-0 transition-all duration-200
        ${isMobile ? 'mobile-input-container' : ''}
        ${isKeyboardVisible ? 'keyboard-visible shadow-lg' : ''}
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

      <div className={`flex items-end space-x-3 ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
        <Popover open={isMediaPopoverOpen} onOpenChange={onSetMediaPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetMediaPopoverOpen(!isMediaPopoverOpen);
              }}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] relative z-[9999]"
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
            onInteractOutside={(e) => {
              // Prevent auto-close on file input interactions and media uploads
              const target = e.target as Element;
              if (target instanceof HTMLInputElement && target.type === 'file') {
                e.preventDefault();
                return;
              }
              // Prevent closing when clicking on media upload buttons
              if (target.closest('[data-media-upload]')) {
                e.preventDefault();
                return;
              }
            }}
            onPointerDownOutside={(e) => {
              const target = e.target as Element;
              if (target.closest('[data-media-upload]')) {
                e.preventDefault();
              }
            }}
          >
            <div className="grid gap-2">
              <div data-media-upload>
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
              </div>
              <div data-media-upload>
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
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="flex-1 relative" {...getRootProps()}>
          <input {...getInputProps()} />
          <Textarea
            ref={inputRef}
            value={messageText}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
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
              resize-none overflow-hidden
              ${isMobile 
                ? 'rounded-2xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-base leading-5' 
                : 'rounded-full border-gray-300 dark:border-gray-600 text-sm'
              }
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-all duration-200 ease-in-out
              ${isKeyboardVisible ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}
            `}
            style={{
              fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
              minHeight: `${inputHeight}px`,
              maxHeight: isMobile ? '120px' : '100px',
              lineHeight: isMobile ? '20px' : '18px',
              padding: isMobile ? '12px 16px' : '8px 12px'
            }}
            rows={1}
          />
        </div>
        
        <motion.div 
          whileTap={{ scale: 0.95 }}
          className="flex items-end pb-1"
        >
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSendMessage();
            }}
            size="icon"
            disabled={sending || !messageText.trim()}
            className={`
              rounded-full shadow-lg transition-all duration-200
              ${messageText.trim() 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl' 
                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }
              ${isMobile ? 'h-[44px] w-[44px]' : 'h-[40px] w-[40px]'}
            `}
          >
            {sending ? (
              <div className="flex items-center justify-center">
                <svg className="animate-pulse w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <Send className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} ${messageText.trim() ? 'text-white' : 'text-gray-500'}`} />
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput; 