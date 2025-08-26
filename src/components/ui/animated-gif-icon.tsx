import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGifIconProps {
  className?: string;
  size?: number;
}

export const AnimatedGifIcon: React.FC<AnimatedGifIconProps> = ({ 
  className, 
  size = 20 
}) => {
  return (
    <div 
      className={cn("inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        {/* Background rounded rectangle */}
        <rect 
          x="2" 
          y="6" 
          width="20" 
          height="12" 
          rx="3" 
          ry="3" 
          fill="currentColor" 
          fillOpacity="0.1"
          stroke="currentColor" 
          strokeWidth="1.5"
        />
        
        {/* G letter */}
        <g className="animate-pulse">
          <path 
            d="M6 10.5h2v3H6.5V12H8v1.5H6V10.5z M6 9.5V14h2.5v-1.5H10V9.5H6z" 
            fill="currentColor"
          />
        </g>
        
        {/* I letter */}
        <g className="animate-pulse" style={{ animationDelay: '0.2s' }}>
          <rect 
            x="11" 
            y="9.5" 
            width="1.5" 
            height="4.5" 
            fill="currentColor"
          />
          <rect 
            x="10.5" 
            y="9" 
            width="2.5" 
            height="1" 
            fill="currentColor"
          />
          <rect 
            x="10.5" 
            y="14" 
            width="2.5" 
            height="1" 
            fill="currentColor"
          />
        </g>
        
        {/* F letter */}
        <g className="animate-pulse" style={{ animationDelay: '0.4s' }}>
          <rect 
            x="15" 
            y="9.5" 
            width="1.5" 
            height="4.5" 
            fill="currentColor"
          />
          <rect 
            x="15" 
            y="9.5" 
            width="3" 
            height="1" 
            fill="currentColor"
          />
          <rect 
            x="15" 
            y="11.5" 
            width="2.5" 
            height="1" 
            fill="currentColor"
          />
        </g>
        
        {/* Animated dots to suggest motion */}
        <g className="animate-bounce" style={{ animationDelay: '0.1s' }}>
          <circle cx="19" cy="8" r="1" fill="currentColor" fillOpacity="0.6" />
        </g>
        <g className="animate-bounce" style={{ animationDelay: '0.3s' }}>
          <circle cx="19" cy="10" r="0.8" fill="currentColor" fillOpacity="0.4" />
        </g>
        <g className="animate-bounce" style={{ animationDelay: '0.5s' }}>
          <circle cx="19" cy="12" r="0.6" fill="currentColor" fillOpacity="0.3" />
        </g>
      </svg>
    </div>
  );
};
