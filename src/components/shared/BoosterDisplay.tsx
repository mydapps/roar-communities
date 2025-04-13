import React from 'react';
import { Sparkles, ArrowRight, Clock, Gift } from 'lucide-react';
import { AvailableBoostersResponse } from '@/utils/apiBase';
import { formatDistanceToNow } from 'date-fns';

interface BoosterDisplayProps {
  boosters: AvailableBoostersResponse;
  onClick: () => void;
}

export const BoosterDisplay: React.FC<BoosterDisplayProps> = ({ boosters, onClick }) => {
  if (!boosters || (!boosters.boosters && !boosters.golden_boosters)) {
    return null;
  }

  const totalBoosters = boosters.total;
  
  return (
    <div 
      onClick={onClick}
      className="mt-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 
        rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-amber-100 
        dark:hover:bg-amber-800/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="bg-amber-200 dark:bg-amber-700/70 p-2 rounded-full">
            <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-200" />
          </div>
          {boosters.golden_boosters > 0 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-800 text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
              ✨
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {totalBoosters}x Booster{totalBoosters !== 1 ? 's' : ''} Available
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-300">
            Boost your farming rate!
          </p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-300" />
    </div>
  );
};

// Simple text-only version for displaying above buttons
export const SimpleBoosterDisplay: React.FC<BoosterDisplayProps> = ({ boosters, onClick }) => {
  if (!boosters || (!boosters.boosters && !boosters.golden_boosters)) {
    return null;
  }

  const totalBoosters = boosters.total;
  
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-center gap-1 mb-2 cursor-pointer"
    >
      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
      <p className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline">
        {totalBoosters}x Booster{totalBoosters !== 1 ? 's' : ''} Available
      </p>
    </div>
  );
};

interface BoosterDetailProps {
  id: number;
  activity: string;
  boost: number;
  received_on: string;
  isGolden?: boolean;
}

export const BoosterDetailItem: React.FC<BoosterDetailProps> = ({ 
  activity, 
  boost, 
  received_on,
  isGolden = false
}) => {
  const formattedTime = formatDistanceToNow(new Date(received_on), { addSuffix: true });
  
  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-lg mb-2
      ${isGolden 
        ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border border-yellow-200 dark:border-yellow-800/40' 
        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30'}
    `}>
      <div className={`
        p-2 rounded-full flex-shrink-0
        ${isGolden 
          ? 'bg-yellow-200 dark:bg-yellow-800/50' 
          : 'bg-amber-200 dark:bg-amber-800/50'}
      `}>
        {isGolden ? (
          <Gift className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
        ) : (
          <Sparkles className="h-5 w-5 text-amber-700 dark:text-amber-300" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className={`
            font-medium
            ${isGolden 
              ? 'text-yellow-800 dark:text-yellow-200' 
              : 'text-amber-800 dark:text-amber-200'}
          `}>
            {activity.charAt(0).toUpperCase() + activity.slice(1)}
          </p>
          <div className={`
            text-xs font-bold px-2 py-1 rounded-full
            ${isGolden 
              ? 'bg-yellow-200 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200' 
              : 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200'}
          `}>
            +{boost}x
          </div>
        </div>
        <div className="flex items-center mt-1 text-xs gap-1 text-amber-600 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          <span>Received {formattedTime}</span>
        </div>
      </div>
    </div>
  );
}; 