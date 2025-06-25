import React from 'react';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface BlockedUserInterfaceProps {
  otherUserHandle: string;
  isBlocking: boolean;
  onUnblockUser: () => void;
}

const BlockedUserInterface: React.FC<BlockedUserInterfaceProps> = ({
  otherUserHandle,
  isBlocking,
  onUnblockUser,
}) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-6 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800"
    >
      <div className="text-center">
        <UserX className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
          You have blocked this user
        </h3>
        <p className="text-red-600 dark:text-red-300 mb-4">
          You cannot send or receive messages from @{otherUserHandle}
        </p>
        <Button 
          variant="outline" 
          onClick={onUnblockUser}
          disabled={isBlocking}
          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          {isBlocking ? 'Unblocking...' : 'Unblock User'}
        </Button>
      </div>
    </motion.div>
  );
};

export default BlockedUserInterface; 