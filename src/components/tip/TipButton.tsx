import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TipButtonProps {
  postCode: string;
  receiverHandle: string;
  onTipClick: () => void;
  tipCount?: number;
  hasUserTipped?: boolean;
  className?: string;
}

export const TipButton: React.FC<TipButtonProps> = ({
  postCode,
  receiverHandle,
  onTipClick,
  tipCount = 0,
  hasUserTipped = false,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onTapStart={() => setIsPressed(true)}
            onTap={() => setIsPressed(false)}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent post navigation
                console.log('TipButton clicked for post:', postCode);
                onTipClick();
              }}
              className={cn(
                "h-8 px-2 gap-1.5 text-muted-foreground hover:text-primary",
                "transition-all duration-200 relative overflow-hidden",
                "group hover:bg-primary/10 active:bg-primary/20",
                hasUserTipped && "text-primary bg-primary/5",
                className
              )}
            >
              {/* Sparkle animation background */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0,
                  background: isHovered ? "radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)" : "transparent"
                }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Tip icon with animation */}
              <motion.div
                className="relative"
                animate={{
                  rotate: isPressed ? [0, -10, 10, 0] : 0,
                  scale: hasUserTipped ? [1, 1.2, 1] : 1
                }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeInOut"
                }}
              >
                {hasUserTipped ? (
                  <Heart className="h-4 w-4 fill-current" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
              </motion.div>

              {/* Sparkle effect */}
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{
                  opacity: isHovered ? [0, 1, 0] : 0,
                  scale: isHovered ? [0.5, 1, 0.5] : 0.5,
                  rotate: isHovered ? [0, 180, 360] : 0
                }}
                transition={{
                  duration: 1,
                  repeat: isHovered ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="h-3 w-3 text-primary" />
              </motion.div>

              {/* Tip count */}
              {tipCount > 0 && (
                <motion.span
                  className="text-xs font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {tipCount}
                </motion.span>
              )}

              {/* Floating hearts animation on hover */}
              {isHovered && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-primary/60"
                      initial={{ 
                        opacity: 0, 
                        y: 0, 
                        x: Math.random() * 20 - 10,
                        scale: 0.5
                      }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        y: -20, 
                        scale: [0.5, 1, 0.3]
                      }}
                      transition={{ 
                        duration: 1.5,
                        delay: i * 0.2,
                        ease: "easeOut"
                      }}
                    >
                      <Heart className="h-2 w-2 fill-current" />
                    </motion.div>
                  ))}
                </div>
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-background border shadow-lg">
          <div className="text-center">
            <p className="font-medium">Tip @{receiverHandle}</p>
            <p className="text-xs text-muted-foreground">Show appreciation with ETH or ROAR</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 