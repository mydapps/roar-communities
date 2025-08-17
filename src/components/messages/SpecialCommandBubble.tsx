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
      roar: { bg: 'from-amber-500 via-orange-500 to-red-600', text: 'text-white' },
      roars: { bg: 'from-amber-500 via-orange-500 to-red-600', text: 'text-white' },
      magic: { bg: 'from-purple-600 via-indigo-600 to-amber-500', text: 'text-white' },
      gm: { bg: 'from-orange-400 via-yellow-500 to-amber-500', text: 'text-white' },
    };
    return colors[command] || { bg: 'from-gray-500 to-gray-600', text: 'text-white' };
  };

  const commandColors = getCommandColors();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <motion.div
        className={`
          relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl cursor-pointer
          transition-all duration-200 hover:scale-105 active:scale-95
          bg-gradient-to-r ${commandColors.bg} ${commandColors.text}
          shadow-sm hover:shadow-lg
        `}
      onClick={handleClick}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Content */}
      <div className="relative z-10">
        <span className="text-sm font-medium underline cursor-pointer leading-relaxed">
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

      {/* Glorious animated border for ROAR commands */}
      {(command === 'roar' || command === 'roars') && (
        <>
          {/* Golden glowing border */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-amber-400"
            animate={{
              opacity: [0.6, 1, 0.6],
              boxShadow: [
                '0 0 10px rgba(251, 191, 36, 0.5)',
                '0 0 25px rgba(251, 191, 36, 0.8)',
                '0 0 10px rgba(251, 191, 36, 0.5)'
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Pulsing lion emoji overlay */}
          <motion.div
            className="absolute -top-2 -right-2 text-2xl"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            👑
          </motion.div>
        </>
      )}

      {/* Magical animated effects for MAGIC command */}
      {command === 'magic' && (
        <>
          {/* Mystical glowing border with magical colors */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-purple-400"
            animate={{
              opacity: [0.5, 1, 0.5],
              boxShadow: [
                '0 0 15px rgba(147, 51, 234, 0.4)',
                '0 0 30px rgba(147, 51, 234, 0.8)',
                '0 0 15px rgba(147, 51, 234, 0.4)'
              ],
              borderColor: ['#a855f7', '#6366f1', '#f59e0b', '#a855f7']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Floating magical sparkles */}
          <motion.div
            className="absolute -top-1 -right-1 text-lg"
            animate={{
              scale: [1, 1.4, 1],
              rotate: [0, 360],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ✨
          </motion.div>
          
          {/* Secondary magical element */}
          <motion.div
            className="absolute -top-1 -left-1 text-lg"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, -360],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            🔮
          </motion.div>

          {/* Magic wand sparkle */}
          <motion.div
            className="absolute -bottom-1 -right-1 text-sm"
            animate={{
              scale: [0.8, 1.3, 0.8],
              y: [0, -5, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            🪄
          </motion.div>
        </>
      )}


      </motion.div>
    </div>
  );
};

export default SpecialCommandBubble; 