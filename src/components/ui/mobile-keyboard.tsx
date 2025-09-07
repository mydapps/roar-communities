import React from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  className?: string;
}

const MobileKeyboard: React.FC<MobileKeyboardProps> = ({ 
  onKeyPress, 
  onBackspace, 
  className 
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace']
  ];

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className={cn("bg-background border-t border-border", className)}>
      <div className="grid grid-cols-3 gap-1 p-4">
        {keys.flat().map((key, index) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleKeyPress(key)}
            className={cn(
              "h-14 rounded-xl font-semibold text-lg transition-colors",
              "active:bg-primary/20 hover:bg-muted/50",
              key === 'backspace' 
                ? "bg-muted/30 text-muted-foreground flex items-center justify-center" 
                : "bg-muted/10 text-foreground"
            )}
          >
            {key === 'backspace' ? (
              <Delete className="w-6 h-6" />
            ) : (
              key
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MobileKeyboard;

