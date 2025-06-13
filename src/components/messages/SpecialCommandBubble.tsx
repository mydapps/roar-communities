import React from 'react';
import { motion } from 'framer-motion';
import { getCommandDisplayText, extractCommand, type SpecialCommand } from '../../utils/specialCommands';

interface SpecialCommandBubbleProps {
  message: string;
  isOwn: boolean;
  onClick: (command: SpecialCommand) => void;
}

const SpecialCommandBubble: React.FC<SpecialCommandBubbleProps> = ({ 
  message, 
  isOwn, 
  onClick 
}) => {
  const command = extractCommand(message);
  if (!command) return null;

  const displayText = getCommandDisplayText(command);

  const handleClick = () => {
    onClick(command);
  };

  // Get command-specific colors
  const getCommandColors = () => {
    const colors = {
      buzz: { bg: 'from-red-500 to-orange-500', text: 'text-white' },
      eth: { bg: 'from-blue-500 to-indigo-600', text: 'text-white' },
      ethereum: { bg: 'from-blue-500 to-indigo-600', text: 'text-white' },
      btc: { bg: 'from-orange-500 to-yellow-600', text: 'text-white' },
      bitcoin: { bg: 'from-orange-500 to-yellow-600', text: 'text-white' },
      base: { bg: 'from-blue-600 to-cyan-600', text: 'text-white' },
      sol: { bg: 'from-purple-500 to-pink-600', text: 'text-white' },
      solana: { bg: 'from-purple-500 to-pink-600', text: 'text-white' },
      dapps: { bg: 'from-blue-500 via-purple-500 to-pink-500', text: 'text-white' },
      heart: { bg: 'from-pink-500 to-red-500', text: 'text-white' },
      love: { bg: 'from-pink-500 to-red-500', text: 'text-white' },
    };
    return colors[command] || { bg: 'from-gray-500 to-gray-600', text: 'text-white' };
  };

  const commandColors = getCommandColors();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <motion.div
        className={`
          relative inline-block px-3 py-2 rounded-2xl cursor-pointer
          transition-all duration-200 hover:scale-105 active:scale-95
          bg-gradient-to-r ${commandColors.bg} ${commandColors.text}
          shadow-lg hover:shadow-xl border-2 border-transparent hover:border-white/20
        `}
      onClick={handleClick}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Content */}
      <div className="relative z-10">
        <span className="text-base font-medium underline cursor-pointer">
          /{command}
        </span>
      </div>

      {/* Animated border for DAPPS */}
      {command === 'dapps' && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2"
          style={{
            borderImage: 'linear-gradient(45deg, #3B82F6, #8B5CF6, #EC4899) 1',
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      </motion.div>
    </div>
  );
};

export default SpecialCommandBubble; 