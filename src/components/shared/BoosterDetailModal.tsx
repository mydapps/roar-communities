import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AvailableBoostersResponse } from '@/utils/apiBase';
import { BoosterDetailItem } from './BoosterDisplay';
import { Sparkles } from 'lucide-react';

interface BoosterDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boosterData: AvailableBoostersResponse | null;
}

export const BoosterDetailModal: React.FC<BoosterDetailModalProps> = ({ 
  open, 
  onOpenChange,
  boosterData
}) => {
  const isMobile = useIsMobile();
  
  if (!boosterData) return null;
  
  const { base_value, effective_total, booster_details, golden_booster_details } = boosterData;
  
  const BoosterContent = () => (
    <div className="space-y-4 mt-2">
      {/* Summary */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 
                    rounded-lg p-4 border border-amber-200 dark:border-amber-700/40">
        <div className="flex items-center justify-between mb-3">
          <div className="text-amber-800 dark:text-amber-200 text-sm font-medium">Base farming rate</div>
          <div className="bg-white dark:bg-black/20 px-2 py-1 rounded text-sm font-bold text-amber-700 dark:text-amber-300">
            {base_value}x
          </div>
        </div>
        
        {(booster_details.length > 0 || golden_booster_details.length > 0) && (
          <div className="flex items-center justify-between mb-3">
            <div className="text-amber-800 dark:text-amber-200 text-sm font-medium">Boosters</div>
            <div className="bg-amber-200 dark:bg-amber-800/50 px-2 py-1 rounded text-sm font-bold text-amber-700 dark:text-amber-300">
              +{(effective_total - base_value).toFixed(1)}x
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-amber-700/40">
          <div className="text-amber-800 dark:text-amber-200 text-sm font-bold">Effective farming rate</div>
          <div className="bg-gradient-to-r from-amber-300 to-amber-400 dark:from-amber-600 dark:to-amber-700 
                         px-3 py-1 rounded text-sm font-bold text-amber-800 dark:text-amber-100 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {effective_total.toFixed(1)}x
          </div>
        </div>
      </div>
      
      {/* Golden Boosters */}
      {golden_booster_details.length > 0 && (
        <div>
          <h3 className="text-amber-800 dark:text-amber-200 font-semibold mb-2 flex items-center gap-1">
            <span className="text-yellow-500">✨</span> 
            Golden Boosters
          </h3>
          <div className="space-y-2">
            {golden_booster_details.map((booster) => (
              <BoosterDetailItem 
                key={booster.id}
                id={booster.id}
                activity={booster.activity}
                boost={booster.boost}
                received_on={booster.received_on}
                isGolden={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Regular Boosters */}
      {booster_details.length > 0 && (
        <div>
          <h3 className="text-amber-800 dark:text-amber-200 font-semibold mb-2">Regular Boosters</h3>
          <div className="space-y-2">
            {booster_details.map((booster) => (
              <BoosterDetailItem 
                key={booster.id}
                id={booster.id}
                activity={booster.activity}
                boost={booster.boost}
                received_on={booster.received_on}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state - no boosters */}
      {booster_details.length === 0 && golden_booster_details.length === 0 && (
        <div className="text-center p-6">
          <p className="text-amber-600 dark:text-amber-400">No boosters currently available</p>
        </div>
      )}
    </div>
  );
  
  // Render conditionally based on device
  return isMobile ? (
    // Mobile: Bottom sheet (Drawer)
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pt-3 pb-6 max-h-[85vh] overflow-y-auto">
        <DrawerHeader className="px-0 pb-2">
          <DrawerTitle>Booster Details</DrawerTitle>
          <DrawerDescription>
            Boosters increase your Roar farming rate
          </DrawerDescription>
        </DrawerHeader>
        <BoosterContent />
      </DrawerContent>
    </Drawer>
  ) : (
    // Desktop: Right side modal (Sheet)
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Booster Details</SheetTitle>
          <SheetDescription>
            Boosters increase your Roar farming rate
          </SheetDescription>
        </SheetHeader>
        <BoosterContent />
      </SheetContent>
    </Sheet>
  );
}; 