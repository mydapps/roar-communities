import * as React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps extends React.HTMLAttributes<HTMLDivElement> {
  onRefresh: () => Promise<any>;
  threshold?: number;
  className?: string;
  pullDownThreshold?: number;
  refreshingContent?: React.ReactNode;
  pullDownContent?: React.ReactNode;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 100,
  pullDownThreshold = 0.4,
  refreshingContent,
  pullDownContent,
  ...props
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [pullDown, setPullDown] = React.useState(false);
  const [pullDownDistance, setPullDownDistance] = React.useState(0);
  const touchStartY = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable pull to refresh if we're at the top of the container
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing) return;
    if (containerRef.current && containerRef.current.scrollTop > 0) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;
    
    // Only activate pull down if we're pulling down
    if (distance > 0) {
      setPullDown(true);
      setPullDownDistance(Math.min(distance * pullDownThreshold, threshold));
    } else {
      setPullDown(false);
      setPullDownDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;
    if (pullDown && pullDownDistance >= threshold) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error refreshing:", error);
      } finally {
        setRefreshing(false);
        setPullDown(false);
        setPullDownDistance(0);
      }
    } else {
      setPullDown(false);
      setPullDownDistance(0);
    }
  };

  const defaultRefreshingContent = (
    <div className="flex items-center justify-center h-16 w-full bg-background">
      <RefreshCw className="animate-spin h-8 w-8 text-primary" />
    </div>
  );

  const defaultPullDownContent = (
    <div 
      className="flex items-center justify-center h-16 w-full bg-background transition-transform"
      style={{ 
        transform: pullDownDistance > 0 ? 'translateY(0)' : 'translateY(-100%)',
        opacity: pullDownDistance / threshold
      }}
    >
      <RefreshCw 
        className={cn(
          "h-8 w-8 text-primary transition-transform", 
          pullDownDistance >= threshold ? "rotate-180" : ""
        )} 
      />
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={cn(className, "overscroll-behavior-contain")}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {pullDown && (pullDownContent || defaultPullDownContent)}
      {refreshing && (refreshingContent || defaultRefreshingContent)}
      <div
        style={{
          transform: pullDown ? `translateY(${pullDownDistance}px)` : 'none',
          transition: pullDown ? 'none' : 'transform 0.2s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
}
