
import { useIsMobile } from '@/hooks/use-mobile';

// Additional export for direct use without the hook
export const isMobile = (): boolean => {
  // Check if it's client-side
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};
