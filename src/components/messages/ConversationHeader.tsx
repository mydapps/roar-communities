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
import { useIsMobile } from '@/hooks/use-mobile';
import { isIOSApp } from '@/utils/deviceUtils';
import { useNavigate } from 'react-router-dom';

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
  const isMobile = useIsMobile();
  const isIOS = isIOSApp();
  const navigate = useNavigate();

  // 🎯 Navigate to user profile
  const handleProfileClick = () => {
    if (otherUserHandle) {
      navigate(`/u/${otherUserHandle}`);
    }
  };

  // Mobile-first design
  if (isMobile) {
    return (
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`
          flex flex-col bg-white dark:bg-gray-900 
          border-b border-gray-200 dark:border-gray-700
          ${isIOS ? 'pt-12' : 'pt-6'}
        `}
        style={{
          paddingTop: isIOS ? 'max(env(safe-area-inset-top, 0px), 48px)' : '16px'
        }}
      >
        {/* Main header with user info */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center space-x-3 flex-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBack} 
              className="touch-manipulation min-h-[44px] min-w-[44px] -ml-2"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative">
                <Avatar 
                  className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                  onClick={handleProfileClick}
                >
                  <AvatarImage 
                    src={conversationAvatar || 'https://img.dapps.co/avatar/default.svg'} 
                    alt={conversationTitle} 
                  />
                  <AvatarFallback className="text-lg font-semibold">
                    {conversationTitle.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Online Status Indicator - Larger for mobile */}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <div className={`
                    w-4 h-4 rounded-full border-2 border-white dark:border-gray-900
                    ${isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'}
                  `} />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 
                  className="font-bold text-lg text-gray-900 dark:text-white truncate cursor-pointer hover:underline"
                  onClick={handleProfileClick}
                >
                  @{conversationTitle}
                </h2>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="touch-manipulation min-h-[44px] min-w-[44px]"
                >
                  <MoreVertical className="h-6 w-6" />
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
          </div>
        </div>

        {/* XMTP Security Banner */}
        <div className="flex items-center justify-center px-4 pb-2">
          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
            <img 
              src="/xmtp.png" 
              alt="XMTP" 
              className="h-4 w-4 opacity-70"
            />
            <span className="font-medium">Secured by XMTP</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Desktop design with proper spacing
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center space-x-4">
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
            <Avatar 
              className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
              onClick={handleProfileClick}
            >
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
              <div className={`
                w-4 h-4 rounded-full border-2 border-white dark:border-gray-900
                ${isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'}
              `} />
            </div>
          </div>
          
          <div>
            <h2 
              className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline"
              onClick={handleProfileClick}
            >
              @{conversationTitle}
            </h2>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <img 
                  src="/xmtp.png" 
                  alt="XMTP" 
                  className="h-3 w-3 opacity-70"
                />
                <span>Secured by XMTP</span>
            </div>
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