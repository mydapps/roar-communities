import React from 'react';
import { ArrowLeft, MoreVertical, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

interface ConversationHeaderProps {
  conversationTitle: string;
  conversationAvatar: string;
  isOtherUserOnline: boolean;
  otherUserHandle: string;
  isUserBlocked: boolean;
  onBack: () => void;
  onBlockUser: () => void;
  onUnblockUser: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversationTitle,
  conversationAvatar,
  isOtherUserOnline,
  otherUserHandle,
  isUserBlocked,
  onBack,
  onBlockUser,
  onUnblockUser,
}) => {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
    >
      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack} 
          className="touch-manipulation min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={conversationAvatar || 'https://img.dapps.co/avatar/default.svg'} 
                alt={conversationTitle} 
              />
              <AvatarFallback>
                {conversationTitle.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online Status Indicator */}
            <div className="absolute -bottom-1 -right-1">
              {isOtherUserOnline ? (
                <div className="flex items-center justify-center w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900">
                  <Wifi className="h-2 w-2 text-white" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-4 h-4 bg-gray-400 rounded-full border-2 border-white dark:border-gray-900">
                  <WifiOff className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {conversationTitle}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isOtherUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="touch-manipulation min-h-[44px] min-w-[44px]"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isUserBlocked ? (
            <DropdownMenuItem 
              onClick={onUnblockUser}
              className="text-green-600 focus:text-green-600"
            >
              Unblock @{otherUserHandle}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={onBlockUser}
              className="text-red-600 focus:text-red-600"
            >
              Block @{otherUserHandle}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

export default ConversationHeader; 