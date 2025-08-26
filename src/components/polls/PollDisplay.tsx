import React, { useState, useEffect } from 'react';
import { PollData } from '@/utils/postApi';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { processTextContent } from '@/utils/textFormatting';

interface PollDisplayProps {
  pollQuestion: string;
  pollData: PollData;
  onVote: (optionId: number) => Promise<void>;
  postCode: string;
  className?: string;
}

export const PollDisplay: React.FC<PollDisplayProps> = ({ 
  pollQuestion, 
  pollData, 
  onVote, 
  className 
}) => {
  const [votingOptionId, setVotingOptionId] = useState<number | null>(null);
  const [resultsVisible, setResultsVisible] = useState(false);

  const showResults = !pollData.is_active || pollData.user_has_voted;

  useEffect(() => {
    if (showResults) {
      const timer = setTimeout(() => setResultsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [showResults]);

  const handleVote = async (optionId: number) => {
    if (votingOptionId || !pollData.is_active) return;
    
    setVotingOptionId(optionId);
    try {
      await onVote(optionId);
    } catch (error) {
      console.error("Error voting on poll:", error);
    } finally {
      setVotingOptionId(null);
    }
  };

  const optionsWithImagesCount = pollData.options.filter(opt => !!opt.imageUrl).length;
  const useTwoImageRowLayout = pollData.options.length === 2 && optionsWithImagesCount === 2;
  const useMultiImageGridLayout = (pollData.options.length === 3 || pollData.options.length === 4) && optionsWithImagesCount === pollData.options.length;

  return (
    <div className={cn("my-4 p-1", className)}> 
      {pollQuestion && (
        <div 
          className="text-xl font-bold mb-5 text-card-foreground dark:text-slate-100 leading-tight text-center px-2"
          dangerouslySetInnerHTML={{ __html: pollQuestion }}
        />
      )}

      <div className={cn(
        "grid",
        useTwoImageRowLayout ? "grid-cols-2 gap-3 sm:gap-4" :
        useMultiImageGridLayout ? "grid-cols-2 gap-3 sm:gap-4" :
        "grid-cols-1 gap-3 sm:gap-4"
      )}>
        {pollData.options.map((option, index) => {
          const isChosenOption = pollData.user_has_voted && pollData.chosen_option_id === option.option_id;
          const percentage = pollData.total_votes > 0 ? (option.vote_count / pollData.total_votes) * 100 : 0;
          const displayPercentage = percentage.toFixed(0);

          return (
            <div
              key={option.option_id}
              onClick={(e) => {
                e.stopPropagation();
                if (pollData.is_active) {
                  handleVote(option.option_id);
                }
              }}
              className={cn(
                "relative rounded-xl border-2 transition-all duration-300 ease-out overflow-hidden",
                "transform hover:scale-[1.03] focus-within:scale-[1.03]",
                "bg-card",
                pollData.is_active 
                    ? "cursor-pointer focus-within:border-primary shadow-lg hover:shadow-xl focus-within:shadow-xl"
                    : "shadow-md opacity-80",
                
                (isChosenOption && showResults)
                    ? "border-primary/70 ring-2 ring-primary/50"
                    : (showResults)
                        ? (pollData.is_active ? "hover:border-primary/60 border-transparent" : "border-transparent")
                        : (pollData.is_active ? "border-border/30 hover:border-primary/60" : "border-border/30"),
                
                votingOptionId === option.option_id && "opacity-70 scale-95 cursor-wait"
              )}
              role={pollData.is_active ? "button" : undefined}
              tabIndex={pollData.is_active ? 0 : -1}
              aria-disabled={votingOptionId === option.option_id || !pollData.is_active}
            >
              <div 
                className={cn(
                  "absolute top-0 left-0 bottom-0 transition-all duration-500 ease-in-out",
                  isChosenOption && showResults ? "bg-primary/80 dark:bg-primary/70" :
                  showResults ? "bg-muted dark:bg-slate-700/60" :
                  "bg-card dark:bg-slate-800"
                 )}
                style={{ width: showResults && resultsVisible ? `${percentage}%` : (showResults ? '0%': '100%')}} 
              />
              
              <div className={cn("relative z-10 p-4 flex flex-col h-full", option.imageUrl ? "min-h-[150px] sm:min-h-[180px]" : "min-h-[60px]")}>
                {option.imageUrl && (
                  <div className={cn(
                    "w-full rounded-lg overflow-hidden mb-3 shadow-inner",
                    useTwoImageRowLayout || useMultiImageGridLayout ? "aspect-w-1 aspect-h-1" : "aspect-w-16 aspect-h-9"
                    )}>
                    <img 
                      src={option.imageUrl} 
                      alt={option.text || `Poll option ${index + 1}`}
                      className="object-cover w-full h-full" 
                    />
                  </div>
                )}

                <div className="flex items-center justify-between flex-grow">
                  <div className={cn(
                    "font-semibold break-words",
                    showResults && isChosenOption ? "text-black" : "text-card-foreground dark:text-slate-100",
                    option.imageUrl ? "text-sm sm:text-base" : "text-base sm:text-lg"
                  )}>
                    {processTextContent(option.text)}
                  </div>
                  {showResults && isChosenOption && (
                     <CheckCircle2 className="h-5 w-5 text-black ml-2 flex-shrink-0" />
                  )}
                </div>

                {showResults && (
                  <div className="mt-2 flex items-end justify-between w-full">
                    <span className={cn(
                      "text-xs",
                      isChosenOption ? "text-primary-foreground/80 dark:text-slate-300" : "text-muted-foreground dark:text-slate-400"
                    )}>
                      {option.vote_count} {option.vote_count === 1 ? 'vote' : 'votes'}
                    </span>
                    <span className={cn(
                      "font-bold text-lg sm:text-xl",
                      isChosenOption ? "text-black" : "text-card-foreground dark:text-slate-100"
                    )}>
                      {displayPercentage}%
                    </span>
                  </div>
                )}

                {!showResults && votingOptionId === option.option_id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-between items-center text-sm px-1">
        <span className="text-muted-foreground dark:text-slate-400">
          Total votes: <Badge variant="outline" className="font-semibold bg-background dark:bg-slate-700 dark:text-slate-200">{pollData.total_votes}</Badge>
        </span>
        {!pollData.is_active && <Badge variant="destructive" className="font-semibold">Poll Ended</Badge>}
      </div>
    </div>
  );
}; 